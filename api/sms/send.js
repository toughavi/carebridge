// POST /api/sms/send — text a family member (only numbers on ALLOWED_NUMBERS).
// Body: { to, body, requestId?, personId? }. With requestId, a YES/NO reply is matched back to the ride request.
import { send, readBody, fromOurPage, twilioConfigured, kvConfigured, allowedNumber, normPhone, twilio, kvSet, env, underLimit } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  if (!fromOurPage(req)) return send(res, 403, { error: 'Not allowed' });
  if (!(twilioConfigured() && kvConfigured())) return send(res, 503, { error: 'Texting is not set up on this server' });
  if (!(await underLimit(req, 'sms', 10))) return send(res, 429, { error: 'Too many texts. Please wait a minute.' });
  const b = await readBody(req);
  const to = normPhone(b.to);
  const text = String(b.body || '').slice(0, 600);
  if (!text) return send(res, 400, { error: 'Message is empty' });
  if (!allowedNumber(to)) return send(res, 403, { error: 'This number is not on the approved list (ALLOWED_NUMBERS).' });
  try {
    const m = await twilio('Messages.json', { To: to, From: env('TWILIO_FROM_NUMBER'), Body: text });
    if (b.requestId && b.personId) await kvSet('smsmap:' + to, { requestId: String(b.requestId), personId: String(b.personId), at: Date.now() }, 14 * 86400);
    send(res, 200, { sid: m.sid });
  } catch (e) { send(res, 502, { error: String(e.message || e) }); }
}
