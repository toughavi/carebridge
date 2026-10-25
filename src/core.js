/* CareBridge — app logic with no UI: storage, dates, hospital sync (FHIR), ride matching, reminders, AI. */

/* ---------- Where is the app running? ---------- */
// On the website (Vercel, or localhost while testing) the app can sign in to real hospitals,
// download calendar files and use the server. Opened as a plain file, it runs in demo mode.
const ON_WEBSITE = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

const CONFIG = {
  // From fhir.epic.com after registering the app (see README). Leave empty until you have them.
  EPIC_CLIENT_ID: '',            // Non-Production client ID: Epic's test system
  EPIC_PROD_CLIENT_ID: '',       // Production client ID: real hospitals (Stanford, SCVMC, El Camino, Sutter)
  // Only US Core read scopes, so the app qualifies for Epic's automatic distribution. Add patient/Appointment.read if Epic lists it as eligible.
  EPIC_PROD_SCOPE: 'openid fhirUser launch/patient patient/Patient.read patient/Encounter.read patient/MedicationRequest.read',
  STORAGE_KEY: 'carebridge.v1'
};

const SMART_SERVERS = {
  epic: {
    id: 'epic', label: 'Epic test system (fhir.epic.com)',
    iss: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
    clientId: () => CONFIG.EPIC_CLIENT_ID,
    scope: 'openid fhirUser launch/patient patient/Patient.read patient/Appointment.read patient/Encounter.read patient/MedicationRequest.read',
    apptQuery: '&service-category=appointment',
    testLogin: 'fhircamila / epicepic1'
  },
  smart: {
    id: 'smart', label: 'SMART Health IT open test server',
    iss: 'https://launch.smarthealthit.org/v/r4/sim/WzMsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMSwiIl0/fhir', // launch options: patient-standalone, public client, PKCE
    clientId: () => 'carebridge-demo',
    scope: 'openid fhirUser launch/patient patient/Patient.read patient/Appointment.read patient/Encounter.read patient/MedicationRequest.read',
    apptQuery: '',
    testLogin: 'pick any test patient'
  }
};

/* 'epic' and 'smart' are test systems; 'hosp:<id>' is a real hospital (needs the production client ID). */
function smartServer(id) {
  if (SMART_SERVERS[id]) return SMART_SERVERS[id];
  const h = HOSPITALS.find((x) => 'hosp:' + x.id === id);
  if (!h) throw new Error('Unknown hospital system');
  return { id, label: h.name, iss: h.fhir, clientId: () => CONFIG.EPIC_PROD_CLIENT_ID, scope: CONFIG.EPIC_PROD_SCOPE, apptQuery: '&service-category=appointment', real: true };
}

/* ---------- Small helpers ---------- */
const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 9);
const clone = (x) => JSON.parse(JSON.stringify(x));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DAY = 86400000;
const langInfo = (id) => LANGS.find((l) => l.id === id) || LANGS[0];

function t(lang, key, vars) {
  let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

/* ---------- Dates ---------- */
function atTime(daysFromToday, hh, mm) {
  const d = new Date(); d.setHours(hh, mm || 0, 0, 0); d.setDate(d.getDate() + daysFromToday); return d.toISOString();
}
function fmtDay(iso, lang) { return new Intl.DateTimeFormat(langInfo(lang).locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso)); }
function fmtLongDay(iso, lang) { return new Intl.DateTimeFormat(langInfo(lang).locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(iso)); }
function fmtTime(iso, lang) { return new Intl.DateTimeFormat(langInfo(lang).locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso)); }
function fmtMonthShort(d, lang) { return new Intl.DateTimeFormat(langInfo(lang).locale, { month: 'short' }).format(d); }
function fmtDayNum(iso, lang) { return new Intl.DateTimeFormat(langInfo(lang).locale, { day: 'numeric' }).format(new Date(iso)); }
function fmtWeekdayShort(dayIndex, lang) { const d = new Date(2024, 0, 7 + dayIndex); return new Intl.DateTimeFormat(langInfo(lang).locale, { weekday: 'short' }).format(d); }
function sameDay(a, b) { const x = new Date(a), y = new Date(b); return x.toDateString() === y.toDateString(); }
function isUpcoming(a) { return a.status === 'booked' && new Date(a.start).getTime() > Date.now() - 3 * 3600000; }
function pickupTime(a) { return new Date(new Date(a.start).getTime() - 40 * 60000 + (a.delayMin || 0) * 60000).toISOString(); }
function visitTime(a) { return new Date(new Date(a.start).getTime() + (a.delayMin || 0) * 60000).toISOString(); }

/* ---------- Storage (this device only) ---------- */
function blankState() {
  return {
    v: 1,
    profile: { name: '', lang: 'en', setupDone: false, bigText: false },
    setupStep: 'lang',
    hospital: null,          // { id, name, portal, mode: 'demo'|'real', server, connectedAt, lastSync }
    patient: null,           // { fullName, birthDate, mrn, language, meds: [] }
    people: [],              // ride circle
    appts: [],
    messages: [],            // thank-yous and ride updates, newest first
    settings: { autoAccept: false, notify: false },
    series: []               // weekly visits (v1.2)
  };
}
function loadState() {
  try { const raw = localStorage.getItem(CONFIG.STORAGE_KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return Object.assign(blankState(), s); } } catch (e) { /* storage blocked: run in memory */ }
  return blankState();
}
function saveState(s) { try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ } }
function clearState() { try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch (e) { /* ignore */ } }

/* ---------- Hospitals and doctors ---------- */
// FHIR addresses come from Epic's public endpoint directory (open.epic.com/Endpoints/R4, Oct 2026).
const HOSPITALS = [
  { id: 'scvmc', name: 'Santa Clara Valley Medical Center', portal: 'myHealth Online · MyChart', fhir: 'https://scvhhsfhir.sccgov.org/interconnect-fhir/api/FHIR/R4' },
  { id: 'stanford', name: 'Stanford Health Care', portal: 'MyHealth · MyChart', fhir: 'https://sfd.stanfordmed.org/FHIR/api/FHIR/R4' },
  { id: 'elcamino', name: 'El Camino Health', portal: 'MyChart', fhir: 'https://rwebproxy.elcaminohospital.org/FHIR/api/FHIR/R4' },
  { id: 'sutter', name: 'Sutter Health · PAMF', portal: 'My Health Online · MyChart', fhir: 'https://apiservices.sutterhealth.org/ifs/api/FHIR/R4' }
];
const DOCTOR_BOOK = {
  ortho: { doctor: 'Dr. Nirmala Gopalan', place: 'Valley Orthopedics, San Jose', clinic: 'Valley Orthopedics' },
  family: { doctor: 'Dr. Linh Nguyen', place: 'Valley Health Center, San Jose', clinic: 'Valley Health Center' },
  cardio: { doctor: 'Dr. Sarah Kim', place: 'Heart & Vascular Clinic, San Jose', clinic: 'Heart & Vascular Clinic' },
  eye: { doctor: 'Dr. Raj Mehta', place: 'Eye Care Center, Santa Clara', clinic: 'Eye Care Center' },
  skin: { doctor: 'Dr. Elena Ruiz', place: 'Dermatology Clinic, San Jose', clinic: 'Dermatology Clinic' }
};
const REASON_EN = { ortho: 'a follow-up for joint pain', family: 'a check-up', cardio: 'a heart check-up', eye: 'an eye exam', skin: 'a visit for a skin problem' };
function guessSpecialty(text) {
  const s = (text || '').toLowerCase();
  if (/ortho|bone|knee|joint|x-ray|spine|hip/.test(s)) return 'ortho';
  if (/cardi|heart|vascular/.test(s)) return 'cardio';
  if (/eye|ophth|vision|retina/.test(s)) return 'eye';
  if (/derm|skin/.test(s)) return 'skin';
  return 'family';
}
function doctorFor(state, specialty) {
  const synced = state.appts.find((a) => a.specialty === specialty && a.doctor);
  const book = DOCTOR_BOOK[specialty] || DOCTOR_BOOK.family;
  return synced ? { doctor: synced.doctor, place: synced.place || book.place, clinic: (synced.place || book.clinic).split(',')[0] } : book;
}

