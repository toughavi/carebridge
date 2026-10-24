// POST /api/call/start — CareBridge places a real phone call to book a visit.
// Only numbers on the ALLOWED_NUMBERS list can be called (the demo "clinic" is a family phone).
import { send, readBody, fromOurPage, twilioConfigured, claudeConfigured, kvConfigured, allowedNumber, normPhone, twilio, kvSet, newId, baseUrl, env, underLimit } from '../_lib.js';
import { openingLine } from './_script.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  if (!fromOurPage(req)) return send(res, 403, { error: 'Not allowed' });
  if (!(twilioConfigured() && claudeConfigured() && kvConfigured())) return send(res, 503, { error: 'Calling is not set up on this server' });
  if (!(await underLimit(req, 'call', 3))) return send(res, 429, { error: 'Too many calls. Please wait a minute.' });
  const b = await readBody(req);
  const to = normPhone(b.to);
  if (!allowedNumber(to)) return send(res, 403, { error: 'This number is not on the approved list (ALLOWED_NUMBERS).' });
  const id = newId();
  const state = {
    id, to, status: 'dialing', createdAt: Date.now(), turns: 0, silences: 0,
    patientName: String(b.patientName || 'the patient').slice(0, 80), dob: b.dob ? String(b.dob).slice(0, 20) : '', mrn: b.mrn ? String(b.mrn).slice(0, 30) : '',
    doctor: String(b.doctor || '').slice(0, 80), clinic: String(b.clinic || '').slice(0, 80), reasonEn: String(b.reasonEn || '').slice(0, 120),
    timePref: ['morning', 'afternoon'].includes(b.timePref) ? b.timePref : 'any', interpreter: b.interpreter ? String(b.interpreter).slice(0, 30) : '',
    lines: [], outcome: 'in_progress', date: null, time: null
  };
  state.opening = openingLine(state);
  await kvSet('call:' + id, state, 86400);
  const base = baseUrl(req);
  try {
    const call = await twilio('Calls.json', {
      To: to, From: env('TWILIO_FROM_NUMBER'),
      Url: base + '/api/call/turn?id=' + id + '&n=0', Method: 'POST',
      StatusCallback: base + '/api/call/events?id=' + id, StatusCallbackMethod: 'POST',
      StatusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      Timeout: 25
    });
    state.callSid = call.sid; await kvSet('call:' + id, state, 86400);
    send(res, 200, { id });
  } catch (e) {
    state.status = 'failed'; state.error = String(e.message || e); await kvSet('call:' + id, state, 86400);
    send(res, 502, { error: state.error });
  }
}
