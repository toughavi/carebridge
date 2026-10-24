// GET /api/cron/reminders — run by Vercel Cron every evening (vercel.json).
// Sends the reminders that fall due before the next run, then marks them sent.
import { send, env, kv, kvGet, kvSet } from '../_lib.js';
import { pushTo } from '../push/_push.js';

export default async function handler(req, res) {
  const secret = env('CRON_SECRET');
  if (secret && req.headers.authorization !== 'Bearer ' + secret) return send(res, 401, { error: 'Unauthorized' });
  const ids = (await kv('SMEMBERS', 'pushsubs')) || [];
  const horizon = Date.now() + Number(env('CRON_WINDOW_HOURS', '24')) * 3600000;
  let sentCount = 0;
  for (const id of ids) {
    const items = await kvGet('pushsched:' + id);
    const sub = await kvGet('pushsub:' + id);
    if (!items || !sub) continue;
    let changed = false;
    for (const it of items) {
      if (it.sent || it.at > horizon) continue;
      try { await pushTo(sub, { title: it.title, body: it.body }); it.sent = true; changed = true; sentCount++; }
      catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) { await kv('SREM', 'pushsubs', id); break; } }
    }
    if (changed) await kvSet('pushsched:' + id, items, 60 * 86400);
  }
  send(res, 200, { ok: true, sent: sentCount });
}