/* ---------- FHIR: the shape hospitals use ---------- */
// The demo portal and the real Epic sign-in both produce FHIR R4 resources,
// and both go through the same mapping code below.
function demoBundle(profileName) {
  const P = (id, d, h, m, desc, svc, doc, loc, status) => ({
    resourceType: 'Appointment', id, status, description: desc, serviceType: [{ text: svc }],
    start: atTime(d, h, m), end: new Date(new Date(atTime(d, h, m)).getTime() + 30 * 60000).toISOString(),
    participant: [
      { actor: { reference: 'Practitioner/' + doc.replace(/\W+/g, ''), display: doc } },
      { actor: { reference: 'Location/' + loc.replace(/\W+/g, ''), display: loc } },
      { actor: { reference: 'Patient/demo-patient', display: profileName || 'Test patient' } }
    ]
  });
  const patient = {
    resourceType: 'Patient', id: 'demo-patient',
    name: [{ text: profileName || 'Test patient' }], birthDate: '1949-03-14',
    identifier: [{ type: { text: 'MRN' }, value: 'E4021987' }],
    communication: [{ language: { coding: [{ code: 'hi' }] } }]
  };
  const appts = [
    P('a1', 4, 9, 30, 'Annual check-up', 'Family Medicine', 'Dr. Linh Nguyen', 'Valley Health Center, San Jose', 'booked'),
    P('a2', 19, 14, 0, 'Eye exam', 'Ophthalmology', 'Dr. Raj Mehta', 'Eye Care Center, Santa Clara', 'booked'),
    P('p1', -21, 10, 0, 'Knee pain', 'Orthopedics', 'Dr. Nirmala Gopalan', 'Valley Orthopedics, San Jose', 'fulfilled'),
    P('p2', -49, 9, 0, 'Blood pressure follow-up', 'Family Medicine', 'Dr. Linh Nguyen', 'Valley Health Center, San Jose', 'fulfilled'),
    P('p3', -77, 11, 0, 'Lab work', 'Family Medicine', 'Dr. Linh Nguyen', 'Valley Health Center, San Jose', 'fulfilled'),
    P('p4', -105, 10, 30, 'Knee X-ray', 'Orthopedics', 'Dr. Nirmala Gopalan', 'Valley Orthopedics, San Jose', 'fulfilled'),
    P('p5', -133, 14, 0, 'Eye exam', 'Ophthalmology', 'Dr. Raj Mehta', 'Eye Care Center, Santa Clara', 'fulfilled')
  ];
  const meds = [
    { resourceType: 'MedicationRequest', medicationCodeableConcept: { text: 'Amlodipine 5 mg, once a day' } },
    { resourceType: 'MedicationRequest', medicationCodeableConcept: { text: 'Vitamin D 1000 IU, once a day' } }
  ];
  return { patient, appts, meds };
}

function mapPatient(p, meds) {
  if (!p) return null;
  const n = (p.name || [])[0] || {};
  const fullName = n.text || [].concat(n.given || [], n.family || []).join(' ').trim();
  const ids = p.identifier || [];
  const typeWords = (i) => [i.type && i.type.text, ...((i.type && i.type.coding) || []).map((c) => c.code + ' ' + (c.display || '')), i.system].filter(Boolean).join(' ');
  const mrnId = ids.find((i) => /\bMRN?\b|medical record|\bEPI\b/i.test(typeWords(i))) || ids[0];
  const lang = (((p.communication || [])[0] || {}).language || {}).coding?.[0]?.code || null;
  return {
    fullName, birthDate: p.birthDate || null, mrn: mrnId ? mrnId.value : null, language: lang,
    meds: (meds || []).map((m) => m.medicationCodeableConcept?.text || m.medicationReference?.display).filter(Boolean).slice(0, 6)
  };
}

function mapAppointment(r) {
  const parts = r.participant || [];
  const actor = (re) => (parts.find((x) => x.actor && re.test(x.actor.reference || '')) || {}).actor || {};
  const doc = actor(/^Practitioner/).display || (parts.find((x) => x.actor && x.actor.display && !/^Patient|^Location/.test(x.actor.reference || '')) || {}).actor?.display || 'Your doctor';
  const loc = actor(/^Location/).display || '';
  const what = r.description || r.serviceType?.[0]?.text || r.appointmentType?.text || r.serviceCategory?.[0]?.text || 'Visit';
  const statusMap = { booked: 'booked', pending: 'booked', arrived: 'booked', 'checked-in': 'booked', fulfilled: 'done', cancelled: 'cancelled', noshow: 'cancelled', proposed: 'booked' };
  return {
    id: 'fhir-' + r.id, fhirId: r.id, source: 'portal', doctor: doc, place: loc,
    specialty: guessSpecialty(what + ' ' + (r.serviceType?.[0]?.text || '')),
    reason: what, start: r.start,
    // A visit dated in the past that was never marked fulfilled is treated as history.
    status: (() => { const s = statusMap[r.status] || 'booked'; return s === 'booked' && r.start && new Date(r.start).getTime() < Date.now() - DAY ? 'done' : s; })(),
    ride: { status: 'idle', driverId: null, askedId: null, declinedIds: [] }, delayMin: 0, followUp: null
  };
}

function encounterToAppointment(e) {
  const who = (e.participant || []).find((p) => p.individual && p.individual.display);
  const where = (e.location || [])[0];
  return {
    resourceType: 'Appointment', id: 'enc-' + e.id, status: e.status === 'finished' ? 'fulfilled' : 'booked',
    start: (e.period && e.period.start) || new Date().toISOString(),
    description: (e.type && e.type[0] && (e.type[0].text || (e.type[0].coding || [])[0]?.display)) || (e.reasonCode && e.reasonCode[0] && e.reasonCode[0].text) || 'Visit',
    participant: [
      { actor: { reference: 'Practitioner/x', display: who ? who.individual.display : 'Clinic visit' } },
      { actor: { reference: 'Location/x', display: (where && where.location && where.location.display) || (e.serviceProvider && e.serviceProvider.display) || '' } }
    ]
  };
}

