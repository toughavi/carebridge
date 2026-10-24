// Local server that works like Vercel: serves the site and runs the /api functions.
//   npm run dev        -> uses real keys from your environment (.env is NOT read automatically; export them first)
//   npm run dev:mock   -> no accounts needed: Claude, Twilio, the database and push are simulated,
//                         including a pretend clinic that answers the phone and family members who text back.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8790);
const MOCK = process.env.MOCK === '1';

if (MOCK) installMocks();

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const file = path.join(ROOT, url.pathname + '.js');
    if (!file.startsWith(path.join(ROOT, 'api')) || path.basename(file).startsWith('_') || !fs.existsSync(file)) { res.statusCode = 404; return res.end('Not found'); }
    try {
      const mod = await import(pathToFileURL(file).href);
      await mod.default(req, res);
    } catch (e) { console.error(e); if (!res.headersSent) { res.statusCode = 500; res.end(JSON.stringify({ error: String(e.message || e) })); } }
    return;
  }
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, () => console.log('CareBridge running at http://localhost:' + PORT + (MOCK ? '  (mock services)' : '')));

/* ------------------------------------------------------------------ */
/* Mock services: everything an external account would do, simulated. */
/* ------------------------------------------------------------------ */
function installMocks() {
  Object.assign(process.env, {
    ANTHROPIC_API_KEY: 'mock', TWILIO_ACCOUNT_SID: 'ACmock', TWILIO_AUTH_TOKEN: 'mock', TWILIO_FROM_NUMBER: '+14085550100',
    ALLOWED_NUMBERS: process.env.ALLOWED_NUMBERS || '+14085550111,+14085550122,+14085550133,+14085550144,+14085550155',
    KV_REST_API_URL: 'http://kv.mock', KV_REST_API_TOKEN: 'mock', VAPID_PUBLIC_KEY: 'BMockPublicKeyForLocalTesting', VAPID_PRIVATE_KEY: 'mock',
    SKIP_TWILIO_SIGNATURE: '1', PUBLIC_BASE_URL: 'http://localhost:' + PORT
  });
  const store = new Map(); const sets = new Map();
  const realFetch = globalThis.fetch;
  globalThis.__mock = { store, sms: [], calls: [] };
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.startsWith('http://kv.mock')) return json(kvCmd(JSON.parse(init.body)));
    if (url.startsWith('https://api.anthropic.com')) return json(mockClaude(JSON.parse(init.body)));
    if (url.includes('api.twilio.com')) {
      const form = Object.fromEntries(new URLSearchParams(init.body));
      if (url.endsWith('/Calls.json')) { setTimeout(() => runClinic(form), 600); globalThis.__mock.calls.push(form); return json({ sid: 'CAmock' + Date.now() }); }
      if (url.endsWith('/Messages.json')) { globalThis.__mock.sms.push(form); setTimeout(() => familyReplies(form), 2500); return json({ sid: 'SMmock' + Date.now() }); }
    }
    return realFetch(input, init);
  };
  function json(obj) { return new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
  function kvCmd([cmd, key, ...rest]) {
    switch (cmd) {
      case 'GET': return { result: store.has(key) ? store.get(key) : null };
      case 'SET': store.set(key, rest[0]); return { result: 'OK' };
      case 'INCR': { const n = Number(store.get(key) || 0) + 1; store.set(key, String(n)); return { result: n }; }
      case 'EXPIRE': return { result: 1 };
      case 'SADD': { const s = sets.get(key) || new Set(); rest.forEach((x) => s.add(x)); sets.set(key, s); return { result: 1 }; }
      case 'SREM': { const s = sets.get(key); if (s) rest.forEach((x) => s.delete(x)); return { result: 1 }; }
      case 'SMEMBERS': return { result: Array.from(sets.get(key) || []) };
      default: return { error: 'unsupported ' + cmd };
    }
  }
  // A pretend clinic receptionist answering CareBridge's call.
  async function runClinic(form) {
    const turnUrl = new URL(form.Url);
    const post = async (u, params) => { const r = await realFetch(u, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) }); return r.text(); };
    const id = turnUrl.searchParams.get('id');
    const events = turnUrl.origin + '/api/call/events?id=' + id;
    await post(events, { CallStatus: 'ringing' });
    await sleep(900);
    let xml = await post(form.Url, { CallStatus: 'in-progress' });
    const clinic = ['Valley Orthopedics, this is Maria. How can I help you?', 'Sure. I have Tuesday, November 3rd at 10:15 in the morning. Does that work?', 'Great, you are all set for Tuesday November 3rd at 10:15. Anything else?', 'You are welcome. Goodbye.'];
    for (const line of clinic) {
      const m = xml.match(/action="([^"]+)"/);
      if (!m || /<Hangup\/>/.test(xml)) break;
      await sleep(1800);
      xml = await post(m[1].replace(/&amp;/g, '&'), { SpeechResult: line, CallStatus: 'in-progress' });
    }
    await sleep(500);
    await post(events, { CallStatus: 'completed' });
  }
  // Family members text back: the first number says NO, everyone after says YES.
  let replied = 0;
  async function familyReplies(form) {
    if (!/Reply YES/i.test(form.Body)) return;
    const answer = replied++ === 0 ? 'Sorry, can\'t this time' : 'Yes!';
    await realFetch('http://localhost:' + PORT + '/api/sms/inbound', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ From: form.To, Body: answer }) });
  }
  // Canned Claude answers, chosen by what is being asked.
  function mockClaude(req) {
    const all = JSON.stringify(req.messages);
    let text;
    if (req.system && req.system.includes('live phone call')) {
      const clinicTurns = req.messages.filter((m) => m.role === 'user').length;
      text = clinicTurns <= 2
        ? JSON.stringify({ say: 'Tuesday, November 3rd at 10:15 AM works well, thank you. The patient will need a Hindi interpreter, please.', done: false, outcome: 'in_progress', date: null, time: null })
        : JSON.stringify({ say: 'Thank you so much. To confirm, Tuesday November 3rd at 10:15 AM with a Hindi interpreter. Goodbye.', done: true, outcome: 'booked', date: '2026-11-03', time: '10:15' });
    } else if (all.includes('extract the appointment') || all.includes('Extract the appointment') || all.includes('appointment letter')) {
      text = JSON.stringify({ isAppointment: true, doctor: 'Dr. Nirmala Gopalan', clinic: 'Valley Orthopedics', address: '751 S Bascom Ave, San Jose, CA 95128', reason: 'Knee follow-up', date: '2026-11-03', time: '10:15', phone: '(408) 555-0142', prep: ['Arrive 15 minutes early', 'Bring your insurance card'], interpreter: null, unsure: ['time'] });
    } else {
      text = JSON.stringify({ reply: 'Okay. Let me check the details with you.', intent: 'book', specialty: 'ortho', reason: 'Knee pain, follow-up', reasonEn: 'a follow-up for knee pain', timePref: 'morning', ready: true });
    }
    return { content: [{ type: 'text', text }] };
  }
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
