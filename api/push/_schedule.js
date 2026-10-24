// POST /api/push/schedule — the app keeps the server's list of upcoming reminders up to date.
// Body: { id, items: [{ key, at (ms), title, body }] }. The daily job sends the ones that are due.
import { send, readBody, fromOurPage, pushConfigured, kvConfigured, kvGet, kvSet } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  if (!fromOurPage(req)) return send(res, 403, { error: 'Not allowed' });
  if (!(pushConfigured() && kvConfigured())) return send(res, 503, { error: 'Push is not set up on this server' });
  const b = await readBody(req);
  if (!b.id || !(await kvGet('pushsub:' + b.id))) return send(res, 404, { error: 'Unknown phone' });
  const old = (await kvGet('pushsched:' + b.id)) || [];
  const sent = new Set(old.filter((x) => x.sent).map((x) => x.key));
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 50)
    .map((x) => ({ key: String(x.key).slice(0, 80), at: Number(x.at), title: String(x.title || '').slice(0, 120), body: String(x.body || '').slice(0, 300), sent: sent.has(String(x.key)) }))
    .filter((x) => x.at > Date.now() - 6 * 3600000);
  await kvSet('pushsched:' + b.id, items, 60 * 86400);
  send(res, 200, { ok: true, count: items.length });
}