/* Merge freshly synced visits into state; report changes the family should hear about. */
function mergeSync(state, fresh) {
  const changes = [];
  const byId = Object.fromEntries(state.appts.map((a) => [a.id, a]));
  for (const f of fresh) {
    const old = byId[f.id];
    if (!old) { state.appts.push(f); continue; }
    if (old.status === 'booked' && f.status === 'cancelled') changes.push({ kind: 'cancelled', appt: old });
    else if (old.status === 'booked' && f.status === 'booked' && old.start !== f.start) changes.push({ kind: 'moved', appt: old, to: f.start });
    old.start = f.start; old.doctor = f.doctor; old.place = f.place || old.place;
    if (!(old.status === 'done' && f.status === 'booked')) old.status = f.status;
  }
  state.appts.sort((a, b) => new Date(a.start) - new Date(b.start));
  return changes;
}

/* ---------- Real SMART on FHIR sign-in (standalone patient launch, PKCE) ---------- */
function b64url(bytes) { let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function makePkce() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: b64url(new Uint8Array(digest)) };
}
async function smartDiscover(iss) {
  try {
    const r = await fetch(iss.replace(/\/$/, '') + '/.well-known/smart-configuration', { headers: { Accept: 'application/json' } });
    if (r.ok) { const j = await r.json(); if (j.authorization_endpoint && j.token_endpoint) return j; }
  } catch (e) { /* fall through */ }
  const base = iss.replace(/\/api\/FHIR\/R4\/?$/, '');
  return { authorization_endpoint: base + '/oauth2/authorize', token_endpoint: base + '/oauth2/token' };
}
function redirectUri() { return location.origin + location.pathname; }
async function smartBegin(serverId) {
  const srv = smartServer(serverId);
  const conf = await smartDiscover(srv.iss);
  const { verifier, challenge } = await makePkce();
  const st = b64url(crypto.getRandomValues(new Uint8Array(16)));
  if (!srv.clientId()) throw new Error('This hospital system needs a client ID from fhir.epic.com first.');
  sessionStorage.setItem('cb.smart', JSON.stringify({ serverId, verifier, state: st, token_endpoint: conf.token_endpoint, clientId: srv.clientId() }));
  const q = new URLSearchParams({
    response_type: 'code', client_id: srv.clientId(), redirect_uri: redirectUri(), scope: srv.scope,
    state: st, aud: srv.iss, code_challenge: challenge, code_challenge_method: 'S256'
  });
  location.assign(conf.authorization_endpoint + '?' + q.toString());
}
async function fhirGet(iss, path, token) {
  const r = await fetch(iss.replace(/\/$/, '') + '/' + path, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/fhir+json' } });
  if (!r.ok) throw new Error('FHIR ' + path.split('?')[0] + ' returned ' + r.status);
  return r.json();
}
async function smartFetchAll(serverId, token, patientId) {
  const srv = smartServer(serverId);
  const patientRes = await fhirGet(srv.iss, 'Patient/' + encodeURIComponent(patientId), token);
  let appts = [], meds = [];
  try {
    const b = await fhirGet(srv.iss, 'Appointment?patient=' + encodeURIComponent(patientId) + srv.apptQuery, token);
    appts = (b.entry || []).map((e) => e.resource).filter((r) => r && r.resourceType === 'Appointment');
  } catch (e) { console.warn(e); }
  if (!appts.length) {
    // Many test servers hold past visits as Encounters rather than Appointments; use them as visit history.
    try {
      const b = await fhirGet(srv.iss, 'Encounter?patient=' + encodeURIComponent(patientId) + '&_sort=-date&_count=12', token);
      appts = (b.entry || []).map((e) => e.resource).filter((r) => r && r.resourceType === 'Encounter').map(encounterToAppointment);
    } catch (e) { console.warn(e); }
  }
  try {
    const b = await fhirGet(srv.iss, 'MedicationRequest?patient=' + encodeURIComponent(patientId), token);
    meds = (b.entry || []).map((e) => e.resource).filter((r) => r && r.resourceType === 'MedicationRequest');
  } catch (e) { /* optional */ }
  return { patient: patientRes, appts, meds };
}
/* Called on page load: finishes a sign-in if the hospital just sent the person back with a code. */
async function smartComplete() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code'), st = params.get('state'), err = params.get('error');
  if (!code && !err) return null;
  history.replaceState(null, '', location.pathname);
  if (err) return { error: params.get('error_description') || err };
  let saved; try { saved = JSON.parse(sessionStorage.getItem('cb.smart') || 'null'); } catch (e) { saved = null; }
  if (!saved || saved.state !== st) return { error: 'The sign-in could not be matched. Please try again.' };
  const srv = smartServer(saved.serverId);
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), client_id: saved.clientId || srv.clientId(), code_verifier: saved.verifier });
  const r = await fetch(saved.token_endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body });
  if (!r.ok) return { error: 'The hospital did not accept the sign-in (' + r.status + ').' };
  const tok = await r.json();
  if (!tok.patient) return { error: 'The hospital did not say which patient signed in.' };
  sessionStorage.setItem('cb.token', JSON.stringify({ serverId: saved.serverId, access_token: tok.access_token, patient: tok.patient, exp: Date.now() + (tok.expires_in || 3600) * 1000 }));
  const data = await smartFetchAll(saved.serverId, tok.access_token, tok.patient);
  return { serverId: saved.serverId, data };
}
function savedToken() {
  try { const t = JSON.parse(sessionStorage.getItem('cb.token') || 'null'); return t && t.exp > Date.now() + 60000 ? t : null; } catch (e) { return null; }
}

