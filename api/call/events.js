// POST /api/call/events — Twilio reports ringing, answered, completed, busy, no answer.
import { readBody, query, fromTwilio, kvGet, kvSet } from '../_lib.js';

export default async function handler(req, res) {
  const params = await readBody(req);
  if (!fromTwilio(req, params)) { res.statusCode = 403; return res.end('Forbidden'); }
  const { id } = query(req);
  const s = id && (await kvGet('call:' + id));
  if (s) {
    const st = String(params.CallStatus || '');
    if (['busy', 'no-answer', 'failed', 'canceled'].includes(st)) { s.status = 'ended'; if (s.outcome === 'in_progress') s.outcome = st; }
    else if (st === 'completed') { s.status = 'ended'; if (s.outcome === 'in_progress') s.outcome = s.date ? 'booked' : 'callback'; }
    else if (st === 'ringing' && s.status === 'dialing') s.status = 'ringing';
    await kvSet('call:' + id, s, 86400);
  }
  res.statusCode = 204; res.end();
}
