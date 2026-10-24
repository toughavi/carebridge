// GET /api/sms/replies?ids=a,b — the senior's app checks for YES/NO answers to its ride requests.
import { send, query, kvGet, fromOurPage } from '../_lib.js';

export default async function handler(req, res) {
  if (!fromOurPage(req)) return send(res, 403, { error: 'Not allowed' });
  const ids = String(query(req).ids || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20);
  const replies = {};
  for (const id of ids) { const r = await kvGet('replies:' + id); if (r) replies[id] = r; }
  send(res, 200, { replies });
}