/* ---------- Ride matching ---------- */
// Ask one person at a time: people whose usual free time fits come first,
// then whoever has driven least. A "no" is recorded silently and the next person is asked.
// Every visit has a ride there (a.ride). Weekly visits also have a ride home (a.rideBack); `leg` is 'to' or 'back'.
const LEGS = ['to', 'back'];
const legKey = (leg) => (leg === 'back' ? 'rideBack' : 'ride');
const blankRide = () => ({ status: 'idle', driverId: null, askedId: null, declinedIds: [] });
function endTime(a) { return new Date(new Date(a.start).getTime() + ((a.durationMin || 45) + (a.delayMin || 0)) * 60000).toISOString(); }
function legTime(a, leg) { return leg === 'back' ? endTime(a) : pickupTime(a); }
function legsOf(a) { return a.rideBack ? LEGS : ['to']; }
function ridesGiven(state, personId) {
  return state.appts.filter((a) => a.status === 'done').reduce((n, a) => n + legsOf(a).filter((l) => a[legKey(l)] && a[legKey(l)].driverId === personId).length, 0);
}
function fitsTime(person, iso) { const d = new Date(iso); return person.days.includes(d.getDay()) && person.times.includes(d.getHours() < 12 ? 'am' : 'pm'); }
function nextCandidate(state, appt, leg = 'to') {
  const r = appt[legKey(leg)];
  const declined = new Set(r.declinedIds || []);
  const pool = state.people.filter((p) => !declined.has(p.id));
  if (!pool.length) return null;
  const when = legTime(appt, leg);
  pool.sort((a, b) => (fitsTime(a, when) ? 0 : 1) - (fitsTime(b, when) ? 0 : 1) || ridesGiven(state, a.id) - ridesGiven(state, b.id) || state.people.indexOf(a) - state.people.indexOf(b));
  return pool[0];
}
function askNext(state, appt, leg = 'to') {
  const k = legKey(leg);
  if (!appt[k]) appt[k] = blankRide();
  const c = nextCandidate(state, appt, leg);
  if (!c) { appt[k] = Object.assign(appt[k], { status: 'none', askedId: null, driverId: null }); return null; }
  appt[k] = Object.assign(appt[k], { status: 'asking', askedId: c.id, driverId: null, askedAt: Date.now(), outside: !fitsTime(c, legTime(appt, leg)) });
  return c;
}
function acceptRide(state, apptId, personId, leg = 'to') {
  const a = state.appts.find((x) => x.id === apptId); if (!a) return;
  const k = legKey(leg);
  a[k] = Object.assign(a[k] || blankRide(), { status: 'confirmed', driverId: personId, askedId: null });
}
function declineRide(state, apptId, personId, leg = 'to') {
  const a = state.appts.find((x) => x.id === apptId); if (!a) return;
  const r = a[legKey(leg)];
  r.declinedIds = Array.from(new Set([...(r.declinedIds || []), personId]));
  askNext(state, a, leg);
}
function restartAsking(state, apptId, leg = 'to') { const a = state.appts.find((x) => x.id === apptId); if (!a) return; a[legKey(leg)] = blankRide(); askNext(state, a, leg); }

/* ---------- Weekly visits (v1.2) ---------- */
// Told once ("physio every Thursday at 2"), nothing to book. CareBridge keeps the next 4 weeks on the calendar,
// fills each ride from the standing driver, and asks the family only for rides nobody has taken, 5 days ahead.
const WEEKS_AHEAD = 4, ASK_DAYS_AHEAD = 5;
function ymd(d) { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function fmtWeekdayLong(dayIndex, lang) { return new Intl.DateTimeFormat(langInfo(lang).locale, { weekday: 'long' }).format(new Date(2024, 0, 7 + dayIndex)); }
function seriesTimeIso(s) { const [h, m] = String(s.time || '14:00').split(':').map(Number); const d = new Date(2024, 0, 7 + s.weekday, h, m || 0); return d.toISOString(); }
function askDate(a) { return new Date(new Date(a.start).getTime() - ASK_DAYS_AHEAD * DAY); }
function newSeries(data) {
  return {
    id: data.id || uid('wk'), what: data.what || 'Physiotherapy', place: data.place || '', doctor: data.doctor || '', phone: data.phone || '',
    weekday: Number(data.weekday), time: data.time || '14:00', durationMin: Number(data.durationMin) || 60,
    standing: { to: (data.standing && data.standing.to) || null, back: (data.standing && data.standing.back) || null },
    skips: [], active: true, createdAt: Date.now()
  };
}
function occurrenceFor(s, day) {
  const [h, m] = String(s.time).split(':').map(Number);
  const start = new Date(day); start.setHours(h, m || 0, 0, 0);
  return {
    id: s.id + '-' + ymd(start), seriesId: s.id, source: 'weekly', doctor: s.doctor || s.what, place: s.place, specialty: guessSpecialty(s.what + ' ' + s.place),
    reason: s.what, start: start.toISOString(), durationMin: s.durationMin, status: 'booked', phone: s.phone || '', prep: [],
    ride: blankRide(), rideBack: blankRide(), delayMin: 0, followUp: null
  };
}
/* Fill one ride of a weekly visit: the standing driver if they have not said "can't this week", otherwise ask (when close enough). */
function fillLeg(state, a, leg, s) {
  const r = a[legKey(leg)];
  if (r.status !== 'idle') return;
  const standing = s && s.standing[leg];
  if (standing && state.people.some((p) => p.id === standing) && !(r.declinedIds || []).includes(standing)) {
    a[legKey(leg)] = Object.assign(r, { status: 'confirmed', driverId: standing, askedId: null, standing: true });
    return;
  }
  if (state.people.length && Date.now() >= askDate(a).getTime()) askNext(state, a, leg);
}
function ensureSeries(state) {
  if (!state.series) state.series = [];
  const now = Date.now();
  for (const a of state.appts) {
    if (a.seriesId && a.status === 'booked' && new Date(endTime(a)).getTime() < now - 3 * 3600000) a.status = 'done';
  }
  for (const s of state.series) {
    if (!s.active) continue;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < WEEKS_AHEAD * 7; i++) {
      const day = new Date(today.getTime() + i * DAY);
      if (day.getDay() !== s.weekday || s.skips.includes(ymd(day))) continue;
      const occ = occurrenceFor(s, day);
      if (new Date(endTime(occ)).getTime() < now) continue;
      if (!state.appts.some((a) => a.id === occ.id)) state.appts.push(occ);
    }
    for (const a of state.appts) {
      if (a.seriesId !== s.id || !isUpcoming(a)) continue;
      LEGS.forEach((leg) => fillLeg(state, a, leg, s));
    }
  }
  state.appts.sort((x, y) => new Date(x.start) - new Date(y.start));
}
function addSeries(state, data) { if (!state.series) state.series = []; const s = newSeries(data); state.series.push(s); ensureSeries(state); return s; }
/* Change a weekly visit. Future weeks are rebuilt; rides someone already said yes to on their own are kept if the time did not change. */
function editSeries(state, id, data) {
  const s = (state.series || []).find((x) => x.id === id); if (!s) return;
  const timeChanged = Number(data.weekday) !== s.weekday || data.time !== s.time || Number(data.durationMin) !== s.durationMin;
  Object.assign(s, { what: data.what, place: data.place, doctor: data.doctor || '', weekday: Number(data.weekday), time: data.time, durationMin: Number(data.durationMin), standing: { to: data.standing.to || null, back: data.standing.back || null } });
  state.appts = state.appts.filter((a) => !(a.seriesId === id && isUpcoming(a) && timeChanged));
  for (const a of state.appts) {
    if (a.seriesId !== id || !isUpcoming(a)) continue;
    a.reason = s.what; a.place = s.place; a.doctor = s.doctor || s.what;
    LEGS.forEach((leg) => { const r = a[legKey(leg)]; if (r.standing || r.status === 'none' || (r.status === 'asking' && s.standing[leg])) a[legKey(leg)] = blankRide(); });
  }
  ensureSeries(state);
}
function stopSeries(state, id) {
  const s = (state.series || []).find((x) => x.id === id); if (!s) return;
  s.active = false;
  state.appts = state.appts.filter((a) => !(a.seriesId === id && isUpcoming(a)));
}
/* A family member takes a ride every week ("I'll do Thursday drop-offs"). */
function setStanding(state, seriesId, leg, personId) {
  const s = (state.series || []).find((x) => x.id === seriesId); if (!s) return;
  s.standing[leg] = personId;
  for (const a of state.appts) {
    if (a.seriesId !== seriesId || !isUpcoming(a)) continue;
    const r = a[legKey(leg)];
    if (r.status === 'confirmed' && r.driverId !== personId && !r.standing) continue; // someone else already said yes for that week
    if ((r.declinedIds || []).includes(personId) && r.status === 'confirmed') continue;
    a[legKey(leg)] = Object.assign(blankRide(), { status: 'confirmed', driverId: personId, standing: true });
  }
}
/* A standing driver can't make one week: only that week is asked again. Returns the person asked. */
function cantThisWeek(state, apptId, leg) {
  const a = state.appts.find((x) => x.id === apptId); if (!a) return null;
  const r = a[legKey(leg)];
  const who = r.driverId;
  a[legKey(leg)] = Object.assign(blankRide(), { declinedIds: who ? [who] : [] });
  return askNext(state, a, leg);
}
/* Skip one week (holiday, clinic closed). Returns the drivers who should hear about it. */
function skipWeek(state, apptId) {
  const a = state.appts.find((x) => x.id === apptId); if (!a || !a.seriesId) return [];
  const s = (state.series || []).find((x) => x.id === a.seriesId);
  if (s && !s.skips.includes(ymd(a.start))) s.skips.push(ymd(a.start));
  const drivers = legsOf(a).map((l) => a[legKey(l)].driverId || (a[legKey(l)].status === 'asking' ? a[legKey(l)].askedId : null)).filter(Boolean);
  a.status = 'cancelled'; a.skipped = true;
  return Array.from(new Set(drivers)).map((id) => state.people.find((p) => p.id === id)).filter(Boolean);
}
/* Demo: Purna Ji's Thursday physiotherapy at 4 (after Avi's school), with three past weeks for the chart.
   Avi does the drop-offs every week; the ride home is asked each week. */
