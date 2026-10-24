// GET /api/call/status?id=... — the app polls this to show the live transcript.
import { send, query, kvGet } from '../_lib.js';

export default async function handler(req, res) {
  const { id } = query(req);
  const s = id && (await kvGet('call:' + id));
  if (!s) return send(res, 404, { error: 'Unknown call' });
  send(res, 200, { id: s.id, status: s.status, outcome: s.outcome, date: s.date, time: s.time, lines: s.lines.map((l) => ({ who: l.who, text: l.text })), error: s.error || null });
}
