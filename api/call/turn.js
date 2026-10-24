// POST /api/call/turn — Twilio calls this every time the clinic finishes speaking.
// It answers with TwiML: what CareBridge says next, then listen again (or hang up).
import { twiml, esc, readBody, query, fromTwilio, kvGet, kvSet, baseUrl } from '../_lib.js';
import { VOICE, MAX_TURNS, nextLine } from './_script.js';

function sayAndListen(req, id, n, text) {
  const action = esc(baseUrl(req) + '/api/call/turn?id=' + id + '&n=' + n);
  return '<Say voice="' + VOICE() + '">' + esc(text) + '</Say>' +
    '<Gather input="speech" language="en-US" speechTimeout="auto" timeout="7" action="' + action + '" method="POST"></Gather>' +
    '<Redirect method="POST">' + action + '&amp;silent=1</Redirect>';
}

export default async function handler(req, res) {
  const params = await readBody(req);
  if (!fromTwilio(req, params)) { res.statusCode = 403; return res.end('Forbidden'); }
  const { id, n, silent } = query(req);
  const s = id && (await kvGet('call:' + id));
  if (!s) return twiml(res, '<Say>Sorry, this call cannot continue. Goodbye.</Say><Hangup/>');
  const turn = Number(n || 0);

  if (turn === 0) {
    s.status = 'in-progress';
    s.lines.push({ who: 'ai', text: s.opening, at: Date.now() });
    await kvSet('call:' + id, s, 86400);
    return twiml(res, sayAndListen(req, id, 1, s.opening));
  }

  const heard = String(params.SpeechResult || '').trim();
  if (!heard || silent) {
    s.silences += 1;
    if (s.silences >= 2) {
      s.outcome = s.outcome === 'in_progress' ? 'callback' : s.outcome; s.status = 'ended';
      s.lines.push({ who: 'ai', text: 'Thank you. Our family will call back. Goodbye.', at: Date.now() });
      await kvSet('call:' + id, s, 86400);
      return twiml(res, '<Say voice="' + VOICE() + '">Thank you. Our family will call back. Goodbye.</Say><Hangup/>');
    }
    await kvSet('call:' + id, s, 86400);
    return twiml(res, sayAndListen(req, id, turn, 'Sorry, I did not catch that. Could you say it again?'));
  }

  s.silences = 0; s.turns += 1;
  s.lines.push({ who: 'clinic', text: heard, at: Date.now() });
  let reply;
  try { reply = await nextLine(s); } catch (e) { reply = { say: 'Thank you. Our family will call back to confirm. Goodbye.', done: true, outcome: 'callback' }; }
  if (s.turns >= MAX_TURNS && !reply.done) { reply.say = reply.say + ' Thank you so much, our family will follow up. Goodbye.'; reply.done = true; reply.outcome = reply.outcome === 'in_progress' ? 'callback' : reply.outcome; }
  s.lines.push({ who: 'ai', text: reply.say, at: Date.now() });
  if (reply.date) s.date = reply.date;
  if (reply.time) s.time = reply.time;
  if (reply.outcome && reply.outcome !== 'in_progress') s.outcome = reply.outcome;
  if (reply.done) { s.status = 'ended'; if (s.outcome === 'in_progress') s.outcome = s.date ? 'booked' : 'callback'; }
  await kvSet('call:' + id, s, 86400);
  if (reply.done) return twiml(res, '<Say voice="' + VOICE() + '">' + esc(reply.say) + '</Say><Hangup/>');
  return twiml(res, sayAndListen(req, id, turn + 1, reply.say));
}