function addDemoPhysio(state) {
  if ((state.series || []).some((s) => s.demo && s.active)) return null;
  const people = state.people;
  const id = (name) => (people.find((p) => p.name === name) || people[0] || {}).id || null;
  const s = addSeries(state, { what: t(state.profile.lang, 'physio'), place: 'Valley Physical Therapy, 2100 Forest Ave, San Jose', weekday: 4, time: '16:00', durationMin: 60, standing: { to: id('Avi'), back: null } });
  s.demo = true;
  const backs = [id('Krish'), id('Mini'), id('Krish')];
  for (let w = 1; w <= 3; w++) {
    const day = new Date(); day.setHours(0, 0, 0, 0);
    const offset = (day.getDay() - 4 + 7) % 7 || 7;
    const past = new Date(day.getTime() - (offset + (w - 1) * 7) * DAY);
    const occ = occurrenceFor(s, past);
    occ.status = 'done';
    occ.ride = Object.assign(blankRide(), { status: 'confirmed', driverId: id('Avi'), standing: true });
    occ.rideBack = Object.assign(blankRide(), { status: 'confirmed', driverId: backs[w - 1] });
    if (!state.appts.some((a) => a.id === occ.id)) state.appts.push(occ);
  }
  state.appts.sort((x, y) => new Date(x.start) - new Date(y.start));
  // For the demo, ask for next week's ride home right away instead of waiting for the 5-day window.
  const first = state.appts.find((a) => a.seriesId === s.id && isUpcoming(a));
  if (first && first.rideBack.status === 'idle') askNext(state, first, 'back');
  return s;
}

