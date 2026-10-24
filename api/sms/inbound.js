// POST /api/sms/inbound — Twilio sends each text a family member replies with.
// Set this as the "A message comes in" webhook on the Twilio phone number.
import { twiml, esc, readBody, fromTwilio, kvGet, kvSet, normPhone } from '../_lib.js';
import { yesNo } from './_yesno.js';

export default async function handler(req, res) {
  const p = await readBody(req);
  if (!fromTwilio(req, p)) { res.statusCode = 403; return res.end('Forbidden'); }
  const from = normPhone(p.From);
  const map = await kvGet('smsmap:' + from);
  const answer = yesNo(p.Body);
  if (!map) return twiml(res, '<Message>' + esc('CareBridge: there is no ride request waiting for you right now. Thank you!') + '</Message>');
  if (!answer) return twiml(res, '<Message>' + esc('CareBridge: please reply YES to drive or NO if you can\'t. No pressure either way.') + '</Message>');
  const key = 'replies:' + map.requestId;
  const all = (await kvGet(key)) || {};
  all[map.personId] = { answer, at: Date.now() };
  await kvSet(key, all, 14 * 86400);
  await kvSet('smsmap:' + from, Object.assign({}, map, { answered: answer }), 14 * 86400);
  const msg = answer === 'yes'
    ? 'Thank you! We will let them know you are driving. You will get a reminder the day before.'
    : 'No problem at all. We will quietly ask someone else.';
  twiml(res, '<Message>' + esc('CareBridge: ' + msg) + '</Message>');
}
