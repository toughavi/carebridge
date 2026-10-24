// Shared helpers for the CareBridge server functions (Vercel, Node 20+).
// Files whose names start with "_" are not exposed as routes.
import crypto from 'node:crypto';

export const env = (k, d = '') => (process.env[k] !== undefined && process.env[k] !== '' ? process.env[k] : d);

/* ---------- Responses ---------- */
export function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
export function twiml(res, inner) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.end('<?xml version="1.0" encoding="UTF-8"?><Response>' + inner + '</Response>');
}
export const esc = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

/* ---------- Requests ---------- */
export async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = '';
  if (typeof req.body === 'string') raw = req.body;
  else if (Buffer.isBuffer(req.body)) raw = req.body.toString('utf8');
  else { const chunks = []; for await (const c of req) chunks.push(Buffer.from(c)); raw = Buffer.concat(chunks).toString('utf8'); }
  if (!raw) return {};
  const ct = String(req.headers['content-type'] || '');
  if (ct.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  try { return JSON.parse(raw); } catch { return Object.fromEntries(new URLSearchParams(raw)); }
}
export const query = (req) => Object.fromEntries(new URL(req.url, 'http://local').searchParams);
export function host(req) { return req.headers['x-forwarded-host'] || req.headers.host || ''; }
export function baseUrl(req) {
  const fixed = env('PUBLIC_BASE_URL');
  if (fixed) return fixed.replace(/\/$/, '');
  return (req.headers['x-forwarded-proto'] || 'https') + '://' + host(req);
}
/* Endpoints the page calls must come from the page itself, not from other websites. */
export function fromOurPage(req) {
  const origin = req.headers.origin;
  if (origin) { try { return new URL(origin).host === host(req); } catch { return false; } }
  return req.headers['x-carebridge'] === '1';
}

/* ---------- Phone numbers: calls and texts only go to numbers on the approved list ---------- */
export function normPhone(p) {
  const d = String(p || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d.startsWith('1')) return '+' + d;
  return d;
}
export function allowedNumber(p) {
  const list = env('ALLOWED_NUMBERS').split(',').map((x) => normPhone(x.trim())).filter(Boolean);
  return list.includes(normPhone(p));
}

/* ---------- Small key-value database (Upstash Redis REST, added from Vercel → Storage) ---------- */
const kvUrl = () => env('KV_REST_API_URL') || env('UPSTASH_REDIS_REST_URL');
const kvToken = () => env('KV_REST_API_TOKEN') || env('UPSTASH_REDIS_REST_TOKEN');
export const kvConfigured = () => !!(kvUrl() && kvToken());
export async function kv(...cmd) {
  const r = await fetch(kvUrl(), { method: 'POST', headers: { Authorization: 'Bearer ' + kvToken(), 'Content-Type': 'application/json' }, body: JSON.stringify(cmd.map(String)) });
  const j = await r.json();
  if (j.error) throw new Error('Database: ' + j.error);
  return j.result;
}
export async function kvGet(key) { const v = await kv('GET', key); return v ? JSON.parse(v) : null; }
export async function kvSet(key, value, ttlSeconds = 14 * 86400) { return kv('SET', key, JSON.stringify(value), 'EX', ttlSeconds); }

/* ---------- Twilio (calls and texts) ---------- */
export const twilioConfigured = () => !!(env('TWILIO_ACCOUNT_SID') && env('TWILIO_AUTH_TOKEN') && env('TWILIO_FROM_NUMBER'));
export async function twilio(path, params) {
  const sid = env('TWILIO_ACCOUNT_SID');
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) (Array.isArray(v) ? v : [v]).forEach((x) => form.append(k, String(x)));
  const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/' + path, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + env('TWILIO_AUTH_TOKEN')).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Twilio: ' + (j.message || r.status));
  return j;
}
/* Twilio signs every webhook; reject anything that is not really from Twilio. */
export function fromTwilio(req, params) {
  if (env('SKIP_TWILIO_SIGNATURE') === '1') return true;
  const sig = req.headers['x-twilio-signature'];
  if (!sig || !env('TWILIO_AUTH_TOKEN')) return false;
  const url = baseUrl(req) + req.url;
  const data = url + Object.keys(params || {}).sort().map((k) => k + params[k]).join('');
  const expected = crypto.createHmac('sha1', env('TWILIO_AUTH_TOKEN')).update(Buffer.from(data, 'utf-8')).digest('base64');
  const a = Buffer.from(String(sig)), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------- Claude ---------- */
export const claudeConfigured = () => !!env('ANTHROPIC_API_KEY');
export async function claude({ system, messages, maxTokens = 800, model }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: model || env('CLAUDE_MODEL', 'claude-haiku-5-5'), max_tokens: maxTokens, system, messages })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Claude: ' + ((j.error && j.error.message) || r.status));
  return (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}
export function parseJSON(text) {
  try { return JSON.parse(text); } catch { /* keep looking */ }
  const fence = String(text).match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch { /* keep looking */ } }
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch { /* give up */ } }
  return null;
}

/* ---------- Push notifications ---------- */
export const pushConfigured = () => !!(env('VAPID_PUBLIC_KEY') && env('VAPID_PRIVATE_KEY'));

/* ---------- Ids ---------- */
export const newId = (bytes = 12) => crypto.randomBytes(bytes).toString('base64url');
export const hashId = (s) => crypto.createHash('sha256').update(String(s)).digest('base64url').slice(0, 22);

/* ---------- A simple per-minute limit so nobody can run up the bill ---------- */
export async function underLimit(req, bucket, perMinute) {
  if (!kvConfigured()) return true;
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim();
  const key = 'rl:' + bucket + ':' + hashId(ip) + ':' + Math.floor(Date.now() / 60000);
  const n = await kv('INCR', key);
  if (Number(n) === 1) await kv('EXPIRE', key, 120);
  return Number(n) <= perMinute;
}