/* Understand "physio every Thursday at 2, about an hour" in any of the 7 languages (offline fallback). */
const WEEKDAY_WORDS = [
  ['sunday', 'sundays', 'domingo', 'रविवार', 'ஞாயிறு', 'ਐਤਵਾਰ', 'chủ nhật', '星期日', '星期天', '周日', '礼拜天'],
  ['monday', 'mondays', 'lunes', 'सोमवार', 'திங்கள்', 'ਸੋਮਵਾਰ', 'thứ hai', '星期一', '周一'],
  ['tuesday', 'tuesdays', 'martes', 'मंगलवार', 'செவ்வாய்', 'ਮੰਗਲਵਾਰ', 'thứ ba', '星期二', '周二'],
  ['wednesday', 'wednesdays', 'miércoles', 'miercoles', 'बुधवार', 'புதன்', 'ਬੁੱਧਵਾਰ', 'thứ tư', '星期三', '周三'],
  ['thursday', 'thursdays', 'jueves', 'गुरुवार', 'बृहस्पतिवार', 'வியாழன்', 'ਵੀਰਵਾਰ', 'thứ năm', '星期四', '周四'],
  ['friday', 'fridays', 'viernes', 'शुक्रवार', 'வெள்ளி', 'ਸ਼ੁੱਕਰਵਾਰ', 'thứ sáu', '星期五', '周五'],
  ['saturday', 'saturdays', 'sábado', 'sabado', 'शनिवार', 'சனி', 'ਸ਼ਨੀਵਾਰ', 'thứ bảy', '星期六', '周六']
];
const WEEKLY_WORDS = /every|each|weekly|a week|हर|हफ़्ते|हफ्ते|每|ஒவ்வொரு|வாரம்|ਹਰ|ਹਫ਼ਤੇ|cada|todos los|semanal|mỗi|hàng tuần|thursdays|mondays|tuesdays|wednesdays|fridays|saturdays|sundays/;
function parseWeekly(text) {
  const s = String(text || '').toLowerCase();
  let weekday = null;
  WEEKDAY_WORDS.forEach((words, i) => { if (weekday === null && words.some((w) => s.includes(w))) weekday = i; });
  if (weekday === null || !WEEKLY_WORDS.test(s)) return null;
  let time = null;
  const m = Array.from(s.matchAll(/(\d{1,3})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|बजे|点|giờ|மணி|ਵਜੇ|min|minute|मिनट|分钟|phút|நிமிட|ਮਿੰਟ|hour|घंटा|小时|tiếng)?/g))
    .find((x) => Number(x[1]) <= 23 && !/min|minute|मिनट|分钟|phút|நிமிட|ਮਿੰਟ|hour|घंटा|小时|tiếng/.test(x[3] || ''));
  if (m) {
    let h = Number(m[1]); const ap = (m[3] || '').replace(/\./g, '');
    if (ap === 'pm' && h < 12) h += 12; else if (ap === 'am' && h === 12) h = 0; else if (!ap.match(/am|pm/) && h >= 1 && h <= 6) h += 12;
    time = String(h).padStart(2, '0') + ':' + (m[2] || '00');
  }
  let durationMin = 60;
  const dm = s.match(/(\d{2,3})\s*(min|minutes|मिनट|分钟|phút|நிமிட|ਮਿੰਟ)/);
  if (dm) durationMin = Number(dm[1]);
  else if (/half an hour|आधा घंटा|半小时|media hora|nửa tiếng/.test(s)) durationMin = 30;
  else if (/hour and a half|90|डेढ़|一个半/.test(s)) durationMin = 90;
  let what = null;
  if (/physio|physical therapy|therapy|फिज़ियो|फिजियो|理疗|物理治疗|பிசியோ|ਫਿਜ਼ੀਓ|fisioterapia|vật lý trị liệu/.test(s)) what = 'physio';
  else if (/dialysis|डायलिसिस|透析|டயாலிசிஸ்|ਡਾਇਲਸਿਸ|diálisis|dialisis|lọc máu|chạy thận/.test(s)) what = 'dialysis';
  const pm = String(text).match(/\bat ((?:[A-Z][\w'&.-]*\s?){1,5})/);
  const place = pm ? pm[1].trim() : '';
  return { weekday, time: time || '14:00', durationMin, what, place };
}

/* ---------- Booking a new visit ---------- */
function nextSlot(state, timePref) {
  const hour = timePref === 'afternoon' ? 14 : 10;
  for (let d = 3; d < 30; d++) {
    const iso = atTime(d, hour, 0); const day = new Date(iso).getDay();
    if (day === 0 || day === 6) continue;
    if (state.appts.some((a) => a.status === 'booked' && sameDay(a.start, iso))) continue;
    return iso;
  }
  return atTime(7, hour, 0);
}

/* ---------- Reminders ---------- */
function computeReminders(state) {
  const L = state.profile.lang, out = [], now = Date.now();
  for (const a of state.appts) {
    if (isUpcoming(a)) {
      const start = new Date(visitTime(a)).getTime();
      const driver = state.people.find((p) => p.id === a.ride.driverId);
      const back = a.rideBack && state.people.find((p) => p.id === a.rideBack.driverId);
      const extra = [driver ? t(L, 'remPickup', { name: driver.name, pickup: fmtTime(pickupTime(a), L) }) : '', back ? t(L, 'bringsYou', { name: back.name }) + ' · ' + fmtTime(endTime(a), L) : '', (a.prep || [])[0] || ''].filter(Boolean).join(' · ');
      if (sameDay(start, now)) out.push({ id: a.id + '-dayof', apptId: a.id, when: start - 2 * 3600000, title: t(L, 'remDayOf', { time: fmtTime(visitTime(a), L), doctor: a.doctor }), body: extra });
      else out.push({ id: a.id + '-before', apptId: a.id, when: start - DAY, title: t(L, 'remDayBefore', { time: fmtTime(visitTime(a), L), doctor: a.doctor }), body: extra, date: fmtDay(a.start, L) });
    }
    if (a.status === 'done' && a.followUp && a.followUp.months) {
      out.push({ id: a.id + '-fu', apptId: a.id, when: new Date(a.start).getTime() + (a.followUp.months * 30 - 14) * DAY, title: t(L, 'remFollow', { doctor: a.doctor }), body: '', follow: true });
    }
  }
  return out.sort((x, y) => x.when - y.when);
}

/* Calendar file with two alarms; phones turn it into real reminders. */
function icsFor(state, a) {
  const L = state.profile.lang;
  const f = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const driver = state.people.find((p) => p.id === a.ride.driverId);
  const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const back = a.rideBack && state.people.find((p) => p.id === a.rideBack.driverId);
  const desc = [a.reason, driver ? t(L, 'remPickup', { name: driver.name, pickup: fmtTime(pickupTime(a), L) }) : '', back ? t(L, 'bringsYou', { name: back.name }) + ' · ' + fmtTime(endTime(a), L) : '', ...(a.prep || []), t(L, 'bring'), a.phone ? t(L, 'clinicPhone') + ': ' + a.phone : ''].filter(Boolean).join('\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CareBridge//EN', 'BEGIN:VEVENT', 'UID:' + a.id + '@carebridge',
    'DTSTAMP:' + f(new Date().toISOString()), 'DTSTART:' + f(visitTime(a)), 'DTEND:' + f(endTime(a)),
    'SUMMARY:' + esc(a.doctor + ' · ' + (a.reason || '')), 'LOCATION:' + esc(a.place), 'DESCRIPTION:' + esc(desc),
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(a.doctor), 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(a.doctor), 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

/* ---------- Understanding what the senior asks for ---------- */
function fallbackUnderstand(text) {
  const s = (text || '').toLowerCase();
  if (URGENT_WORDS.some((w) => s.includes(w))) return { intent: 'emergency' };
  let specialty = null;
  for (const sp of ['ortho', 'cardio', 'eye', 'skin', 'family']) if (KEYWORDS[sp].some((w) => s.includes(w.toLowerCase()))) { specialty = sp; break; }
  if (!specialty && /doctor|डॉक्टर|医生|மருத்துவ|ਡਾਕਟਰ|médico|medico|bác sĩ|appointment|अपॉइंटमेंट|预约|cita|hẹn/.test(s)) specialty = 'family';
  let timePref = null;
  if (TIME_WORDS.morning.some((w) => s.includes(w))) timePref = 'morning';
  else if (TIME_WORDS.afternoon.some((w) => s.includes(w))) timePref = 'afternoon';
  return { intent: specialty ? 'book' : 'other', specialty, timePref, reason: null, reasonEn: null };
}

/* ---------- The CareBridge server (optional) ---------- */
// When the app is hosted on Vercel with the /api functions, it uses them for AI on the website,
// real phone calls, real texts and push notifications. Without a server everything still works in demo mode.
let serverPromise = null;
function getServer() {
  if (!ON_WEBSITE) return Promise.resolve(null);
  if (!serverPromise) {
    serverPromise = fetch('/api/health', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null)).then((j) => (j && j.ok ? j : null)).catch(() => null);
  }
  return serverPromise;
}
async function api(path, body, method) {
  const r = await fetch('/api/' + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CareBridge': '1' },
    body: body ? JSON.stringify(body) : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ('Server returned ' + r.status));
  return j;
}

/* Turn a photo or a recording into a data URL ("data:audio/webm;base64,...") so it can travel as text. */
function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

/* ---------- AI: Claude, through our server ---------- */
// Ask Claude for a JSON answer. Returns null when the server has no AI or something fails;
// every caller then falls back to simple keyword matching, so the app still works.
async function aiJSON(prompt, image) {
  const srv = await getServer();
  if (!srv || !srv.features.ai) return null;
  try {
    const body = { prompt };
    if (image) {
      // Images travel as base64 text inside the JSON body.
      const dataUrl = await fileToDataUrl(image);
      body.images = [{ media_type: image.type || 'image/jpeg', data: dataUrl.split(',')[1] }];
    }
    const j = await api('ai', body);
    return j.json || null;
  } catch (e) {
    console.warn(e);
    return null;
  }
}

async function understand(state, history) {
  const L = state.profile.lang, li = langInfo(L);
  const fb = fallbackUnderstand(history.filter((m) => m.role === 'user').map((m) => m.text).join(' '));
  const doctors = SPECIALTIES.map((sp) => sp + ': ' + doctorFor(state, sp).doctor).join('; ');
  const prompt = [
    'You are CareBridge, a warm, patient assistant helping an older adult book a doctor visit.',
    'The person speaks ' + li.english + '. Their preferred name is "' + (state.profile.name || 'friend') + '". Today is ' + new Date().toDateString() + '.',
    'Known doctors by specialty key: ' + doctors + '.',
    'Conversation so far (oldest first):',
    history.map((m) => (m.role === 'user' ? 'PERSON: ' : 'CAREBRIDGE: ') + m.text).join('\n'),
    '',
    'Reply with ONLY a JSON object:',
    '{"reply": string, "intent": "book"|"question"|"emergency"|"other", "specialty": "ortho"|"family"|"cardio"|"eye"|"skin"|null, "reason": string|null, "reasonEn": string|null, "timePref": "morning"|"afternoon"|"any"|null, "ready": boolean, "weekly": null | {"what": string, "weekday": 0-6 (0 = Sunday), "time": "HH:MM" 24-hour, "durationMin": number, "place": string}}',
    'If they describe a visit that already happens every week (for example "physio every Thursday at 2"), fill "weekly", set intent "book" and ready true: nothing needs booking, CareBridge only arranges the rides there and back. "what" is in ' + li.english + '.',
    'Rules: "reply" is in ' + li.english + ', at most 2 short sentences, warm and respectful, using their preferred name at most once. Ask only ONE question at a time.',
    '"reason" is a 2 to 5 word description in ' + li.english + ' (for example "Knee pain, follow-up"); "reasonEn" is the same in English starting with "a" (for example "a follow-up for knee pain").',
    '"ready" is true when you know the specialty and the reason (time defaults to any). When ready, "reply" should say you will check the details with them.',
    'Never give medical advice. If they describe an emergency (chest pain now, trouble breathing, stroke signs, heavy bleeding), set intent "emergency" and tell them to call 911.'
  ].join('\n');
  const j = await aiJSON(prompt);
  if (!j || typeof j !== 'object') return Object.assign({ via: 'fallback' }, fb);
  const sp = SPECIALTIES.includes(j.specialty) ? j.specialty : (fb.specialty || null);
  const wk = j.weekly && j.weekly.weekday != null && Number(j.weekly.weekday) >= 0 && Number(j.weekly.weekday) <= 6 ? { what: j.weekly.what || null, weekday: Number(j.weekly.weekday), time: /^\d{1,2}:\d{2}$/.test(j.weekly.time || '') ? j.weekly.time.padStart(5, '0') : '14:00', durationMin: Number(j.weekly.durationMin) || 60, place: j.weekly.place || '' } : null;
  return { via: 'ai', reply: String(j.reply || ''), intent: j.intent || fb.intent, specialty: sp, reason: j.reason || null, reasonEn: j.reasonEn || null, timePref: j.timePref || fb.timePref, ready: !!j.ready && !!sp, weekly: wk };
}

/* ---------- Reading an appointment letter, text message or photo ---------- */
const LETTER_FIELDS = ['doctor', 'clinic', 'address', 'reason', 'date', 'time', 'phone'];
function letterPrompt(state, text) {
  const li = langInfo(state.profile.lang);
  return [
    'Read this doctor appointment letter, text message or photo and extract the appointment. Today is ' + new Date().toDateString() + ' (' + new Date().toISOString().slice(0, 10) + ').',
    'Reply with ONLY a JSON object:',
    '{"isAppointment": boolean, "doctor": string|null, "clinic": string|null, "address": string|null, "reason": string|null, "date": "YYYY-MM-DD"|null, "time": "HH:MM" (24-hour)|null, "phone": string|null, "prep": [string], "interpreter": string|null, "unsure": [string]}',
    'Rules: copy names, addresses and phone numbers exactly as written. Work out relative dates ("next Tuesday") from the date of the message if it has one, otherwise from today.',
    'Never guess a missing date or time: use null. "prep" lists short preparation steps written in the letter (arrive early, fasting, what to bring), each translated into ' + li.english + ', at most 5.',
    '"reason" is 2 to 6 words in ' + li.english + '. "unsure" lists the field names you are not confident about (blurry, ambiguous, handwritten).',
    text ? '\nMessage:\n' + text.slice(0, 6000) : '\nThe appointment is in the attached photo.'
  ].join('\n');
}
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
/* No-AI fallback: pull out what simple patterns can find; the person fills in the rest. */
function parseLetterFallback(text) {
  const s = text || '';
  const out = { isAppointment: false, doctor: null, clinic: null, address: null, reason: null, date: null, time: null, phone: null, prep: [], interpreter: null, unsure: [] };
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const fixYear = (m, d, y) => { let yr = y ? (String(y).length === 2 ? 2000 + Number(y) : Number(y)) : now.getFullYear(); const dt = new Date(yr, m - 1, d); if (!y && dt.getTime() < now.getTime() - 30 * DAY) yr += 1; return yr + '-' + pad(m) + '-' + pad(d); };
  let m;
  if ((m = s.match(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/))) out.date = m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);
  else if ((m = s.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) out.date = fixYear(Number(m[1]), Number(m[2]), m[3]);
  else if ((m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d\d))?/i))) out.date = fixYear(MONTHS[m[1].toLowerCase()], Number(m[2]), m[3]);
  else if ((m = s.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?(?:,?\s+(20\d\d))?/i))) out.date = fixYear(MONTHS[m[2].toLowerCase()], Number(m[1]), m[3]);
  if ((m = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s?m\.?\b/i))) { let h = Number(m[1]) % 12; if (m[3].toLowerCase() === 'p') h += 12; out.time = pad(h) + ':' + (m[2] || '00'); }
  else if ((m = s.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/))) out.time = pad(m[1]) + ':' + m[2];
  if ((m = s.match(/\bDr\.?[ \t]+[A-Z][\w.'-]+(?:[ \t]+[A-Z][\w.'-]+){0,2}/))) out.doctor = m[0].replace(/^Dr\.?\s*/, 'Dr. ');
  const first = s.split('\n').map((x) => x.trim()).find((x) => x && !/\d/.test(x) && !/^dr\b/i.test(x) && x.length < 60);
  if (first && /clinic|center|centre|hospital|medical|health|ortho|orthopedics|dental|eye|lab|associates|group/i.test(first)) out.clinic = first;
  if ((m = s.match(/\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/))) out.phone = m[0];
  if ((m = s.match(/\d{2,5}\s+[A-Z][\w.]*(?:\s+[A-Z][\w.]*){0,4}\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Way|Ln|Lane|Ct|Pkwy)\.?(?:[^\n]{0,40})?/))) out.address = m[0].trim();
  out.prep = s.split(/\n|(?<=\.)\s+/).map((x) => x.trim()).filter((x) => /\b(arrive|bring|fast|do not eat|don't eat|no food|wear|check in|check-in)\b/i.test(x)).slice(0, 4);
  if ((m = s.match(/(?:reason|visit type|appointment type)[:\s]+([^\n.]{3,40})/i)) && !/^(purna|questions)/i.test(m[1])) out.reason = m[1].trim();
  out.isAppointment = !!(out.date || out.time || out.doctor);
  return out;
}
/* Returns { via: 'ai'|'fallback'|'none', fields } where fields matches the JSON shape above. */
async function readLetter(state, { text, image }) {
  const j = await aiJSON(letterPrompt(state, text), image);
  if (j && typeof j === 'object') {
    const f = Object.assign({ isAppointment: true, prep: [], unsure: [] }, j);
    f.prep = Array.isArray(f.prep) ? f.prep.filter(Boolean).slice(0, 5) : [];
    f.unsure = Array.isArray(f.unsure) ? f.unsure.filter((x) => LETTER_FIELDS.includes(x)) : [];
    if (f.date && !/^\d{4}-\d{2}-\d{2}$/.test(f.date)) { f.unsure.push('date'); f.date = null; }
    if (f.time && !/^\d{1,2}:\d{2}$/.test(f.time)) { f.unsure.push('time'); f.time = null; }
    return { via: 'ai', fields: f };
  }
  if (image && !text) return { via: 'none', fields: parseLetterFallback('') };
  return { via: 'fallback', fields: parseLetterFallback(text) };
}
/* Shrink a photo before reading it: phones take 12-megapixel pictures; 1600 px is plenty for text. */
function shrinkImage(file, max = 1600) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob((b) => resolve(b || file), 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    } catch (e) { resolve(file); }
  });
}

