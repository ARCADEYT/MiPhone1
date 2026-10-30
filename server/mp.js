// Cliente mínimo de la API oficial de Mercado Pago (Checkout Pro) + verificación del webhook.
import crypto from 'node:crypto';

const API = process.env.MP_API_BASE || 'https://api.mercadopago.com';
const token = () => process.env.MP_ACCESS_TOKEN;
export const mpEnabled = () => Boolean(token());

async function call(method, path, body, extraHeaders = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw Object.assign(new Error(`Mercado Pago ${res.status}: ${text.slice(0, 300)}`), { status: res.status });
  return json;
}

/** Crea la preferencia de pago y devuelve la URL del Checkout Pro (init_point). */
export function createPreference({ order, baseUrl }) {
  const https = baseUrl.startsWith('https://');
  const back = (s) => `${baseUrl}/?order=${order.id}&t=${order.token}&mp=${s}`;
  const [first, ...rest] = order.name.trim().split(/\s+/);
  const body = {
    items: [{
      id: `pack-${order.chances}`,
      title: `MiPhone Catamarca · ${order.chances} ${order.chances === 1 ? 'chance' : 'chances'}`,
      quantity: 1, unit_price: order.amount, currency_id: 'ARS',
    }],
    payer: { name: first, surname: rest.join(' ') || undefined, email: order.email, identification: { type: 'DNI', number: order.dni } },
    external_reference: order.id,
    back_urls: { success: back('success'), failure: back('failure'), pending: back('pending') },
    statement_descriptor: 'MIPHONE',
    expires: false,
  };
  // Mercado Pago solo acepta auto_return y notification_url con direcciones https públicas.
  if (https) { body.auto_return = 'approved'; body.notification_url = `${baseUrl}/api/mp/webhook`; }
  return call('POST', '/checkout/preferences', body, { 'X-Idempotency-Key': order.id });
}

export const getPayment = (id) => call('GET', `/v1/payments/${encodeURIComponent(id)}`);

/**
 * Valida la firma x-signature del webhook (https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks).
 * manifest = `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`  →  HMAC-SHA256 con la clave secreta.
 */
export function verifySignature({ headers, dataId }) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;
  const sig = String(headers['x-signature'] || '');
  const parts = Object.fromEntries(sig.split(',').map((p) => p.trim().split('=').map((s) => s.trim())));
  if (!parts.ts || !parts.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : String(dataId);
  const manifest = `id:${id};request-id:${headers['x-request-id'] || ''};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
