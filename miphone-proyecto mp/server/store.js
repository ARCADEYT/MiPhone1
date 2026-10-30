// Almacenamiento simple en un archivo JSON (suficiente para empezar con un solo servidor).
// Para mucho tráfico o varios servidores, migrá esto a una base de datos real (Postgres, etc.).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const FILE = path.resolve(process.env.DATA_FILE || 'data/orders.json');
const MAX_NUMBER = 100000; // números 00000–99999

let db = { orders: {} };
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { /* primer arranque */ }

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, FILE); // escritura atómica
}

export const getOrder = (id) => db.orders[id] || null;
export const allOrders = () => Object.values(db.orders);

export function createOrder(data) {
  let id;
  do { id = 'MIP-' + crypto.randomInt(100000, 1000000); } while (db.orders[id]);
  const order = {
    id, token: crypto.randomBytes(16).toString('hex'), createdAt: Date.now(),
    status: 'pending', paymentId: null, nums: [], ...data,
  };
  db.orders[id] = order; save();
  return order;
}

export function updateOrder(id, patch) { Object.assign(db.orders[id], patch); save(); return db.orders[id]; }

function usedNumbers() {
  const s = new Set();
  for (const o of Object.values(db.orders)) for (const n of o.nums) s.add(n);
  return s;
}

/** Aprueba el pedido y le asigna números únicos al azar. Es idempotente: si ya estaba aprobado no hace nada. */
export function approveOrder(id, paymentId) {
  const o = db.orders[id];
  if (!o) throw new Error('Pedido inexistente');
  if (o.status === 'approved') return o;
  const used = usedNumbers();
  if (MAX_NUMBER - used.size < o.chances) throw new Error('No quedan suficientes números disponibles');
  const nums = new Set();
  while (nums.size < o.chances) { const n = crypto.randomInt(0, MAX_NUMBER); if (!used.has(n)) nums.add(n); }
  o.nums = [...nums].sort((a, b) => a - b);
  o.status = 'approved'; o.approvedAt = Date.now();
  if (paymentId) o.paymentId = String(paymentId);
  save();
  return o;
}
