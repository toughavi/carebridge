// POST /api/push/send — show a notification on the senior's phone right now. Body: { id, title, body }
import { send, readBody, fromOurPage, pushConfigured, kvGet } from '../_lib.js';
import { pushTo } from './_push.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  if (!fromOurPage(req)) return send(res, 403, { error: 'Not allowed' });
  if (!pushConfigured()) return send(res, 503, { error: 'Push is not set up on this server' });
  const b = await readBody(req);
  const sub = b.id && (await kvGet('pushsub:' + b.id));
  if (!sub) return send(res, 404, { error: 'Unknown phone' });
  try { await pushTo(sub, { title: String(b.title || 'CareBridge').slice(0, 120), body: String(b.body || '').slice(0, 300) }); send(res, 200, { ok: true }); }
  catch (e) { send(res, 502, { error: String(e.message || e) }); }
}
