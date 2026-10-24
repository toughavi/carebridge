// Server tests: every /api function runs against simulated Claude, Twilio and database. Run: npm test
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';

const ENV = {
  ANTHROPIC_API_KEY: 'k', TWILIO_ACCOUNT_SID: 'ACx', TWILIO_AUTH_TOKEN: 'tok', TWILIO_FROM_NUMBER: '+14085550100',
  ALLOWED_NUMBERS: '+14085550111, (408) 555-0122', KV_REST_API_URL: 'http://kv.test', KV_REST_API_TOKEN: 't',
  VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv', MOCK: '1', CRON_SECRET: 'cron'
};
Object.assign(process.env, ENV);

/* ---- simulated outside services ---- */
const store = new Map(); const sets = new Map();
let calls = []; let claudeReply = '{}';
globalThis.fetch = async (url, init = {}) => {
  url = String(url); calls.push({ url, init });
  const ok = (o) => new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (url.startsWith('http://kv.test')) {
    const [cmd, key, ...rest] = JSON.parse(init.body);
    if (cmd === 'GET') return ok({ result: store.get(key) ?? null });
    if (cmd === 'SET') { store.set(key, rest[0]); return ok({ result: 'OK' }); }
    if (cmd === 'INCR') { const n = Number(store.get(key) || 0) + 1; store.set(key, String(n)); return ok({ result: n }); }
    if (cmd === 'EXPIRE') return ok({ result: 1 });
    if (cmd === 'SADD') { const s = sets.get(key) || new Set(); rest.forEach((x) => s.add(x)); sets.set(key, s); return ok({ result: 1 }); }
    if (cmd === 'SMEMBERS') return ok({ result: [...(sets.get(key) || [])] });
    if (cmd === 'SREM') return ok({ result: 1 });
  }
  if (url.startsWith('https://api.anthropic.com')) return ok({ content: [{ type: 'text', text: claudeReply }] });
  if (url.includes('api.twilio.com')) return ok({ sid: 'SID123' });
  throw new Error('unexpected fetch ' + url);
};