/* ---------- Voice ---------- */
function speak(text, lang) {
  try {
    if (!('speechSynthesis' in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); const loc = langInfo(lang).locale; u.lang = loc; u.rate = 0.92;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(loc.slice(0, 2).toLowerCase()));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u); return true;
  } catch (e) { return false; }
}
function startListening(lang, onText, onEnd) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  try {
    const r = new SR(); r.lang = langInfo(lang).locale; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => { let s = ''; for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; onText(s, e.results[e.results.length - 1].isFinal); };
    r.onerror = (e) => onEnd(e.error || 'error');
    r.onend = () => onEnd(null);
    r.start(); return r;
  } catch (e) { return null; }
}

/* ---------- Real texts to the family (website version with the server) ---------- */
function rideRequestText(state, a, leg = 'to') {
  const who = state.profile.name || 'Your family member';
  if (a.seriesId) {
    const place = a.place ? a.place.split(',')[0] : 'the clinic';
    return 'CareBridge: ' + who + ' has ' + (a.reason || 'a weekly visit') + ' ' + fmtDay(a.start, 'en') + ' at ' + fmtTime(visitTime(a), 'en') + '. ' +
      (leg === 'back' ? 'Can you bring them home? Pickup at ' + place + ' around ' + fmtTime(endTime(a), 'en') : 'Can you drive them there? Pickup at home ' + fmtTime(pickupTime(a), 'en')) +
      '. Reply YES or NO. No pressure: we will quietly ask someone else.';
  }
  return 'CareBridge: ' + who + ' has a doctor visit ' + fmtDay(a.start, 'en') + ' at ' + fmtTime(visitTime(a), 'en') + (a.place ? ' (' + a.place + ')' : '') +
    '. Pickup ' + fmtTime(pickupTime(a), 'en') + '. Reply YES to drive or NO if you can\'t. No pressure: we will quietly ask someone else.';
}
function rideConfirmText(state, a, leg = 'to') {
  if (a.seriesId) return 'CareBridge: thank you! You are ' + (leg === 'back' ? 'bringing ' + (state.profile.name || 'them') + ' home' : 'driving ' + (state.profile.name || 'them') + ' there') + ' on ' + fmtDay(a.start, 'en') + '. Pickup ' + fmtTime(legTime(a, leg), 'en') + '. We will text you when the session ends.';
  return 'CareBridge: thank you! You are driving ' + (state.profile.name || 'them') + ' on ' + fmtDay(a.start, 'en') + '. Pickup ' + fmtTime(pickupTime(a), 'en') + '. We will remind you the day before.';
}
function voiceText(state, link) { return 'CareBridge: ' + (state.profile.name || 'Your family member') + ' recorded a thank-you for you. Listen: ' + link; }
function doneText(state, a) { return 'CareBridge: ' + (state.profile.name || 'Your family member') + ' is finished at ' + (a.place ? a.place.split(',')[0] : 'the clinic') + ' and ready to come home. Thank you!'; }
function skipText(state, a) { return 'CareBridge: no ' + (a.reason || 'visit') + ' on ' + fmtDay(a.start, 'en') + ' this week, so no ride is needed. Thank you!'; }
/* Text request ids carry the ride: "<visit>" for the ride there, "<visit>|back" for the ride home. */
const smsRequestId = (a, leg) => (leg === 'back' ? a.id + '|back' : a.id);
async function sendText(person, body, extra) {
  if (!person || !person.phone) return false;
  const srv = await getServer();
  if (!srv || !srv.features.sms) return false;
  try { await api('sms/send', Object.assign({ to: person.phone, body }, extra || {})); return true; } catch (e) { console.warn(e); return false; }
}

