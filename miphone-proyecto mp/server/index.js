// Servidor del sorteo MiPhone: sitio estático + API de pagos con Mercado Pago (Checkout Pro).
// Sin dependencias externas: solo Node 20.6 o superior.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as store from './store.js';
import * as mp from './mp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const PACKS = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/packs.json'), 'utf8')).packs; // [chances, precio, destacado?]

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json' };
const PUBLIC_DIRS = ['css', 'js', 'assets', 'staff'];

const log = (...a) => console.log(new Date().toISOString(), ...a);
const safeEq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

function readJson(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Cuerpo demasiado grande'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(Object.assign(new Error('JSON inválido'), { status: 400 })); } });
    req.on('error', reject);
  });
}

const hits = new Map();
function limited(req, key, max, windowMs = 60000) {
  const ip = (process.env.TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '') || req.socket.remoteAddress;
  const k = key + ':' + ip, now = Date.now(), arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(k, arr);
  return arr.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 60000)) hits.delete(k); }, 60000).unref();

const publicOrder = (o) => ({ id: o.id, status: o.status, chances: o.chances, amount: o.amount, method: o.method, nums: o.status === 'approved' ? o.nums : [] });

/** Consulta el pago en Mercado Pago y actualiza el pedido. Nunca confía en lo que mande el cliente. */
async function reconcile(order, paymentId) {
  const p = await mp.getPayment(paymentId);
  if (p.external_reference !== order.id) return order;               // el pago es de otro pedido
  if (p.status === 'approved') {
    if (Number(p.transaction_amount) !== order.amount || p.currency_id !== 'ARS') {
      log('ALERTA: monto o moneda no coinciden', order.id, p.transaction_amount, p.currency_id); return order;
    }
    return store.approveOrder(order.id, p.id);
  }
  if (order.status === 'pending' && (p.status === 'rejected' || p.status === 'cancelled')) return store.updateOrder(order.id, { status: 'rejected', paymentId: String(p.id) });
  return order;
}