/* ---- fake request / response like Vercel's ---- */
function req({ method = 'GET', url = '/', headers = {}, body } = {}) {
  const r = Readable.from(body === undefined ? [] : [typeof body === 'string' ? body : JSON.stringify(body)]);
  Object.assign(r, { method, url, headers: Object.assign({ host: 'cb.test', 'x-forwarded-proto': 'https' }, headers), socket: { remoteAddress: '1.2.3.4' } });
  return r;
}
function res() {
  const r = { statusCode: 200, headers: {}, body: '', setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b || ''; this.done = true; } };
  r.json = () => JSON.parse(r.body);
  return r;
}
const page = { origin: 'https://cb.test', 'content-type': 'application/json' };
const twilioSig = (url, params) => crypto.createHmac('sha1', 'tok').update(url + Object.keys(params).sort().map((k) => k + params[k]).join('')).digest('base64');
function twilioReq(path, params) {
  return req({ method: 'POST', url: path, headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': twilioSig('https://cb.test' + path, params) }, body: new URLSearchParams(params).toString() });
}
const load = async (p) => (await import('../api/' + p + '.js')).default;

beforeEach(() => { calls = []; });

test('health reports every service as set up', async () => {
  const r = res(); await (await load('health'))(req(), r);
  assert.deepEqual(r.json().features, { ai: true, calls: true, sms: true, push: true, kv: true });
});

test('ai returns parsed JSON and blocks other websites', async () => {
  claudeReply = 'Here you go: {"reply":"ok","ready":true}';
  const r = res(); await (await load('ai'))(req({ method: 'POST', headers: page, body: { prompt: 'hi' } }), r);
  assert.equal(r.statusCode, 200); assert.equal(r.json().json.ready, true);
  const r2 = res(); await (await load('ai'))(req({ method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: { prompt: 'hi' } }), r2);
  assert.equal(r2.statusCode, 403);
});

test('ai sends a photo as an image block', async () => {
  claudeReply = '{"isAppointment":true}';
  const r = res(); await (await load('ai'))(req({ method: 'POST', headers: page, body: { prompt: 'read', images: [{ media_type: 'image/jpeg', data: 'AAAA' }] } }), r);
  assert.equal(r.statusCode, 200);
  const sent = JSON.parse(calls.find((c) => c.url.includes('anthropic')).init.body);
  assert.equal(sent.messages[0].content[0].type, 'image');
});

test('calls only go to approved numbers', async () => {
  const r = res(); await (await load('call/start'))(req({ method: 'POST', headers: page, body: { to: '+19995550000', patientName: 'P' } }), r);
  assert.equal(r.statusCode, 403);
});

let callId;
test('a call starts, says it is an AI, listens, and books', async () => {
  const r = res(); await (await load('call/start'))(req({ method: 'POST', headers: page, body: { to: '408-555-0122', patientName: 'Purna Sharma', doctor: 'Dr. Nirmala Gopalan', reasonEn: 'a follow-up for knee pain', timePref: 'morning', interpreter: 'Hindi' } }), r);
  assert.equal(r.statusCode, 200); callId = r.json().id;
  const tw = calls.find((c) => c.url.endsWith('/Calls.json'));
  const form = new URLSearchParams(tw.init.body);
  assert.equal(form.get('To'), '+14085550122');
  assert.match(form.get('Url'), /\/api\/call\/turn\?id=.+&n=0$/);
  assert.equal(form.getAll('StatusCallbackEvent').length, 4);

  const turn = await load('call/turn');
  const r0 = res(); await turn(twilioReq('/api/call/turn?id=' + callId + '&n=0', { CallStatus: 'in-progress' }), r0);
  assert.match(r0.body, /AI assistant/); assert.match(r0.body, /<Gather input="speech"/);

  claudeReply = '{"say":"Tuesday at 10:15 works, thank you.","done":false,"outcome":"in_progress"}';
  const r1 = res(); await turn(twilioReq('/api/call/turn?id=' + callId + '&n=1', { SpeechResult: 'How about Tuesday at 10:15?' }), r1);
  assert.match(r1.body, /Tuesday at 10:15 works/); assert.match(r1.body, /n=2/);

  claudeReply = '{"say":"Thank you, goodbye.","done":true,"outcome":"booked","date":"2026-11-03","time":"10:15"}';
  const r2 = res(); await turn(twilioReq('/api/call/turn?id=' + callId + '&n=2', { SpeechResult: 'You are all set.' }), r2);
  assert.match(r2.body, /<Hangup\/>/);

  const rs = res(); await (await load('call/status'))(req({ url: '/api/call/status?id=' + callId }), rs);
  const s = rs.json();
  assert.equal(s.outcome, 'booked'); assert.equal(s.date, '2026-11-03'); assert.equal(s.lines.length, 5);
});

test('webhooks without a valid Twilio signature are rejected', async () => {
  const r = res();
  await (await load('call/turn'))(req({ method: 'POST', url: '/api/call/turn?id=' + callId + '&n=1', headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': 'bad' }, body: 'SpeechResult=hi' }), r);
  assert.equal(r.statusCode, 403);
});

test('two silences end the call politely', async () => {
  const turn = await load('call/turn');
  const a = res(); await turn(twilioReq('/api/call/turn?id=' + callId + '&n=3&silent=1', {}), a);
  assert.match(a.body, /did not catch/);
  const b = res(); await turn(twilioReq('/api/call/turn?id=' + callId + '&n=3&silent=1', {}), b);
  assert.match(b.body, /Hangup/);
});

test('ride request text, then a YES reply reaches the app', async () => {
  const r = res(); await (await load('sms/send'))(req({ method: 'POST', headers: page, body: { to: '+14085550111', body: 'Reply YES to drive', requestId: 'appt1', personId: 'p-avi' } }), r);
  assert.equal(r.statusCode, 200);
  const r2 = res(); await (await load('sms/inbound'))(twilioReq('/api/sms/inbound', { From: '+14085550111', Body: 'Yes!' }), r2);
  assert.match(r2.body, /Thank you/);
  const r3 = res(); await (await load('sms/replies'))(req({ url: '/api/sms/replies?ids=appt1', headers: page }), r3);
  assert.equal(r3.json().replies.appt1['p-avi'].answer, 'yes');
});

test('weekly visit: the ride home has its own request id, and a NO comes back for that ride only', async () => {
  const r = res(); await (await load('sms/send'))(req({ method: 'POST', headers: page, body: { to: '(408) 555-0122', body: 'Can you bring them home? Reply YES or NO', requestId: 'wk1-2026-10-29|back', personId: 'p-krish' } }), r);
  assert.equal(r.statusCode, 200);
  const r2 = res(); await (await load('sms/inbound'))(twilioReq('/api/sms/inbound', { From: '+14085550122', Body: "Sorry can't this week" }), r2);
  assert.match(r2.body, /ask someone else/);
  const r3 = res(); await (await load('sms/replies'))(req({ url: '/api/sms/replies?ids=' + encodeURIComponent('wk1-2026-10-29|back') + ',wk1-2026-10-29', headers: page }), r3);
  assert.equal(r3.json().replies['wk1-2026-10-29|back']['p-krish'].answer, 'no');
  assert.equal(r3.json().replies['wk1-2026-10-29'], undefined);
});

test('texts to unapproved numbers are refused', async () => {
  const r = res(); await (await load('sms/send'))(req({ method: 'POST', headers: page, body: { to: '+15555550000', body: 'x' } }), r);
  assert.equal(r.statusCode, 403);
});

test('yes / no understood in several languages', async () => {
  const { yesNo } = await import('../api/sms/_yesno.js');
  for (const y of ['YES', 'yes, I can', 'हाँ', 'ਹਾਂ ਜੀ', 'sí', 'có', '是的', "I'll drive"]) assert.equal(yesNo(y), 'yes', y);
  for (const n of ['no', "Sorry, can't this time", 'नहीं', 'இல்லை', 'không', 'busy that day']) assert.equal(yesNo(n), 'no', n);
  assert.equal(yesNo('what time?'), null);
});

test('push: subscribe, schedule, and the evening job sends what is due', async () => {
  const sub = { endpoint: 'https://push.example/abc', keys: { p256dh: 'x', auth: 'y' } };
  const r = res(); await (await load('push/subscribe'))(req({ method: 'POST', headers: page, body: { subscription: sub } }), r);
  const id = r.json().id;
  const soon = Date.now() + 3600000, later = Date.now() + 5 * 86400000;
  const r2 = res(); await (await load('push/schedule'))(req({ method: 'POST', headers: page, body: { id, items: [{ key: 'a', at: soon, title: 'Tomorrow 9:30', body: 'Avi picks you up' }, { key: 'b', at: later, title: 'Later' }] } }), r2);
  assert.equal(r2.json().count, 2);
  const bad = res(); await (await load('cron/reminders'))(req({ url: '/api/cron/reminders' }), bad);
  assert.equal(bad.statusCode, 401);
  const r3 = res(); await (await load('cron/reminders'))(req({ url: '/api/cron/reminders', headers: { authorization: 'Bearer cron' } }), r3);
  assert.equal(r3.json().sent, 1);
  const r4 = res(); await (await load('cron/reminders'))(req({ url: '/api/cron/reminders', headers: { authorization: 'Bearer cron' } }), r4);
  assert.equal(r4.json().sent, 0, 'already sent reminders are not sent twice');
});