/* ---------- Push notifications (installable website version) ---------- */
function urlB64ToUint8(b64) { const pad = '='.repeat((4 - (b64.length % 4)) % 4); const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, (c) => c.charCodeAt(0)); }
async function enablePush() {
  const srv = await getServer();
  if (!srv || !srv.features.push || !srv.vapidPublicKey) throw new Error('Push is not set up on the server yet.');
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('This browser cannot receive notifications. On iPhone, add CareBridge to the Home Screen first.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications were not allowed.');
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(srv.vapidPublicKey) }));
  const j = await api('push/subscribe', { subscription: sub.toJSON() });
  return j.id;
}
async function pushNow(pushId, title, body) { if (!pushId) return; try { await api('push/send', { id: pushId, title, body }); } catch (e) { console.warn(e); } }
async function pushSchedule(state) {
  const id = state.settings.pushId; if (!id) return;
  const items = computeReminders(state).filter((r) => r.when > Date.now()).map((r) => ({ key: r.id, at: r.when, title: r.title, body: r.body || '' }));
  try { await api('push/schedule', { id, items }); } catch (e) { console.warn(e); }
}

/* ---------- Sample family for demos ---------- */
function sampleFamily() {
  return [
    // Avi is Purna Ji's granddaughter: 16, just started driving, free after school and on Saturdays.
    { id: 'p-avi', name: 'Avi', relation: 'Granddaughter', days: [1, 2, 3, 4, 5, 6], times: ['pm'], phone: '' },
    { id: 'p-mini', name: 'Mini', relation: 'Daughter', days: [3, 5, 6], times: ['am', 'pm'], phone: '' },
    { id: 'p-abhishek', name: 'Abhishek', relation: 'Son', days: [6, 0], times: ['am', 'pm'], phone: '' },
    { id: 'p-krish', name: 'Krish', relation: 'Grandson', days: [1, 2, 3, 4, 5], times: ['pm'], phone: '' }
  ];
}