const T = (s, max) => String(s ?? '').trim().slice(0, max);

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/packs') return send(res, 200, { packs: PACKS, mp: mp.mpEnabled() });

  if (route === 'POST /api/checkout') {
    if (limited(req, 'checkout', 10)) return send(res, 429, { error: 'Demasiados intentos. Probá de nuevo en un minuto.' });
    const b = await readJson(req);
    const pack = PACKS.find((p) => p[0] === Number(b.chances));          // el precio sale SIEMPRE del servidor
    const name = T(b.name, 80), email = T(b.email, 120).toLowerCase(), phone = T(b.phone, 30), dni = String(b.dni ?? '').replace(/\D/g, '');
    const method = b.method === 'transfer' ? 'transfer' : 'mp';
    if (!pack) return send(res, 400, { error: 'Pack inválido.' });
    if (name.length < 3 || !/^\d{7,9}$/.test(dni) || !/^\S+@\S+\.\S+$/.test(email) || phone.length < 6) return send(res, 400, { error: 'Revisá tus datos.' });
    if (method === 'mp' && !mp.mpEnabled()) return send(res, 503, { error: 'Mercado Pago no está disponible por ahora.' });

    const order = store.createOrder({ chances: pack[0], amount: pack[1], name, dni, email, phone, method });
    if (method === 'transfer') return send(res, 201, { orderId: order.id, token: order.token, status: 'pending' });
    try {
      const pref = await mp.createPreference({ order, baseUrl: BASE_URL });
      store.updateOrder(order.id, { preferenceId: pref.id });
      return send(res, 201, { orderId: order.id, token: order.token, url: pref.init_point });
    } catch (e) {
      log('Error creando preferencia', order.id, e.message);
      store.updateOrder(order.id, { status: 'failed' });
      return send(res, 502, { error: 'No pudimos iniciar el pago. Intentá de nuevo.' });
    }
  }

  let m;
  if ((m = url.pathname.match(/^\/api\/orders\/(MIP-\d{6})$/)) && req.method === 'GET') {
    let o = store.getOrder(m[1]);
    if (!o || !safeEq(o.token, url.searchParams.get('t') || '')) return send(res, 404, { error: 'Pedido no encontrado.' });
    const paymentId = url.searchParams.get('payment_id');
    if (o.status === 'pending' && o.method === 'mp' && /^\d{1,20}$/.test(paymentId || '')) {
      try { o = await reconcile(o, paymentId); } catch (e) { log('reconcile', o.id, e.message); }
    }
    return send(res, 200, publicOrder(o));
  }

  if (route === 'GET /api/lookup') {
    if (limited(req, 'lookup', 20)) return send(res, 429, { error: 'Demasiadas consultas. Esperá un minuto.' });
    const q = T(url.searchParams.get('q'), 120).toLowerCase();
    if (!q) return send(res, 400, { error: 'Ingresá tu email o código de pedido.' });
    const found = store.allOrders().filter((o) => o.status === 'approved' && (o.id.toLowerCase() === q || o.email === q));
    return send(res, 200, { orders: found.map((o) => ({ id: o.id, nums: o.nums })) });
  }

  if (route === 'POST /api/mp/webhook') {
    const dataId = url.searchParams.get('data.id') || '';
    const body = await readJson(req).catch(() => ({}));
    const id = dataId || String(body?.data?.id || '');
    const type = url.searchParams.get('type') || url.searchParams.get('topic') || body?.type || '';
    if (process.env.MP_WEBHOOK_SECRET) {
      if (!mp.verifySignature({ headers: req.headers, dataId: id })) { log('Webhook con firma inválida'); return send(res, 401, { error: 'firma inválida' }); }
    } else log('AVISO: MP_WEBHOOK_SECRET no configurada; se acepta el webhook sin firma (el pago igual se verifica contra la API).');
    if (type !== 'payment' || !/^\d{1,20}$/.test(id)) return send(res, 200, { ok: true });
    try {
      const p = await mp.getPayment(id);
      const order = store.getOrder(p.external_reference);
      if (order) { await reconcile(order, id); log('Webhook', id, p.status, order.id); }
      return send(res, 200, { ok: true });
    } catch (e) {
      log('Webhook error', id, e.message);
      return send(res, e.status === 404 ? 200 : 500, { ok: false });   // 500 => Mercado Pago reintenta
    }
  }

  // Administración mínima (transferencias): Authorization: Bearer <ADMIN_TOKEN>
  if (url.pathname.startsWith('/api/admin/')) {
    const adminToken = process.env.ADMIN_TOKEN;
    const given = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!adminToken || !safeEq(given, adminToken)) return send(res, 401, { error: 'No autorizado.' });
    if (route === 'GET /api/admin/orders') return send(res, 200, { orders: store.allOrders().map(({ token, ...o }) => o) });
    if ((m = url.pathname.match(/^\/api\/admin\/orders\/(MIP-\d{6})\/approve$/)) && req.method === 'POST') {
      const o = store.getOrder(m[1]);
      if (!o) return send(res, 404, { error: 'Pedido no encontrado.' });
      return send(res, 200, publicOrder(store.approveOrder(o.id)));
    }
  }

  return send(res, 404, { error: 'No encontrado.' });
}

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '/index.html') rel = '/index.html';
  else if (rel.endsWith('/') && PUBLIC_DIRS.includes(rel.split('/')[1])) rel += 'index.html';
  else if (!PUBLIC_DIRS.includes(rel.split('/')[1])) { res.writeHead(404); return res.end('No encontrado'); }
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('No encontrado'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) await api(req, res, url); else serveStatic(req, res, url);
  } catch (e) {
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Error interno.' });
    if (!e.status) log('ERROR', e);
  }
}).listen(PORT, () => {
  log(`Servidor en ${BASE_URL} (puerto ${PORT})`);
  if (!mp.mpEnabled()) log('AVISO: falta MP_ACCESS_TOKEN; Mercado Pago queda deshabilitado.');
  if (!BASE_URL.startsWith('https://')) log('AVISO: BASE_URL no es https; sin auto_return ni webhook (solo sirve para pruebas locales).');
});
