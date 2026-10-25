/* CareBridge — screens. React 18 + htm templates (no build step). */
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const html = htm.bind(React.createElement);

/* ---------- Icons (inline, stroke) ---------- */
const PATHS = {
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  back: 'M15 18l-6-6 6-6',
  mic: 'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 10a7 7 0 0 0 14 0M12 17v5',
  cal: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 2v4M8 2v4M3 10h18',
  car: 'M5 17h14l-1.5-6.5A2 2 0 0 0 15.6 9H8.4a2 2 0 0 0-1.9 1.5zM7.5 19.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM16.5 19.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  check: 'M20 6L9 17l-5-5',
  pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  speaker: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  people: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  msg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  sync: 'M21 12a9 9 0 0 1-15.4 6.4L3 16M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5M3 21v-5h5',
  chev: 'M9 18l6-6-6-6',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
};
function Icon({ name, size = 22, sw = 2, fill }) {
  return html`<svg aria-hidden="true" width=${size} height=${size} viewBox="0 0 24 24" fill=${fill || 'none'} stroke="currentColor" stroke-width=${sw} stroke-linecap="round" stroke-linejoin="round"><path d=${PATHS[name]} /></svg>`;
}

/* ---------- Shared bits ---------- */
function TopBar({ onBack, title, right }) {
  return html`<div className="top">
    ${onBack ? html`<button className="icon-btn" aria-label="Back" onClick=${onBack}><${Icon} name="back" /></button>`
      : html`<div className="brand"><${Icon} name="heart" size=${20} /><span>CareBridge</span></div>`}
    ${title ? html`<div className="grow" style=${{ fontWeight: 650, textAlign: 'center' }}>${title}</div>` : html`<div className="grow"></div>`}
    ${right || html`<div style=${{ width: 48 }}></div>`}
  </div>`;
}
function Avatar({ name, on, size }) {
  return html`<span className=${'av-c' + (on ? ' on' : '')} style=${size ? { width: size, height: size, borderRadius: size / 2 } : null}>${(name || '?').trim().charAt(0).toUpperCase()}</span>`;
}
function DateTile({ iso, lang }) {
  return html`<div className="date-tile"><b>${fmtDayNum(iso, lang)}</b><span>${fmtMonthShort(new Date(iso), lang)}</span></div>`;
}
function serverBadge(h) {
  if (!h || h.mode !== 'real') return 'Demo · Epic test sandbox';
  if (String(h.server || '').startsWith('hosp:')) return 'MyChart · live';
  return h.server === 'epic' ? 'Epic test system · SMART on FHIR' : 'SMART on FHIR · test server';
}
function rideLine(st, a, leg = 'to') {
  const L = st.profile.lang;
  const r = a[legKey(leg)];
  if (!r) return null;
  const d = st.people.find((p) => p.id === r.driverId);
  const wk = !!a.seriesId;
  const pre = wk ? t(L, leg === 'back' ? 'rideHome' : 'rideThere') + ': ' : '';
  const sub = leg === 'back' ? t(L, 'backPickup', { time: fmtTime(endTime(a), L) }) : t(L, 'pickup', { time: fmtTime(pickupTime(a), L) });
  if (r.status === 'confirmed' && d) return { kind: 'ok', leg, text: wk ? t(L, leg === 'back' ? 'bringsYou' : 'dropsYou', { name: d.name }) : t(L, 'driving', { name: d.name }), sub, driver: d };
  if (r.status === 'asking') return { kind: 'wait', leg, text: pre + t(L, 'finding'), asked: st.people.find((p) => p.id === r.askedId) };
  if (r.status === 'none') return { kind: 'none', leg, text: pre + t(L, 'noDriver') };
  if (wk && r.status === 'idle') return { kind: 'later', leg, text: pre + t(L, 'askLater', { day: fmtDay(askDate(a).toISOString(), L) }) };
  return null;
}
/* What the senior sees when someone says yes, for example "Mini is driving you" or "Avi drops you off". */
function saidYesText(L, a, leg, name) {
  if (!a.seriesId) return t(L, 'driving', { name });
  return t(L, leg === 'back' ? 'bringsYou' : 'dropsYou', { name });
}
const rideLines = (st, a) => legsOf(a).map((l) => rideLine(st, a, l)).filter(Boolean);
/* Short status chip for a visit row: driver names when every ride is covered, otherwise a clock. */
function RideChip({ st, a }) {
  const rs = rideLines(st, a);
  if (!rs.length) return null;
  const allOk = rs.every((r) => r.kind === 'ok');
  return html`<span className=${'status ' + (allOk ? 'ok' : 'wait')} aria-label=${rs.map((r) => r.text).join('. ')}>${allOk ? Array.from(new Set(rs.map((r) => r.driver.name))).join(' · ') : html`<${Icon} name="clock" size=${14} />`}</span>`;
}

/* ---------- Notification preview (phone-style banner) ---------- */
function NotifLayer({ notif, onClose }) {
  if (!notif) return null;
  return html`<div className="notif-layer" role="status" aria-live="polite">
    <div className="notif" onClick=${onClose}>
      <div className="app-ic"><${Icon} name="heart" size=${20} /></div>
      <div className="grow">
        <div className="n-head"><span>CareBridge · ${notif.preview ? 'Preview' : 'now'}</span><span>${notif.channel || ''}</span></div>
        <b>${notif.title}</b>
        ${notif.body ? html`<p>${notif.body}</p>` : null}
      </div>
    </div>
  </div>`;
}

/* =====================================================================
   SETUP
   ===================================================================== */
function Setup({ st, update, go, notify, syncing }) {
  const L = st.profile.lang;
  const steps = ['lang', 'name', 'hosp', 'portal', 'circle', 'ready'];
  const step = st.setupStep || 'lang';
  const idx = steps.indexOf(step);
  const setStep = (s) => update((n) => { n.setupStep = s; });
  const back = idx > 0 ? () => setStep(step === 'circle' ? 'hosp' : steps[idx - 1]) : null;
  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <${TopBar} onBack=${back} right=${html`<div className="progress" style=${{ width: 120 }} aria-label=${'Step ' + (idx + 1) + ' of ' + steps.length}>${steps.map((s, i) => html`<span key=${s} className=${i <= idx ? 'on' : ''}></span>`)}</div>`} />
    ${step === 'lang' && html`<${StepLang} st=${st} update=${update} next=${() => setStep('name')} />`}
    ${step === 'name' && html`<${StepName} st=${st} update=${update} next=${() => setStep('hosp')} />`}
    ${step === 'hosp' && html`<${StepHosp} st=${st} update=${update} next=${() => setStep('portal')} skip=${() => setStep('circle')} />`}
    ${step === 'portal' && html`<${StepPortal} st=${st} update=${update} next=${() => setStep('circle')} cancel=${() => setStep('hosp')} syncing=${syncing} />`}
    ${step === 'circle' && html`<${StepCircle} st=${st} update=${update} next=${() => setStep('ready')} />`}
    ${step === 'ready' && html`<${StepReady} st=${st} update=${update} go=${go} notify=${notify} />`}
  </div>`;
}

function LangTiles({ value, onPick }) {
  return html`<div className="tiles" role="group" aria-label="Languages">
    ${LANGS.map((l) => html`<button key=${l.id} className="tile" aria-pressed=${value === l.id} onClick=${() => onPick(l.id)} lang=${l.id}>
      <span><span className="tile-name">${l.native}</span><span className="muted small">${l.english}</span></span>
      ${value === l.id ? html`<span className="check"><${Icon} name="check" size=${15} sw=${3.2} /></span>` : null}
    </button>`)}
  </div>`;
}

function StepLang({ st, update, next }) {
  const L = st.profile.lang;
  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="stack"><h1 className="h1">${t(L, 'langTitle')}</h1><p className="sub">${t(L, 'langSub')}</p></div>
    <${LangTiles} value=${L} onPick=${(id) => update((n) => { n.profile.lang = id; })} />
    <div className="card card-tint row">
      <button className="icon-btn" style=${{ background: 'var(--bg)', color: 'var(--accent)' }} aria-label=${t(L, 'hearIt')} onClick=${() => speak(t(L, 'hello', { name: '' }).replace(' !', '!').replace(/\s+,/, ','), L)}><${Icon} name="speaker" /></button>
      <div className="grow"><div className="eyebrow" style=${{ color: 'var(--accent-deep)' }}>${t(L, 'soundLike')}</div><div>${t(L, 'hello', { name: '' }).replace(/\s+([!,，！])/, '$1')}</div></div>
    </div>
    <button className="btn btn-primary btn-block" style=${{ marginTop: 'auto' }} onClick=${next}>${t(L, 'continue')}</button>
  </div>`;
}

function StepName({ st, update, next }) {
  const L = st.profile.lang;
  const [v, setV] = useState(st.profile.name || '');
  const done = () => { update((n) => { n.profile.name = v.trim(); }); next(); };
  return html`<form className="stack-lg" style=${{ flex: 1 }} onSubmit=${(e) => { e.preventDefault(); if (v.trim()) done(); }}>
    <div className="stack"><h1 className="h1">${t(L, 'nameTitle')}</h1><p className="sub">${t(L, 'nameSub')}</p></div>
    <div className="field"><label htmlFor="cb-name">${t(L, 'personName')}</label>
      <input id="cb-name" className="input" value=${v} placeholder=${t(L, 'namePh')} autoComplete="name" onInput=${(e) => setV(e.target.value)} autoFocus /></div>
    <button type="submit" className="btn btn-primary btn-block" style=${{ marginTop: 'auto' }} disabled=${!v.trim()}>${t(L, 'continue')}</button>
  </form>`;
}

function StepHosp({ st, update, next, skip }) {
  const L = st.profile.lang;
  const sel = st.hospital ? st.hospital.id : 'scvmc';
  const pick = (h) => update((n) => { n.hospital = Object.assign({}, n.hospital || {}, { id: h.id, name: h.name, portal: h.portal }); });
  useEffect(() => { if (!st.hospital) pick(HOSPITALS[0]); }, []);
  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="stack"><div className="row" style=${{ justifyContent: 'space-between' }}><h1 className="h1">${t(L, 'hospTitle')}</h1></div><p className="sub">${t(L, 'hospSub')}</p></div>
    <div className="stack">
      ${HOSPITALS.map((h) => html`<button key=${h.id} className="list-choice" aria-pressed=${sel === h.id} onClick=${() => pick(h)}>
        <span className="grow"><b style=${{ display: 'block' }}>${h.name}</b><span className="muted small">${h.portal}</span></span>
        <span className="radio">${sel === h.id ? html`<${Icon} name="check" size=${15} sw=${3} />` : null}</span>
      </button>`)}
    </div>
    <div className="card row" style=${{ background: 'var(--soft)', border: 'none', alignItems: 'flex-start' }}><${Icon} name="lock" /><p className="small">${t(L, 'hospPrivacy')}</p></div>
    <div className="stack" style=${{ marginTop: 'auto' }}>
      <button className="btn btn-primary btn-block" onClick=${next}>${t(L, 'signIn')} · MyChart</button>
      <button className="btn btn-secondary btn-block" onClick=${skip}>${t(L, 'skip')}</button>
    </div>
  </div>`;
}

/* Hospital sign-in. Real SMART on FHIR on the website; simulated demo data otherwise. */
function StepPortal({ st, update, next, cancel, syncing }) {
  const L = st.profile.lang;
  const [phase, setPhase] = useState(st.hospital && st.hospital.connectedAt ? 'done' : 'login');
  const [count, setCount] = useState(st.appts.length);
  const [err, setErr] = useState('');
  const hosp = st.hospital || HOSPITALS[0];

  const useDemo = async () => {
    setPhase('sync');
    await sleep(1400);
    const b = demoBundle(st.profile.name);
    update((n) => {
      n.patient = mapPatient(b.patient, b.meds);
      mergeSync(n, b.appts.map(mapAppointment));
      n.hospital = Object.assign({}, n.hospital, { mode: 'demo', server: 'demo', connectedAt: Date.now(), lastSync: Date.now() });
    });
    setCount(b.appts.length); setPhase('done');
  };
  const useReal = async (serverId) => {
    setErr('');
    try { update((n) => { n.setupStep = 'portal'; n.hospital = Object.assign({}, n.hospital, { pendingServer: serverId }); }); await smartBegin(serverId); }
    catch (e) { setErr('Could not reach the sign-in page: ' + (e.message || e)); }
  };

  if (syncing || phase === 'sync') return html`<div className="stack-lg center" style=${{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner"></div><h2 className="h2">${t(L, 'syncing')}</h2><p className="sub">${hosp.name}</p></div>`;

  if (phase === 'done' || (phase === 'login' && st.hospital && st.hospital.connectedAt)) return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="card-grad stack">
      <div className="row"><span className="check"><${Icon} name="check" size=${15} sw=${3.2} /></span><b>${t(L, 'connected')}</b></div>
      <div className="h2">${hosp.name}</div>
      <div>${t(L, 'syncedN', { n: st.appts.length || count })}</div>
    </div>
    ${st.patient ? html`<div className="card stack">
      <div className="row" style=${{ justifyContent: 'space-between' }}><span className="eyebrow">${st.patient.fullName}</span><span className="badge-demo">${serverBadge(st.hospital)}</span></div>
      <dl className="kv"><dt>${t(L, 'dob')}</dt><dd>${st.patient.birthDate || '—'}</dd><dt>${t(L, 'mrn')}</dt><dd>${st.patient.mrn || '—'}</dd></dl>
    </div>` : null}
    <div className="stack">${st.appts.filter(isUpcoming).slice(0, 3).map((a) => html`<div key=${a.id} className="row card"><${DateTile} iso=${a.start} lang=${L} /><div className="grow"><b>${a.doctor}</b><div className="muted small">${fmtTime(a.start, L)} · ${a.reason}</div></div></div>`)}</div>
    <button className="btn btn-primary btn-block" style=${{ marginTop: 'auto' }} onClick=${next}>${t(L, 'continue')}</button>
  </div>`;

  if (ON_WEBSITE) return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="stack"><h1 className="h1">${t(L, 'hospTitle')}</h1><p className="sub">${hosp.name}</p></div>
    <div className="card stack">
      <span className="eyebrow">Real sign-in · SMART on FHIR</span>
      <p className="small">You will go to the hospital system's own sign-in page, then come back here. CareBridge only asks to read appointments, the patient record and medicines.</p>
      ${CONFIG.EPIC_PROD_CLIENT_ID && hosp.fhir ? html`<button className="btn btn-primary btn-block" onClick=${() => useReal('hosp:' + hosp.id)}>${t(L, 'signIn')} · ${hosp.name}</button>
        <p className="small muted">Opens ${hosp.name}'s own MyChart sign-in page. CareBridge never sees the password.</p>` : null}
      <button className=${'btn btn-block ' + (CONFIG.EPIC_PROD_CLIENT_ID ? 'btn-secondary' : 'btn-primary')} disabled=${!CONFIG.EPIC_CLIENT_ID} onClick=${() => useReal('epic')}>${t(L, 'signIn')} · Epic test system</button>
      ${!CONFIG.EPIC_CLIENT_ID ? html`<p className="small muted">Needs an Epic client ID (see README). Test login once set: <code>fhircamila</code> / <code>epicepic1</code></p>` : html`<p className="small muted">Test login: <code>fhircamila</code> / <code>epicepic1</code></p>`}
      <button className="btn btn-secondary btn-block" onClick=${() => useReal('smart')}>Use the SMART Health IT test server</button>
    </div>
    ${err ? html`<p className="small" style=${{ color: 'var(--danger)' }}>${err}</p>` : null}
    <div className="stack" style=${{ marginTop: 'auto' }}>
      <button className="btn btn-soft btn-block" onClick=${useDemo}>Use demo data instead</button>
      <button className="btn btn-secondary btn-block" onClick=${cancel}>${t(L, 'back')}</button>
    </div>
  </div>`;

  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="portal">
      <div className="portal-head"><b>${hosp.name}</b><span className="badge-demo">Demo · Epic test sandbox</span></div>
      <div className="portal-body">
        <p className="small muted">Patient sign-in (simulated). On the real app this is the hospital's own page.</p>
        <div className="field"><label htmlFor="pt-user">Username</label><input id="pt-user" className="input" value="Epic test patient" readOnly /></div>
        <div className="field"><label htmlFor="pt-pass">Password</label><input id="pt-pass" className="input" type="password" value="demo-only" disabled /></div>
        <div className="divider"></div>
        <b>CareBridge would like to read:</b>
        <ul className="small" style=${{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
          <li>Your appointments and doctors</li><li>Clinic addresses</li><li>Your name, date of birth and record number</li><li>Your medicine list</li>
        </ul>
        <p className="small muted">CareBridge cannot change anything in your hospital record.</p>
      </div>
    </div>
    <div className="stack" style=${{ marginTop: 'auto' }}>
      <button className="btn btn-primary btn-block" onClick=${useDemo}>Allow</button>
      <button className="btn btn-secondary btn-block" onClick=${cancel}>${t(L, 'cancel')}</button>
    </div>
  </div>`;
}

function CircleEditor({ st, update, lang }) {
  const L = lang;
  const [name, setName] = useState('');
  const add = () => { const v = name.trim(); if (!v) return; update((n) => { n.people.push({ id: uid('p'), name: v, relation: '', days: [1, 2, 3, 4, 5], times: ['am', 'pm'], phone: '' }); }); setName(''); };
  const edit = (id, fn) => update((n) => { const p = n.people.find((x) => x.id === id); if (p) fn(p); });
  return html`<div className="stack">
    ${st.people.map((p) => html`<div key=${p.id} className="card stack">
      <div className="row"><${Avatar} name=${p.name} on=${true} />
        <div className="grow"><input className="input" style=${{ minHeight: 44 }} aria-label=${t(L, 'personName')} value=${p.name} onInput=${(e) => edit(p.id, (x) => { x.name = e.target.value; })} /></div>
        <button className="icon-btn" aria-label=${t(L, 'remove') + ' ' + p.name} onClick=${() => update((n) => { n.people = n.people.filter((x) => x.id !== p.id); })}><${Icon} name="x" /></button>
      </div>
      <div className="row" style=${{ gap: 8 }}>
        <input className="input grow" style=${{ minHeight: 44 }} aria-label=${t(L, 'relation')} placeholder=${t(L, 'relation')} value=${p.relation} onInput=${(e) => edit(p.id, (x) => { x.relation = e.target.value; })} />
        <input className="input grow" style=${{ minHeight: 44 }} aria-label=${t(L, 'phoneOpt')} placeholder=${t(L, 'phoneOpt')} inputMode="tel" value=${p.phone || ''} onInput=${(e) => edit(p.id, (x) => { x.phone = e.target.value; })} />
      </div>
      <span className="eyebrow">${t(L, 'freeWhen')}</span>
      <div className="chips" role="group" aria-label=${t(L, 'freeWhen')}>
        ${[1, 2, 3, 4, 5, 6, 0].map((d) => html`<button key=${d} className="chip" aria-pressed=${p.days.includes(d)} onClick=${() => edit(p.id, (x) => { x.days = x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d]; })}>${fmtWeekdayShort(d, L)}</button>`)}
      </div>
      <div className="chips">
        ${['am', 'pm'].map((s) => html`<button key=${s} className="chip" aria-pressed=${p.times.includes(s)} onClick=${() => edit(p.id, (x) => { x.times = x.times.includes(s) ? x.times.filter((y) => y !== s) : [...x.times, s]; })}>${t(L, s)}</button>`)}
      </div>
    </div>`)}
    <form className="row" onSubmit=${(e) => { e.preventDefault(); add(); }}>
      <input id="cb-person" className="input grow" placeholder=${t(L, 'personName')} aria-label=${t(L, 'personName')} value=${name} onInput=${(e) => setName(e.target.value)} />
      <button type="submit" className="btn btn-soft" aria-label=${t(L, 'addPerson')}><${Icon} name="plus" />${t(L, 'addPerson')}</button>
    </form>
  </div>`;
}

function StepCircle({ st, update, next }) {
  const L = st.profile.lang;
  const finish = () => {
    update((n) => {
      // Demo history: who drove to past visits (the real portal does not know this).
      if (n.hospital && n.hospital.mode === 'demo' && n.people.length) {
        let i = 0; n.appts.filter((a) => a.status === 'done' && !a.ride.driverId).forEach((a) => { a.ride.driverId = n.people[i % n.people.length].id; a.ride.status = 'confirmed'; i++; });
      }
      // Ask the circle about visits the hospital already has on the calendar.
      n.appts.filter((a) => isUpcoming(a) && !a.seriesId).forEach((a) => {
        if (a.ride.status === 'idle' || a.ride.status === 'none') {
          const c = askNext(n, a);
          if (c && n.hospital && n.hospital.mode === 'demo') acceptRide(n, a.id, c.id); // demo: the family already said yes
        }
      });
    });
    next();
  };
  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="stack"><h1 className="h1">${t(L, 'circleTitle')}</h1><p className="sub">${t(L, 'circleSub')}</p></div>
    ${!st.people.length ? html`<button className="btn btn-soft btn-block" onClick=${() => update((n) => { n.people = sampleFamily(); })}><${Icon} name="people" />${t(L, 'useSample')}</button>` : null}
    <${CircleEditor} st=${st} update=${update} lang=${L} />
    <div className="stack" style=${{ marginTop: 'auto' }}>
      <button className="btn btn-primary btn-block" onClick=${finish}>${t(L, 'continue')}</button>
      ${!st.people.length ? html`<button className="btn btn-secondary btn-block" onClick=${finish}>${t(L, 'skip')}</button>` : null}
    </div>
  </div>`;
}

function StepReady({ st, update, go, notify }) {
  const L = st.profile.lang;
  const finish = () => {
    update((n) => { n.profile.setupDone = true; n.setupStep = 'done'; });
    go({ name: 'home' });
    const next = st.appts.filter(isUpcoming)[0];
    if (next) {
      const d = st.people.find((p) => p.id === next.ride.driverId);
      setTimeout(() => notify(fmtDay(next.start, L) + ' · ' + fmtTime(next.start, L) + ' · ' + next.doctor, d ? t(L, 'driving', { name: d.name }) : '', { preview: true, channel: 'Push' }), 900);
    }
  };
  const items = [
    st.hospital && st.hospital.connectedAt ? [t(L, 'readyHosp'), st.hospital.name] : null,
    [t(L, 'readyCircle', { n: st.people.length }), st.people.map((p) => p.name).join(', ') || '—'],
    [t(L, 'readyLang'), langInfo(L).native]
  ].filter(Boolean);
  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="stack" style=${{ alignItems: 'center', textAlign: 'center', paddingTop: 20 }}>
      <div className="mic" style=${{ width: 96, height: 96, boxShadow: '0 0 0 12px var(--tint)' }} aria-hidden="true"><${Icon} name="check" size=${44} sw=${2.6} /></div>
      <h1 className="h1" style=${{ marginTop: 20 }}>${t(L, 'readyTitle', { name: st.profile.name })}</h1>
      <p className="sub">${t(L, 'readySub')}</p>
    </div>
    <div className="card">${items.map((it, i) => html`<div key=${i} className="setting" style=${i === items.length - 1 ? { borderBottom: 'none' } : null}><span className="muted">${it[0]}</span><b style=${{ textAlign: 'right' }}>${it[1]}</b></div>`)}</div>
    <button className="btn btn-primary btn-block" style=${{ marginTop: 'auto' }} onClick=${finish}>${t(L, 'goHome')}</button>
  </div>`;
}

/* =====================================================================
   HOME DASHBOARD
   ===================================================================== */
function Home({ st, go, openDemo }) {
  const L = st.profile.lang;
  const hour = new Date().getHours();
  const greet = t(L, hour < 12 ? 'greetM' : hour < 17 ? 'greetA' : 'greetE', { name: st.profile.name });
  const upcoming = st.appts.filter(isUpcoming);
  const next = upcoming[0];
  return html`<div className="stack-lg">
    <${TopBar} right=${html`<div className="row" style=${{ gap: 8 }}><button className="demo-pill" onClick=${openDemo}>Demo</button><button className="icon-btn" aria-label=${t(L, 'settings')} onClick=${() => go({ name: 'settings' })}><${Icon} name="gear" /></button></div>`} />
    <h1 className="h1">${greet}</h1>
    <div className="mic-wrap">
      <button className="mic" aria-label=${t(L, 'tapTalk')} onClick=${() => go({ name: 'talk', listen: true })}><${Icon} name="mic" size=${60} sw=${1.8} /></button>
      <div className="h2" style=${{ marginTop: 14 }}>${t(L, 'tapTalk')}</div>
      <div className="sub center">${t(L, 'tapTalkSub')}</div>
    </div>
    ${next ? html`<${NextVisitCard} st=${st} a=${next} go=${go} />` : html`<div className="card card-tint center sub">${t(L, 'noUpcoming')}</div>`}
    <div className="quick">
      <button onClick=${() => go({ name: 'talk' })}><${Icon} name="cal" size=${26} sw=${1.8} />${t(L, 'book')}</button>
      <button onClick=${() => go({ name: 'rides' })}><${Icon} name="car" size=${26} sw=${1.8} />${t(L, 'rides')}</button>
      <button onClick=${() => go({ name: 'reminders' })}><${Icon} name="bell" size=${26} sw=${1.8} />${t(L, 'reminders')}</button>
      <button onClick=${() => go({ name: 'letter' })}><${Icon} name="doc" size=${26} sw=${1.8} />${t(L, 'addFromLetter')}</button>
    </div>
    ${upcoming.length > 1 ? html`<div className="card stack" style=${{ gap: 0 }}>
      <span className="eyebrow" style=${{ marginBottom: 4 }}>${t(L, 'upcoming')}</span>
      ${upcoming.slice(1, 5).map((a) => html`<button key=${a.id} className="visit-row" onClick=${() => go({ name: 'visit', id: a.id })}>
        <${DateTile} iso=${a.start} lang=${L} />
        <div className="grow"><b style=${{ display: 'block' }}>${a.seriesId ? a.reason : a.doctor}</b><span className="muted small">${fmtTime(a.start, L)} · ${a.seriesId ? t(L, 'everyDay', { day: fmtWeekdayLong(new Date(a.start).getDay(), L) }) : a.reason}</span></div>
        <${RideChip} st=${st} a=${a} />
      </button>`)}
    </div>` : null}
    <${PastVisits} st=${st} />
  </div>`;
}

function NextVisitCard({ st, a, go }) {
  const L = st.profile.lang;
  const rs = rideLines(st, a);
  const wait = rs.find((r) => r.kind === 'wait' && r.asked);
  const none = rs.find((r) => r.kind === 'none');
  const today = sameDay(a.start, Date.now()) || st.demoToday === a.id;
  return html`<div className="card-grad stack" style=${{ gap: 8 }}>
    <button style=${{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }} onClick=${() => go({ name: 'visit', id: a.id })} aria-label=${t(L, 'nextVisit') + ': ' + a.doctor}>
      <span className="eyebrow">${today ? t(L, 'today') : t(L, 'nextVisit')}</span>
      <span className="h2" style=${{ color: '#fff' }}>${fmtDay(a.start, L)} · ${fmtTime(visitTime(a), L)}</span>
      <span>${a.seriesId ? a.reason + ' · ' + t(L, 'everyDay', { day: fmtWeekdayLong(new Date(a.start).getDay(), L) }) : a.doctor}${a.place ? ' · ' + a.place.split(',')[0] : ''}</span>
    </button>
    ${a.delayMin ? html`<div className="row small" style=${{ background: 'rgba(255,255,255,.16)', borderRadius: 12, padding: '8px 12px' }}><${Icon} name="clock" size=${18} />${t(L, 'lateTitle', { n: a.delayMin })}</div>` : null}
    ${rs.map((r, i) => html`<div key=${r.leg} className="row" style=${{ borderTop: i === 0 ? '1px solid rgba(255,255,255,.25)' : 'none', paddingTop: i === 0 ? 10 : 2, marginTop: 2 }}>
      ${r.driver ? html`<${Avatar} name=${r.driver.name} size=${36} />` : html`<${Icon} name=${r.kind === 'later' ? 'clock' : 'car'} />`}
      <div className="grow"><b>${r.text}</b>${r.sub ? html`<div className="muted small">${r.sub}</div>` : null}</div>
    </div>`)}
    ${wait ? html`<button className="btn btn-sm" style=${{ background: 'rgba(255,255,255,.18)', color: '#fff' }} onClick=${() => go({ name: 'family', id: wait.asked.id })}>Demo: open ${wait.asked.name}'s phone</button>` : null}
    ${none ? html`<button className="btn btn-sm" style=${{ background: '#fff', color: 'var(--accent-deep)' }} onClick=${() => go({ name: 'rides' })}>${t(L, 'otherRides')}</button>` : null}
  </div>`;
}

/* Past visits: bars by who drove, plus the last six months at a glance. */
function PastVisits({ st }) {
  const L = st.profile.lang;
  const past = st.appts.filter((a) => a.status === 'done').sort((a, b) => new Date(b.start) - new Date(a.start));
  if (!past.length) return null;
  const counts = {};
  // Every ride counts: a weekly visit with a ride there and a ride home gives two.
  past.forEach((a) => {
    const ids = legsOf(a).map((l) => a[legKey(l)] && a[legKey(l)].driverId).filter((id) => id && st.people.some((p) => p.id === id));
    if (!ids.length) counts._none = (counts._none || 0) + 1;
    ids.forEach((k) => { counts[k] = (counts[k] || 0) + 1; });
  });
  const rows = Object.entries(counts).map(([k, n]) => ({ k, n, name: k === '_none' ? t(L, 'notRecorded') : st.people.find((p) => p.id === k).name })).sort((a, b) => (a.k === '_none') - (b.k === '_none') || b.n - a.n);
  const max = Math.max(...rows.map((r) => r.n));
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d; });
  return html`<div className="card stack-lg">
    <div className="row" style=${{ justifyContent: 'space-between' }}>
      <div><span className="eyebrow">${t(L, 'past')}</span><div className="h2">${t(L, 'pastSub')}</div></div>
      <span className="status">${t(L, 'visitsN', { n: past.length })}</span>
    </div>
    <div className="bars" role="img" aria-label=${rows.map((r) => r.name + ' ' + r.n).join(', ')}>
      ${rows.map((r) => html`<div key=${r.k} className="bar-row">
        <span style=${{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${r.name}</span>
        <div className="bar-track"><div className=${'bar-fill' + (r.k === '_none' ? ' grey' : '')} style=${{ width: (r.n / max * 100) + '%' }}></div></div>
        <span className="bar-num">${r.n}</span>
      </div>`)}
    </div>
    <div>
      <div className="months" aria-hidden="true">
        ${months.map((m, i) => {
          const inMonth = past.filter((a) => new Date(a.start).getMonth() === m.getMonth() && new Date(a.start).getFullYear() === m.getFullYear());
          return html`<div key=${i} className="month">
            <div className="dots">${inMonth.map((a) => html`<span key=${a.id} className=${a.ride && a.ride.driverId ? 'dot' : 'dot grey'} title=${a.doctor}></span>`)}</div>
            <small>${fmtMonthShort(m, L)}</small>
          </div>`;
        })}
      </div>
    </div>
    <div className="stack" style=${{ gap: 0 }}>
      ${past.slice(0, 3).map((a) => { const names = Array.from(new Set(legsOf(a).map((l) => st.people.find((p) => p.id === (a[legKey(l)] && a[legKey(l)].driverId))).filter(Boolean).map((p) => p.name))); return html`<div key=${a.id} className="visit-row" style=${{ cursor: 'default' }}>
        <${DateTile} iso=${a.start} lang=${L} />
        <div className="grow"><b style=${{ display: 'block' }}>${a.seriesId ? a.reason : a.doctor}</b><span className="muted small clamp2">${a.seriesId ? a.place.split(',')[0] : a.reason}</span></div>
        ${names.length ? html`<span className="status ok"><${Icon} name="car" size=${14} />${names.join(' · ')}</span>` : null}
      </div>`; })}
    </div>
  </div>`;
}

/* =====================================================================
   TALK (book by voice or typing)
   ===================================================================== */
function Talk({ st, update, go, listen }) {
  const L = st.profile.lang;
  const [msgs, setMsgs] = useState([{ role: 'assistant', text: t(L, 'hello', { name: st.profile.name }) }]);
  const [draft, setDraft] = useState(null);
  const [wk, setWk] = useState(null); // a weekly visit heard in the conversation (v1.2)
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [micMsg, setMicMsg] = useState('');
  const recRef = useRef(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [msgs, draft, busy]);
  useEffect(() => { if (listen) startMic(); return () => { try { recRef.current && recRef.current.abort(); } catch (e) { } }; }, []);

  const startMic = () => {
    if (live) { try { recRef.current && recRef.current.stop(); } catch (e) { } return; }
    setMicMsg('');
    const r = startListening(L, (s, final) => { setText(s); if (final) { setLive(false); send(s); } }, (err) => { setLive(false); if (err && err !== 'no-speech' && err !== 'aborted') setMicMsg(t(L, 'micOff')); });
    if (!r) { setMicMsg(t(L, 'micOff')); return; }
    recRef.current = r; setLive(true);
  };

  const send = async (raw) => {
    const s = (raw != null ? raw : text).trim();
    if (!s || busy) return;
    setText(''); setDraft(null); setWk(null);
    const history = [...msgs, { role: 'user', text: s }];
    setMsgs(history); setBusy(true);
    const quick = parseWeekly(history.filter((m) => m.role === 'user').slice(-2).map((m) => m.text).join(' '));
    const res = await understand(st, history);
    setBusy(false);
    if (res.intent === 'emergency') { setMsgs((m) => [...m, { role: 'assistant', text: res.reply || t(L, 'emergency'), alert: true }]); return; }
    const weekly = (res.via === 'ai' && res.weekly) || quick;
    if (weekly) {
      const what = weekly.what === 'physio' || weekly.what === 'dialysis' ? t(L, weekly.what) : (weekly.what || (quick && quick.what ? t(L, quick.what) : ''));
      setWk({ what, weekday: weekly.weekday, time: weekly.time, durationMin: weekly.durationMin || 60, place: weekly.place || (quick && quick.place) || '' });
      setMsgs((m) => [...m, { role: 'assistant', text: t(L, 'wkHeard') }]);
      return;
    }
    const ready = res.via === 'ai' ? res.ready : !!res.specialty;
    if (ready && res.specialty) {
      const doc = doctorFor(st, res.specialty);
      setDraft({ specialty: res.specialty, doctor: doc.doctor, place: doc.place, clinic: doc.clinic, reason: res.reason || t(L, 'rs_' + res.specialty), reasonEn: res.reasonEn || REASON_EN[res.specialty], timePref: res.timePref && res.timePref !== 'any' ? res.timePref : 'any' });
      setMsgs((m) => [...m, { role: 'assistant', text: (res.via === 'ai' && res.reply) || t(L, 'gotIt') }]);
    } else {
      setMsgs((m) => [...m, { role: 'assistant', text: (res.via === 'ai' && res.reply) || t(L, 'askMore') }]);
    }
  };
  const tLabel = (p) => t(L, p === 'morning' ? 'tMorning' : p === 'afternoon' ? 'tAfternoon' : 'tAny');

  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <${TopBar} onBack=${() => go({ name: 'home' })} right=${html`<button className="demo-pill" style=${{ textTransform: 'none', letterSpacing: 0, fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', background: 'var(--tint)', borderColor: 'transparent' }} onClick=${() => go({ name: 'settings', focus: 'lang' })} aria-label=${'Language: ' + langInfo(L).english}><${Icon} name="globe" size=${16} />${langInfo(L).native}</button>`} />
    <div className="chat" aria-live="polite">
      ${msgs.map((m, i) => html`<div key=${i} className=${'bubble ' + (m.role === 'user' ? 'me' : 'ai') + (m.alert ? ' alert' : '')} lang=${L}>${m.text}</div>`)}
      ${msgs.length === 1 && !busy ? html`<div className="stack" style=${{ alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: '86%' }}>
        <span className="eyebrow">${t(L, 'tryExample')}</span>
        <button className="btn btn-secondary" style=${{ textAlign: 'left', height: 'auto', padding: '12px 14px', fontWeight: 500, lineHeight: 1.4 }} onClick=${() => send(t(L, 'exampleReq'))}>“${t(L, 'exampleReq')}”</button>
        <button className="btn btn-secondary" style=${{ textAlign: 'left', height: 'auto', padding: '12px 14px', fontWeight: 500, lineHeight: 1.4 }} onClick=${() => send(t(L, 'exampleWeekly'))}>“${t(L, 'exampleWeekly')}”</button>
      </div>` : null}
      ${wk ? html`<div className="confirm">
        <span className="eyebrow" style=${{ color: 'var(--accent)' }}>${t(L, 'weekly')}</span>
        <dl className="kv"><dt>${t(L, 'wkWhat')}</dt><dd>${wk.what || '—'}</dd><dt>${t(L, 'wkDay')}</dt><dd>${t(L, 'everyDay', { day: fmtWeekdayLong(wk.weekday, L) })}</dd><dt>${t(L, 'time')}</dt><dd>${fmtTime(seriesTimeIso(wk), L)} · ${t(L, 'minN', { n: wk.durationMin })}</dd>${wk.place ? html`<dt>${t(L, 'wkWhere')}</dt><dd>${wk.place}</dd>` : null}</dl>
        <p className="small muted">${t(L, 'wkNoBook')}</p>
        <div className="stack">
          <button className="btn btn-primary btn-block" onClick=${() => go({ name: 'weekly', prefill: wk })}>${t(L, 'setUpWeekly')}</button>
          <button className="btn btn-secondary btn-block" onClick=${() => { setWk(null); setMsgs((m) => [...m, { role: 'assistant', text: t(L, 'askChange') }]); }}>${t(L, 'changeIt')}</button>
        </div>
      </div>` : null}
      ${busy ? html`<div className="bubble ai"><div className="typing" aria-label=${t(L, 'thinking')}><i></i><i></i><i></i></div></div>` : null}
      ${draft ? html`<div className="confirm">
        <span className="eyebrow" style=${{ color: 'var(--accent)' }}>${t(L, 'checkTitle')}</span>
        <dl className="kv"><dt>${t(L, 'doctor')}</dt><dd>${draft.doctor}<div className="muted small" style=${{ fontWeight: 500 }}>${t(L, 'sp_' + draft.specialty)}</div></dd><dt>${t(L, 'reason')}</dt><dd>${draft.reason}</dd><dt>${t(L, 'time')}</dt><dd>${tLabel(draft.timePref)}</dd></dl>
        <b style=${{ fontSize: '1.1rem' }}>${t(L, 'isRight')}</b>
        <div className="tiles">
          <button className="btn btn-primary" onClick=${() => go({ name: 'call', draft })}>${t(L, 'yes')}</button>
          <button className="btn btn-secondary" onClick=${() => { setDraft(null); setMsgs((m) => [...m, { role: 'assistant', text: t(L, 'askChange') }]); }}>${t(L, 'changeIt')}</button>
        </div>
      </div>` : null}
      <div ref=${endRef}></div>
    </div>
    ${micMsg ? html`<p className="small muted center">${micMsg}</p>` : null}
    <form className="composer" onSubmit=${(e) => { e.preventDefault(); send(); }}>
      <button type="button" className=${'mic-sm' + (live ? ' live' : '')} aria-label=${t(L, 'speak')} aria-pressed=${live} onClick=${startMic}><${Icon} name="mic" size=${26} /></button>
      ${live && !text ? html`<div className="grow row"><div className="wave" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map((i) => html`<i key=${i} style=${{ animationDelay: (i * 0.12) + 's' }}></i>`)}</div><b>${t(L, 'listening')}</b></div>`
        : html`<input id="cb-msg" className="input grow" value=${text} placeholder=${t(L, 'typeHere')} aria-label=${t(L, 'typeHere')} onInput=${(e) => setText(e.target.value)} lang=${L} />`}
      <button type="submit" className="icon-btn" style=${{ background: 'var(--bg)', color: 'var(--accent)' }} aria-label=${t(L, 'send')} disabled=${!text.trim() || busy}><${Icon} name="send" /></button>
    </form>
  </div>`;
}

/* =====================================================================
   CALL (simulated clinic call with live transcript)
   ===================================================================== */
function Call(props) {
  const { srv, st } = props;
  const real = srv && srv.features && srv.features.calls && st.settings.clinicPhone && !props.practice;
  return real ? html`<${RealCall} ...${props} />` : html`<${SimCall} ...${props} />`;
}

/* Saves the booked visit and asks the ride circle. Shared by the practice call and the real call. */
function saveBooking(update, draft, startIso, extra) {
  const id = uid('cb');
  update((n) => {
    const a = {
      id, source: 'carebridge', status: 'booked', start: startIso,
      doctor: draft.doctor, place: draft.place, specialty: draft.specialty, reason: draft.reason, reasonEn: draft.reasonEn,
      ride: { status: 'idle', driverId: null, askedId: null, declinedIds: [] }, delayMin: 0, followUp: null
    };
    Object.assign(a, extra || {});
    n.appts.push(a); n.appts.sort((x, y) => new Date(x.start) - new Date(y.start));
    if (n.people.length) askNext(n, a);
  });
  return id;
}

function BookedCard({ st, appt, go }) {
  const L = st.profile.lang;
  const r = rideLine(st, appt);
  return html`<div className="card-grad stack">
      <div className="row"><span className="check"><${Icon} name="check" size=${15} sw=${3.2} /></span><b className="h2" style=${{ color: '#fff' }}>${t(L, 'booked')}</b></div>
      <div>${fmtLongDay(appt.start, L)} · ${fmtTime(appt.start, L)}</div>
      <div className="muted">${appt.doctor}${appt.place ? ' · ' + appt.place : ''}</div>
      ${r ? html`<div className="row" style=${{ borderTop: '1px solid rgba(255,255,255,.25)', paddingTop: 10 }}><${Icon} name="car" /><b>${r.text}</b></div>` : null}
    </div>
    <div className="stack" style=${{ marginTop: 'auto' }}>
      ${r && r.kind === 'wait' && r.asked && !r.asked.phone ? html`<button className="btn btn-soft btn-block" onClick=${() => go({ name: 'family', id: r.asked.id })}>Demo: open ${r.asked.name}'s phone</button>` : null}
      ${r && r.kind === 'wait' && r.asked && r.asked.phone ? html`<p className="small muted center">Text sent to ${r.asked.name}. Waiting for YES or NO.</p>` : null}
      <button className="btn btn-primary btn-block" onClick=${() => go({ name: 'home' })}>${t(L, 'goHome')}</button>
    </div>`;
}

/* A real phone call through the server: Twilio dials, Claude talks, the transcript shows live. */
function RealCall({ st, update, go, draft, notify }) {
  const L = st.profile.lang;
  const [callId, setCallId] = useState(null);
  const [info, setInfo] = useState({ status: 'dialing', lines: [] });
  const [err, setErr] = useState('');
  const [bookedId, setBookedId] = useState(null);
  const pt = st.patient || {};
  useEffect(() => {
    let stop = false;
    api('call/start', { to: st.settings.clinicPhone, patientName: pt.fullName || st.profile.name, dob: pt.birthDate || '', mrn: pt.mrn || '', doctor: draft.doctor, clinic: draft.clinic, reasonEn: draft.reasonEn, timePref: draft.timePref, interpreter: L !== 'en' ? langInfo(L).english : '' })
      .then((j) => { if (!stop) setCallId(j.id); }).catch((e) => setErr(e.message));
    return () => { stop = true; };
  }, []);
  useEffect(() => {
    if (!callId || bookedId) return;
    let alive = true;
    const tick = async () => {
      try {
        const j = await api('call/status?id=' + encodeURIComponent(callId));
        if (!alive) return;
        setInfo(j);
        if (j.status === 'ended') {
          if (j.outcome === 'booked' && j.date) {
            const iso = new Date(j.date + 'T' + (j.time || '10:00') + ':00').toISOString();
            const id = saveBooking(update, draft, iso, { bookedBy: 'call' });
            setBookedId(id);
            notify(t(L, 'booked'), fmtDay(iso, L) + ' · ' + fmtTime(iso, L) + ' · ' + draft.doctor, { channel: 'Push' });
          }
          return;
        }
      } catch (e) { /* keep trying */ }
      if (alive) setTimeout(tick, 1500);
    };
    tick();
    return () => { alive = false; };
  }, [callId, bookedId]);
  const appt = bookedId && st.appts.find((a) => a.id === bookedId);
  const statusWord = { dialing: 'Calling…', ringing: 'Ringing…', 'in-progress': 'On call', ended: 'Call ended' }[info.status] || 'On call';
  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="top"><span className="row small" style=${{ fontWeight: 650, color: 'var(--accent)', gap: 8 }}><span className="live-dot"></span>${statusWord}</span><span className="badge-demo">Live call · ${st.settings.clinicPhone}</span></div>
    <div className="stack"><h1 className="h1">${t(L, 'callTitle')}</h1><p className="sub">${t(L, 'callSub')}</p></div>
    ${err ? html`<div className="bubble alert" style=${{ maxWidth: '100%' }}>${err}</div><button className="btn btn-secondary btn-block" onClick=${() => go({ name: 'call', draft, practice: true })}>Use the practice call instead</button>` : null}
    <div className="transcript" aria-live="polite">
      ${info.lines.map((l, i) => html`<div key=${i} className=${'line' + (l.who === 'ai' ? ' ai' : '')}><span className="who">${l.who === 'ai' ? 'CareBridge (AI)' : (draft.clinic || 'Clinic')}</span><span>${l.text}</span></div>`)}
      ${info.status !== 'ended' && !err ? html`<div className="typing"><i></i><i></i><i></i></div>` : null}
    </div>
    ${info.status === 'ended' && !appt ? html`<div className="card stack"><b>${info.outcome === 'callback' ? 'The clinic needs a call back.' : 'The call ended without a booking.'}</b><span className="small muted">${info.outcome}</span>
      <div className="tiles"><button className="btn btn-primary btn-sm" onClick=${() => go({ name: 'call', draft, n: Date.now() })}>Try again</button><button className="btn btn-secondary btn-sm" onClick=${() => go({ name: 'home' })}>${t(L, 'goHome')}</button></div></div>` : null}
    ${appt ? html`<${BookedCard} st=${st} appt=${appt} go=${go} />` : null}
  </div>`;
}

function SimCall({ st, update, go, draft, notify }) {
  const L = st.profile.lang;
  const slot = useMemo(() => nextSlot(st, draft.timePref), []);
  const [shown, setShown] = useState(0);
  const [bookedId, setBookedId] = useState(null);
  const pt = st.patient || {};
  const fullName = pt.fullName || st.profile.name || 'the patient';
  const first = (st.profile.name || fullName).trim();
  const slotLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(slot)) + ' at ' + new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(slot));
  const pref = draft.timePref === 'morning' ? 'Mornings work best.' : draft.timePref === 'afternoon' ? 'Afternoons work best.' : 'Any time works.';
  const interp = L !== 'en' ? ' ' + first + ' will need a ' + langInfo(L).english + ' interpreter, please.' : '';
  const lines = [
    { who: draft.clinic || 'Clinic', ai: false, text: (draft.clinic || 'Clinic') + ', how can I help you?' },
    { who: 'CareBridge (AI)', ai: true, text: "Hi, I'm an AI assistant calling for " + fullName + (pt.birthDate ? ', date of birth ' + pt.birthDate : '') + (pt.mrn ? ', medical record number ' + pt.mrn : '') + '. ' + first + ' would like ' + draft.reasonEn + ' with ' + draft.doctor + '. ' + pref },
    { who: draft.clinic || 'Clinic', ai: false, text: 'Let me check. How about ' + slotLong + '?' },
    { who: 'CareBridge (AI)', ai: true, text: 'That works. Please book it.' + interp },
    { who: draft.clinic || 'Clinic', ai: false, text: "You're all set for " + slotLong + '.' + (interp ? ' Interpreter noted.' : '') + ' See you then.' }
  ];
  useEffect(() => {
    if (shown < lines.length) { const id = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 700 : 1500); return () => clearTimeout(id); }
    if (!bookedId) {
      const id = saveBooking(update, draft, slot);
      setBookedId(id);
      notify(t(L, 'booked'), fmtDay(slot, L) + ' · ' + fmtTime(slot, L) + ' · ' + draft.doctor, { channel: 'Push' });
    }
  }, [shown]);
  const appt = bookedId && st.appts.find((a) => a.id === bookedId);
  return html`<div className="stack-lg" style=${{ flex: 1 }}>
    <div className="top"><span className="row small" style=${{ fontWeight: 650, color: 'var(--accent)', gap: 8 }}><span className="live-dot"></span>${bookedId ? 'Call ended' : 'On call'}</span><span className="badge-demo">Demo · simulated call</span></div>
    <div className="stack"><h1 className="h1">${t(L, 'callTitle')}</h1><p className="sub">${t(L, 'callSub')}</p></div>
    <div className="transcript" aria-live="polite">
      ${lines.slice(0, shown).map((l, i) => html`<div key=${i} className=${'line' + (l.ai ? ' ai' : '')}><span className="who">${l.who}</span><span>${l.text}</span></div>`)}
      ${shown < lines.length ? html`<div className="typing"><i></i><i></i><i></i></div>` : null}
    </div>
    ${appt ? html`<${BookedCard} st=${st} appt=${appt} go=${go} />` : null}
  </div>`;
}

/* =====================================================================
   VISIT (details, day of, delay, actions)
   ===================================================================== */
function Visit({ st, update, go, id, notify, saveFile }) {
  const L = st.profile.lang;
  const a = st.appts.find((x) => x.id === id);
  const [skipAsk, setSkipAsk] = useState(false);
  const [doneSent, setDoneSent] = useState(!!(a && a.doneAt));
  if (!a) return html`<div><${TopBar} onBack=${() => go({ name: 'home' })} /><p>Not found.</p></div>`;
  const r = rideLine(st, a);
  const rb = a.rideBack ? rideLine(st, a, 'back') : null;
  const rs = [r, rb].filter(Boolean);
  const today = sameDay(a.start, Date.now()) || st.demoToday === a.id;
  const driver = r && r.driver;
  const backDriver = rb && rb.driver;
  const summary = [fmtLongDay(a.start, L) + ', ' + fmtTime(visitTime(a), L) + '.', (a.seriesId ? a.reason : a.doctor) + (a.place ? ', ' + a.place : '') + '.', ...rs.map((x) => x.text + '.' + (x.sub ? ' ' + x.sub + '.' : '')), a.delayMin ? t(L, 'lateTitle', { n: a.delayMin }) + '.' : ''].join(' ');
  // Title and subtitle: "Physiotherapy / Every Thursday" for a weekly visit, the doctor for a normal one.
  let title = today ? t(L, 'today') + ' · ' + a.doctor : t(L, 'visitTitle');
  let subtitle = today ? '' : a.doctor + ' · ' + t(L, 'sp_' + (a.specialty || 'family'));
  if (a.seriesId) {
    title = (today ? t(L, 'today') + ' · ' : '') + a.reason;
    subtitle = t(L, 'everyDay', { day: fmtWeekdayLong(new Date(a.start).getDay(), L) });
  }
  const imDone = () => {
    setDoneSent(true);
    update((n) => { const x = n.appts.find((y) => y.id === a.id); if (x) x.doneAt = Date.now(); n.messages.unshift({ id: uid('m'), to: backDriver.id, from: 'senior', text: doneText(st, a), at: Date.now(), apptId: a.id }); });
    sendText(backDriver, doneText(st, a));
    notify(t(L, 'doneTitle', { name: backDriver.name }), t(L, 'doneBody', { name: backDriver.name }), { channel: 'Text to ' + backDriver.name });
  };
  const skip = () => {
    let told = [];
    update((n) => { told = skipWeek(n, a.id); ensureSeries(n); });
    setTimeout(() => { told.forEach((p) => sendText(p, skipText(st, a))); notify(t(L, 'skipWeek'), t(L, 'skippedMsg'), { channel: 'Push' }); }, 50);
    go({ name: 'home' });
  };
  const smsBody = driver ? 'CareBridge: ' + st.profile.name + ' — ' + a.doctor + ', ' + fmtDay(a.start, 'en') + ' ' + fmtTime(visitTime(a), 'en') + '. Pickup ' + fmtTime(pickupTime(a), 'en') + (a.place ? ' · ' + a.place : '') : '';
  return html`<div className="stack-lg">
    <${TopBar} onBack=${() => go({ name: 'home' })} />
    <div className="stack">
      <span className="eyebrow" style=${{ color: 'var(--accent)' }}>${fmtLongDay(a.start, L)}</span>
      <h1 className="h1">${title}</h1>
      ${subtitle ? html`<p className="sub">${subtitle}</p>` : null}
    </div>
    ${a.delayMin ? html`<div className="card-grad row" style=${{ alignItems: 'flex-start' }}>
      <span className="check" style=${{ width: 40, height: 40, borderRadius: 20 }}><${Icon} name="clock" /></span>
      <div className="stack" style=${{ gap: 4 }}><b className="h2" style=${{ color: '#fff', fontSize: '1.15rem' }}>${t(L, 'lateTitle', { n: a.delayMin })}</b>${driver ? html`<span>${t(L, 'lateBody', { name: driver.name, time: fmtTime(pickupTime(a), L) })}</span>` : null}</div>
    </div>` : null}
    <div className="card stack">
      <div className="tl">
        ${driver ? html`<div className="tl-item"><div className="tl-rail"><span className="tl-dot"></span><span className="tl-line"></span></div><div className="tl-body"><b>${fmtTime(pickupTime(a), L)} · ${r.text}</b></div></div>` : null}
        <div className="tl-item"><div className="tl-rail"><span className="tl-dot open"></span>${backDriver ? html`<span className="tl-line"></span>` : null}</div><div className="tl-body" style=${{ paddingBottom: backDriver ? undefined : 0 }}><b>${fmtTime(visitTime(a), L)}${a.seriesId ? '–' + fmtTime(endTime(a), L) + ' · ' + a.reason : ' · ' + a.doctor}</b><div className="muted small row" style=${{ gap: 6 }}><${Icon} name="pin" size=${15} />${a.place || '—'}</div>${L !== 'en' && !a.seriesId ? html`<div className="muted small">${langInfo(L).english} interpreter</div>` : null}</div></div>
        ${backDriver ? html`<div className="tl-item"><div className="tl-rail"><span className="tl-dot"></span></div><div className="tl-body" style=${{ paddingBottom: 0 }}><b>${fmtTime(endTime(a), L)} · ${rb.text}</b></div></div>` : null}
      </div>
      ${rs.filter((x) => x.kind === 'wait').map((x) => html`<div key=${'w' + x.leg} className="row"><span className="status wait">${x.text}</span>${x.asked ? html`<button className="link-btn small" onClick=${() => go({ name: 'family', id: x.asked.id })}>Demo: ${x.asked.name}'s phone</button>` : null}</div>`)}
      ${rs.filter((x) => x.kind === 'later').map((x) => html`<div key=${'l' + x.leg} className="row small muted"><${Icon} name="clock" size=${16} />${x.text}</div>`)}
      ${rs.filter((x) => x.kind === 'none').map((x) => html`<div key=${'n' + x.leg} className="stack"><span className="status wait">${x.text}</span><${OtherRides} st=${st} update=${update} a=${a} leg=${x.leg} /></div>`)}
      ${!r && st.people.length ? html`<button className="btn btn-soft btn-sm" onClick=${() => update((n) => restartAsking(n, a.id))}>${t(L, 'askAgain')}</button>` : null}
    </div>
    ${a.seriesId && a.phone ? html`<div className="card"><span className="muted small">${t(L, 'clinicPhone')}: <span style=${{ userSelect: 'all' }}>${a.phone}</span></span></div>` : null}
    ${a.seriesId ? null : html`<div className="card stack">
      <span className="eyebrow">${t(L, 'questions')}</span>
      <span>1. ${a.reason}</span><span>2. ${t(L, 'q1')}</span><span>3. ${t(L, 'q2')}</span>
      ${a.prep && a.prep.length ? html`<div className="divider"></div><span className="eyebrow">${t(L, 'prep')}</span>${a.prep.map((x, i) => html`<span key=${i} className="row small" style=${{ gap: 8 }}><${Icon} name="check" size=${16} />${x}</span>`)}` : null}
      ${a.phone ? html`<span className="muted small">${t(L, 'clinicPhone')}: <span style=${{ userSelect: 'all' }}>${a.phone}</span></span>` : null}
      <span className="muted small">${t(L, 'bring')}</span>
      ${st.patient && st.patient.meds && st.patient.meds.length ? html`<div className="chips">${st.patient.meds.map((m) => html`<span key=${m} className="tag">${m}</span>`)}</div>` : null}
    </div>`}
    ${a.seriesId && backDriver ? html`<button className="btn btn-primary btn-block" style=${{ minHeight: 72, fontSize: '1.15rem' }} disabled=${doneSent} onClick=${imDone}><${Icon} name="car" size=${26} />${doneSent ? t(L, 'doneTitle', { name: backDriver.name }) : t(L, 'imDone')}</button>` : null}
    <div className="stack">
      <button className=${'btn btn-block ' + (a.seriesId && backDriver ? 'btn-secondary' : 'btn-primary')} onClick=${() => speak(summary, L) || notify(t(L, 'readToMe'), summary, { preview: true })}><${Icon} name="speaker" />${t(L, 'readToMe')}</button>
      <button className="btn btn-secondary btn-block" onClick=${() => saveFile('carebridge-visit.ics', icsFor(st, a), 'text/calendar')}><${Icon} name="cal" />${t(L, 'addCal')}</button>
      ${driver ? html`<${TextDriver} st=${st} driver=${driver} body=${smsBody} />` : null}
      <button className="btn btn-soft btn-block" onClick=${() => go({ name: 'after', id: a.id })}><${Icon} name="check" />${t(L, 'visitDone')}</button>
      ${a.seriesId ? (!skipAsk ? html`<button className="btn btn-secondary btn-block" onClick=${() => setSkipAsk(true)}><${Icon} name="x" />${t(L, 'skipWeek')}</button>`
        : html`<div className="card stack"><b>${t(L, 'skipConfirm', { day: fmtDay(a.start, L) })}</b><div className="tiles"><button className="btn btn-primary" onClick=${skip}>${t(L, 'yes')}</button><button className="btn btn-secondary" onClick=${() => setSkipAsk(false)}>${t(L, 'cancel')}</button></div></div>`) : null}
      ${a.seriesId ? html`<button className="link-btn small" style=${{ alignSelf: 'center' }} onClick=${() => go({ name: 'weekly', id: a.seriesId })}>${t(L, 'weekly')} →</button>` : null}
    </div>
  </div>`;
}

function TextDriver({ st, driver, body }) {
  const L = st.profile.lang;
  const [open, setOpen] = useState(false);
  const href = 'sms:' + (driver.phone || '') + '?&body=' + encodeURIComponent(body);
  return html`<div className="stack">
    <button className="btn btn-secondary btn-block" onClick=${() => setOpen(!open)} aria-expanded=${open}><${Icon} name="msg" />${t(L, 'textDriver', { name: driver.name })}</button>
    ${open ? html`<div className="card stack small">
      <div style=${{ whiteSpace: 'pre-wrap' }}>${body}</div>
      <div className="row"><a className="btn btn-primary btn-sm" href=${href}>Open Messages</a>
        <button className="btn btn-secondary btn-sm" onClick=${() => { try { navigator.clipboard.writeText(body); } catch (e) { } }}>Copy</button></div>
      ${!driver.phone ? html`<span className="muted">Add ${driver.name}'s phone number in Settings to fill it in.</span>` : null}
    </div>` : null}
  </div>`;
}

function OtherRides({ st, update, a, leg }) {
  const L = st.profile.lang;
  return html`<div className="stack">
    <span className="eyebrow">${t(L, 'otherRides')}</span>
    ${['paratransit', 'rideshare', 'volunteer'].map((k) => html`<div key=${k} className="row card" style=${{ padding: 14 }}><${Icon} name="car" /><span className="grow">${t(L, k)}</span></div>`)}
    ${a ? html`<button className="btn btn-soft btn-sm" onClick=${() => update((n) => restartAsking(n, a.id, leg || 'to'))}>${t(L, 'askAgain')}</button>` : null}
  </div>`;
}

/* =====================================================================
   AFTER THE VISIT
   ===================================================================== */
function After({ st, update, go, id, notify }) {
  const L = st.profile.lang;
  const a = st.appts.find((x) => x.id === id);
  const [fu, setFu] = useState(a && a.followUp ? a.followUp.choice : null);
  const [sent, setSent] = useState(false);
  useEffect(() => { if (a && a.status !== 'done') update((n) => { const x = n.appts.find((y) => y.id === id); if (x) { x.status = 'done'; if (n.demoToday === id) n.demoToday = null; } }); }, []);
  if (!a) return null;
  // Weekly visits can have two drivers (there and home); both get the thank-you.
  const drivers = Array.from(new Set(legsOf(a).map((l) => a[legKey(l)] && a[legKey(l)].driverId).filter(Boolean))).map((pid) => st.people.find((p) => p.id === pid)).filter(Boolean);
  const driver = drivers.length ? { id: drivers[0].id, name: drivers.map((d) => d.name).join(' & ') } : null;
  const choose = (c) => { setFu(c); update((n) => { const x = n.appts.find((y) => y.id === id); if (x) x.followUp = { choice: c, months: c === 'in3' ? 3 : null }; }); };
  const thank = () => {
    setSent(true);
    update((n) => { drivers.forEach((d) => n.messages.unshift({ id: uid('m'), to: d.id, from: 'senior', text: t(L, 'thankMsg'), at: Date.now(), apptId: id })); });
    notify(t(L, 'thankSent', { name: driver.name }), '“' + t(L, 'thankMsg') + '”');
    drivers.forEach((d) => sendText(d, 'CareBridge: ' + (st.profile.name || 'Your family member') + ' says: "' + t(L, 'thankMsg') + '"' + (L !== 'en' ? ' (' + STRINGS.en.thankMsg + ')' : '')));
  };
  return html`<div className="stack-lg">
    <${TopBar} onBack=${() => go({ name: 'home' })} />
    <h1 className="h1">${t(L, 'afterTitle')}</h1>
    ${a.seriesId ? null : html`<div className="stack">
      <span className="h2" style=${{ fontSize: '1.2rem' }}>${t(L, 'seeAgain')}</span>
      <button className="list-choice" aria-pressed=${fu === 'in3'} onClick=${() => choose('in3')}><span className="grow"><b>${t(L, 'in3')}</b></span><span className="radio">${fu === 'in3' ? html`<${Icon} name="check" size=${15} sw=${3} />` : null}</span></button>
      <div className="tiles">
        <button className="list-choice" aria-pressed=${fu === 'other'} onClick=${() => choose('other')}><b>${t(L, 'other')}</b></button>
        <button className="list-choice" aria-pressed=${fu === 'no'} onClick=${() => choose('no')}><b>${t(L, 'noNeed')}</b></button>
      </div>
      ${fu && fu !== 'no' ? html`<p className="sub">${t(L, 'remindBook')}</p>` : null}
    </div>`}
    ${driver ? html`<div className="divider"></div>
    <div className="stack center" style=${{ alignItems: 'center' }}>
      <span className="h2" style=${{ fontSize: '1.25rem' }}>${t(L, 'thankTitle', { name: driver.name })}</span>
      <div className="row" style=${{ justifyContent: 'center' }}>${drivers.map((d) => html`<${Avatar} key=${d.id} name=${d.name} on=${true} size=${72} />`)}</div>
      <button className="btn btn-primary" onClick=${thank} disabled=${sent}>${sent ? t(L, 'thankSent', { name: driver.name }) : '“' + t(L, 'thankMsg') + '”'}</button>
      <${VoiceThanks} st=${st} update=${update} notify=${notify} drivers=${drivers} apptId=${id} />
    </div>` : null}
    <p className="small muted center row" style=${{ justifyContent: 'center' }}><${Icon} name="people" size=${16} />${t(L, 'familyUpdate')}</p>
    <button className="btn btn-secondary btn-block" onClick=${() => go({ name: 'home' })}>${t(L, 'done')}</button>
  </div>`;
}

/* A thank-you in the senior's own voice: record up to 15 seconds, listen, send.
   The driver gets a text with a link to play it (and it shows on the family screen). */
function VoiceThanks({ st, update, notify, drivers, apptId }) {
  const L = st.profile.lang;
  const [stage, setStage] = useState('idle'); // idle → recording → ready → sending → sent
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null);     // the recording: { blob, url }
  const [problem, setProblem] = useState('');
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const names = drivers.map((d) => d.name).join(' & ');

  // If the person leaves this screen while recording, stop the microphone.
  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state === 'recording') recorderRef.current.stop();
  }, []);

  if (!window.MediaRecorder || !navigator.mediaDevices) return null; // this browser can't record

  async function startRecording() {
    setProblem('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setProblem(t(L, 'recNoMic'));
      return;
    }
    const recorder = new MediaRecorder(stream, { audioBitsPerSecond: 32000 });
    const pieces = [];
    recorder.ondataavailable = (e) => { if (e.data.size) pieces.push(e.data); };
    recorder.onstop = () => {
      clearInterval(timerRef.current);
      stream.getTracks().forEach((track) => track.stop()); // turns off the microphone light
      const blob = new Blob(pieces, { type: recorder.mimeType || 'audio/webm' });
      setClip({ blob, url: URL.createObjectURL(blob) });
      setStage('ready');
    };
    recorder.start();
    recorderRef.current = recorder;
    setSeconds(0);
    setStage('recording');
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed++;
      setSeconds(elapsed);
      if (elapsed >= 15) recorder.stop(); // keep it short
    }, 1000);
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state === 'recording') recorderRef.current.stop();
  }

  async function sendIt() {
    setStage('sending');
    const dataUrl = await fileToDataUrl(clip.blob);
    // With the server, save the recording and text each driver a link to it.
    let link = '';
    const srv = await getServer();
    if (srv && srv.features.kv) {
      try {
        const j = await api('voice', { audio: dataUrl.split(',')[1], type: clip.blob.type });
        link = j.url;
      } catch (e) {
        console.warn(e);
      }
    }
    update((n) => {
      for (const d of drivers) {
        n.messages.unshift({
          id: uid('m'), to: d.id, from: 'senior', apptId, at: Date.now(), text: t(L, 'voiceMsg'),
          audio: dataUrl.length < 400000 ? dataUrl : '', // kept on this phone for the family screen
          audioUrl: link
        });
      }
    });
    if (link) drivers.forEach((d) => sendText(d, voiceText(st, link)));
    notify(t(L, 'recSent', { name: names }), '', { channel: 'Push' });
    setStage('sent');
  }

  return html`<div className="card stack" style=${{ width: '100%', alignItems: 'center' }}>
    ${stage === 'idle' ? html`<button className="btn btn-secondary btn-block" onClick=${startRecording}><${Icon} name="mic" />${t(L, 'recThanks')}</button>` : null}
    ${stage === 'recording' ? html`
      <div className="row" style=${{ gap: 10 }}><span className="rec-dot" aria-hidden="true"></span><b aria-live="polite">${t(L, 'recording', { s: seconds })}</b></div>
      <button className="btn btn-primary btn-block" onClick=${stopRecording}><${Icon} name="x" />${t(L, 'recStop')}</button>` : null}
    ${stage === 'ready' || stage === 'sending' ? html`
      <audio controls src=${clip.url} style=${{ width: '100%' }}></audio>
      <button className="btn btn-primary btn-block" disabled=${stage === 'sending'} onClick=${sendIt}><${Icon} name="send" />${t(L, 'recSend', { name: names })}</button>
      <button className="btn btn-soft btn-sm" disabled=${stage === 'sending'} onClick=${startRecording}>${t(L, 'recAgain')}</button>` : null}
    ${stage === 'sent' ? html`<div className="row"><${Icon} name="check" /><b>${t(L, 'recSent', { name: names })}</b></div>` : null}
    ${problem ? html`<p className="small muted center">${problem}</p>` : null}
  </div>`;
}

/* =====================================================================
   ADD A VISIT FROM A LETTER, TEXT OR PHOTO
   ===================================================================== */
function Letter({ st, update, go, notify }) {
  const L = st.profile.lang;
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('input'); // input | reading | review
  const [res, setRes] = useState(null);
  const [f, setF] = useState(null);
  const [note, setNote] = useState('');
  const [weeklyOn, setWeeklyOn] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setF(Object.assign({}, f, { [k]: v, unsure: (f.unsure || []).filter((x) => x !== k) }));
  const run = async (input) => {
    setPhase('reading'); setNote('');
    const r = await readLetter(st, input);
    setRes(r);
    const fields = Object.assign({ doctor: '', clinic: '', address: '', reason: '', date: '', time: '', phone: '', prep: [], interpreter: '', unsure: [] }, r.fields);
    for (const k of LETTER_FIELDS) if (fields[k] == null) fields[k] = '';
    setF(fields);
    if (r.via === 'none') setNote(t(L, 'photoNeedsAI'));
    else if (!fields.isAppointment) setNote(t(L, 'notAppt'));
    else if (!fields.date || !fields.time) setNote(t(L, 'missingWhen'));
    setPhase('review');
  };
  const onPhoto = async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    const small = await shrinkImage(file);
    run({ image: small, text: '' });
  };
  const ok = f && f.date && f.time && (f.doctor || f.clinic);
  const save = () => {
    const hhmm = f.time.length === 4 ? '0' + f.time : f.time;
    const iso = new Date(f.date + 'T' + hhmm + ':00').toISOString();
    if (weeklyOn) {
      // A standing appointment (physio, dialysis): no single visit, a weekly series with rides there and back.
      const sid = uid('wk');
      update((n) => { addSeries(n, { id: sid, what: f.reason && f.reason !== '—' ? f.reason : (f.clinic || f.doctor), place: [f.clinic, f.address].filter(Boolean).join(', '), doctor: f.doctor || '', phone: f.phone || '', weekday: new Date(iso).getDay(), time: hhmm, durationMin: 60 }); });
      notify(t(L, 'weeklySaved'), t(L, 'everyDay', { day: fmtWeekdayLong(new Date(iso).getDay(), L) }) + ' · ' + fmtTime(iso, L), { channel: 'Push' });
      go({ name: 'weekly', id: sid });
      return;
    }
    const id = uid('cb');
    update((n) => {
      const a = {
        id, source: 'letter', status: 'booked', start: iso,
        doctor: f.doctor || f.clinic,
        place: [f.clinic, f.address].filter(Boolean).join(', '),
        specialty: guessSpecialty((f.reason || '') + ' ' + (f.clinic || '') + ' ' + (f.doctor || '')),
        reason: f.reason || '—', phone: f.phone || '', prep: (f.prep || []).filter(Boolean), interpreter: f.interpreter || '',
        ride: { status: 'idle', driverId: null, askedId: null, declinedIds: [] }, delayMin: 0, followUp: null
      };
      n.appts.push(a); n.appts.sort((x, y) => new Date(x.start) - new Date(y.start));
      if (n.people.length) askNext(n, a);
    });
    notify(t(L, 'booked'), fmtDay(iso, L) + ' · ' + fmtTime(iso, L) + ' · ' + (f.doctor || f.clinic), { channel: 'Push' });
    go({ name: 'visit', id });
  };
  const Field = (k, label, type) => html`<div className="field">
    <label htmlFor=${'lt-' + k} className="row" style=${{ justifyContent: 'space-between' }}><span>${label}</span>${(f.unsure || []).includes(k) || (!f[k] && (k === 'date' || k === 'time')) ? html`<span className="status wait">${t(L, 'checkThis')}</span>` : null}</label>
    <input id=${'lt-' + k} className="input" type=${type || 'text'} value=${f[k] || ''} onInput=${(e) => set(k, e.target.value)} style=${(f.unsure || []).includes(k) ? { borderColor: 'var(--accent)', borderWidth: 2 } : null} />
  </div>`;

  if (phase === 'reading') return html`<div className="stack-lg center" style=${{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div><h2 className="h2">${t(L, 'reading')}</h2></div>`;

  if (phase === 'review' && f) return html`<div className="stack-lg">
    <${TopBar} onBack=${() => setPhase('input')} title=${t(L, 'checkTitle')} />
    ${note ? html`<div className="bubble alert" style=${{ maxWidth: '100%' }}>${note}</div>` : null}
    ${res && res.via === 'ai' ? html`<span className="badge-demo" style=${{ alignSelf: 'flex-start' }}>Read by AI · ${t(L, 'checkThis')}</span>` : null}
    <div className="confirm">
      ${Field('doctor', t(L, 'doctor'))}
      ${Field('clinic', 'Clinic')}
      <div className="tiles">${Field('date', t(L, 'date'), 'date')}${Field('time', t(L, 'time'), 'time')}</div>
      ${Field('address', t(L, 'address'))}
      ${Field('reason', t(L, 'reason'))}
      ${Field('phone', t(L, 'clinicPhone'), 'tel')}
      ${f.prep && f.prep.length ? html`<div className="stack"><span className="eyebrow">${t(L, 'prep')}</span>${f.prep.map((x, i) => html`<div key=${i} className="row small"><${Icon} name="check" size=${16} /><span className="grow">${x}</span><button className="icon-btn" style=${{ width: 36, height: 36 }} aria-label=${t(L, 'remove')} onClick=${() => setF(Object.assign({}, f, { prep: f.prep.filter((_, j) => j !== i) }))}><${Icon} name="x" size=${16} /></button></div>`)}</div>` : null}
      ${f.interpreter ? html`<span className="small muted">Interpreter: ${f.interpreter}</span>` : null}
      <div className="setting"><span>${t(L, 'everyWeek')}</span><button className="switch" role="switch" aria-checked=${weeklyOn} aria-label=${t(L, 'everyWeek')} onClick=${() => setWeeklyOn(!weeklyOn)}></button></div>
      <b style=${{ fontSize: '1.1rem' }}>${t(L, 'isRight')}</b>
      <button className="btn btn-primary btn-block" disabled=${!ok} onClick=${save}>${t(L, 'saveVisit')}</button>
      <button className="btn btn-secondary btn-block" onClick=${() => setPhase('input')}>${t(L, 'changeIt')}</button>
    </div>
  </div>`;

  return html`<div className="stack-lg">
    <${TopBar} onBack=${() => go({ name: 'home' })} />
    <div className="stack"><h1 className="h1">${t(L, 'letterTitle')}</h1><p className="sub">${t(L, 'letterSub')}</p></div>
    <input ref=${fileRef} type="file" accept="image/*" capture="environment" onChange=${onPhoto} style=${{ display: 'none' }} aria-hidden="true" tabIndex="-1" />
    <button className="btn btn-primary btn-block" style=${{ minHeight: 76, fontSize: '1.1rem' }} onClick=${() => fileRef.current && fileRef.current.click()}><${Icon} name="camera" size=${26} />${t(L, 'takePhoto')}</button>
    <p className="small muted row" style=${{ gap: 8, alignItems: 'flex-start' }}><${Icon} name="lock" size=${16} />${t(L, 'photoNote')}</p>
    <div className="divider"></div>
    <div className="field"><label htmlFor="lt-paste">${t(L, 'orPaste')}</label>
      <textarea id="lt-paste" className="input" placeholder=${t(L, 'letterPh')} value=${text} onInput=${(e) => setText(e.target.value)}></textarea></div>
    <button className="btn btn-soft btn-block" disabled=${!text.trim()} onClick=${() => run({ text })}>${t(L, 'readLetter')}</button>
  </div>`;
}

/* =====================================================================
   RIDES, REMINDERS
   ===================================================================== */
function Rides({ st, update, go }) {
  const L = st.profile.lang;
  const up = st.appts.filter(isUpcoming);
  const weekly = (st.series || []).filter((w) => w.active);
  return html`<div className="stack-lg">
    <${TopBar} onBack=${() => go({ name: 'home' })} title=${t(L, 'rides')} />
    <div className="card stack">
      <span className="eyebrow">${t(L, 'setCircle')}</span>
      <div className="avatars">${st.people.map((p) => html`<div key=${p.id} className="av"><${Avatar} name=${p.name} on=${true} /><span>${p.name}</span><span className="muted small">${ridesGiven(st, p.id)}</span></div>`)}</div>
      ${!st.people.length ? html`<button className="btn btn-soft" onClick=${() => go({ name: 'settings' })}>${t(L, 'addPerson')}</button>` : null}
    </div>
    <div className="card stack">
      <span className="eyebrow">${t(L, 'weekly')}</span>
      ${weekly.map((w) => { const to = st.people.find((p) => p.id === w.standing.to), back = st.people.find((p) => p.id === w.standing.back); return html`<button key=${w.id} className="visit-row" onClick=${() => go({ name: 'weekly', id: w.id })}>
        <span className="icon-btn" style=${{ background: 'var(--tint)', color: 'var(--accent)', flex: 'none' }}><${Icon} name="cal" /></span>
        <div className="grow"><b style=${{ display: 'block' }}>${w.what} · ${t(L, 'everyDay', { day: fmtWeekdayLong(w.weekday, L) })} ${fmtTime(seriesTimeIso(w), L)}</b>
          <span className="muted small" style=${{ display: 'block' }}>${t(L, 'rideThere')}: ${to ? to.name : t(L, 'askEach')}</span>
          <span className="muted small" style=${{ display: 'block' }}>${t(L, 'rideHome')}: ${back ? back.name : t(L, 'askEach')}</span></div><${Icon} name="chev" />
      </button>`; })}
      <button className="btn btn-soft btn-sm" onClick=${() => go({ name: 'weekly' })}><${Icon} name="plus" size=${18} />${t(L, 'addWeekly')}</button>
    </div>
    <div className="card stack" style=${{ gap: 0 }}>
      <span className="eyebrow" style=${{ marginBottom: 4 }}>${t(L, 'upcoming')}</span>
      ${up.length ? up.map((a) => { const rs = rideLines(st, a); return html`<button key=${a.id} className="visit-row" onClick=${() => go({ name: 'visit', id: a.id })}>
        <${DateTile} iso=${a.start} lang=${L} /><div className="grow"><b style=${{ display: 'block' }}>${a.seriesId ? a.reason : a.doctor}</b>${rs.length ? rs.map((r) => html`<span key=${r.leg} className="muted small" style=${{ display: 'block' }}>${r.text}</span>`) : html`<span className="muted small">—</span>`}</div><${Icon} name="chev" />
      </button>`; }) : html`<p className="sub">${t(L, 'noUpcoming')}</p>`}
    </div>
    <${OtherRides} st=${st} update=${update} />
  </div>`;
}

/* Add or change a weekly visit: told once, rides there and back every week. */
function Weekly({ st, update, go, id, prefill, notify }) {
  const L = st.profile.lang;
  const existing = id ? (st.series || []).find((w) => w.id === id) : null;
  const [f, setF] = useState(() => existing ? clone(existing) : Object.assign({ what: '', place: '', doctor: '', weekday: 4, time: '14:00', durationMin: 60, standing: { to: null, back: null } }, prefill || {}, { standing: { to: null, back: null } }));
  const [confirmStop, setConfirmStop] = useState(false);
  const set = (k, v) => setF(Object.assign({}, f, { [k]: v }));
  const setLeg = (leg, v) => setF(Object.assign({}, f, { standing: Object.assign({}, f.standing, { [leg]: v }) }));
  const ok = f.what.trim() && /^\d{2}:\d{2}$/.test(f.time);
  const save = () => {
    if (existing) update((n) => editSeries(n, existing.id, f));
    else update((n) => { addSeries(n, f); });
    notify(t(L, 'weeklySaved'), f.what + ' · ' + t(L, 'everyDay', { day: fmtWeekdayLong(Number(f.weekday), L) }) + ' ' + fmtTime(seriesTimeIso(f), L), { channel: 'Push' });
    go({ name: 'rides' });
  };
  const LegPicker = (leg, label) => html`<div className="stack" role="radiogroup" aria-label=${label}>
    <span className="field-label" style=${{ fontWeight: 600 }}>${label}</span>
    <div className="chips">
      ${st.people.map((p) => html`<button key=${p.id} className="chip" role="radio" aria-checked=${f.standing[leg] === p.id} onClick=${() => setLeg(leg, p.id)}>${p.name}</button>`)}
      <button className="chip" role="radio" aria-checked=${!f.standing[leg]} onClick=${() => setLeg(leg, null)}>${t(L, 'askEach')}</button>
    </div>
  </div>`;
  return html`<div className="stack-lg">
    <${TopBar} onBack=${() => go({ name: existing ? 'rides' : 'home' })} title=${t(L, 'weekly')} />
    <div className="stack"><h1 className="h1">${existing ? existing.what : t(L, 'addWeekly')}</h1><p className="sub">${t(L, 'wkNoBook')}</p></div>
    <div className="field"><label htmlFor="wk-what">${t(L, 'wkWhat')}</label><input id="wk-what" className="input" placeholder=${t(L, 'wkWhatPh')} value=${f.what} onInput=${(e) => set('what', e.target.value)} /></div>
    <div className="field"><label htmlFor="wk-place">${t(L, 'wkWhere')}</label><input id="wk-place" className="input" placeholder=${t(L, 'wkWherePh')} value=${f.place} onInput=${(e) => set('place', e.target.value)} /></div>
    <div className="stack" role="radiogroup" aria-label=${t(L, 'wkDay')}>
      <span style=${{ fontWeight: 600 }}>${t(L, 'wkDay')}</span>
      <div className="chips">${[1, 2, 3, 4, 5, 6, 0].map((d) => html`<button key=${d} className="chip" role="radio" aria-checked=${Number(f.weekday) === d} onClick=${() => set('weekday', d)}>${fmtWeekdayShort(d, L)}</button>`)}</div>
    </div>
    <div className="stack">
      <div className="field"><label htmlFor="wk-time">${t(L, 'wkTime')}</label><input id="wk-time" className="input" type="time" value=${f.time} onInput=${(e) => set('time', e.target.value)} /></div>
      <div className="field"><label htmlFor="wk-len">${t(L, 'wkLen')}</label><select id="wk-len" className="input" value=${f.durationMin} onChange=${(e) => set('durationMin', Number(e.target.value))}>${[30, 45, 60, 90, 120, 240].map((m) => html`<option key=${m} value=${m}>${t(L, 'minN', { n: m })}</option>`)}</select></div>
    </div>
    ${st.people.length ? html`<div className="card stack-lg">
      ${LegPicker('to', t(L, 'whoThere'))}
      ${LegPicker('back', t(L, 'whoHome'))}
    </div>` : html`<button className="btn btn-soft" onClick=${() => go({ name: 'settings' })}>${t(L, 'addPerson')}</button>`}
    <button className="btn btn-primary btn-block" disabled=${!ok} onClick=${save}>${t(L, 'saveWeekly')}</button>
    ${existing ? (!confirmStop ? html`<button className="btn btn-secondary btn-block" style=${{ color: 'var(--danger)' }} onClick=${() => setConfirmStop(true)}>${t(L, 'stopWeekly')}</button>`
      : html`<div className="card stack"><b>${t(L, 'stopWeekly')}?</b><div className="tiles"><button className="btn btn-primary" onClick=${() => { update((n) => stopSeries(n, existing.id)); go({ name: 'rides' }); }}>${t(L, 'yes')}</button><button className="btn btn-secondary" onClick=${() => setConfirmStop(false)}>${t(L, 'cancel')}</button></div></div>`) : null}
  </div>`;
}

function Reminders({ st, go, notify, saveFile }) {
  const L = st.profile.lang;
  const rem = computeReminders(st);
  return html`<div className="stack-lg">
    <${TopBar} onBack=${() => go({ name: 'home' })} title=${t(L, 'remTitle')} />
    ${rem.length ? rem.map((r) => html`<div key=${r.id} className="card row" style=${{ alignItems: 'flex-start' }}>
      <span className="icon-btn" style=${{ background: 'var(--tint)', color: 'var(--accent)' }}><${Icon} name=${r.follow ? 'cal' : 'bell'} /></span>
      <div className="grow stack" style=${{ gap: 4 }}>
        ${r.date ? html`<span className="eyebrow">${r.date}</span>` : null}
        <b>${r.title}</b>${r.body ? html`<span className="muted small">${r.body}</span>` : null}
        <div className="row" style=${{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-secondary" onClick=${() => notify(r.title, r.body, { preview: true, channel: 'Push' })}>Preview</button>
          ${!r.follow ? html`<button className="btn btn-sm btn-soft" onClick=${() => { const a = st.appts.find((x) => x.id === r.apptId); saveFile('carebridge-visit.ics', icsFor(st, a), 'text/calendar'); }}><${Icon} name="cal" size=${16} />${t(L, 'addCal')}</button>` : null}
        </div>
      </div>
    </div>`) : html`<div className="card card-tint sub center">${t(L, 'remNone')}</div>`}
    ${st.messages.length ? html`<div className="card stack"><span className="eyebrow">Messages</span>${st.messages.slice(0, 6).map((m) => { const p = st.people.find((x) => x.id === m.to); return html`<div key=${m.id} className="row small"><${Icon} name="msg" size=${16} /><span className="grow">→ ${p ? p.name : ''}: “${m.text}”</span></div>`; })}</div>` : null}
  </div>`;
}

/* Shows which real services the server has, and the phone number used for test calls. */
function RealServices({ st, update, srv }) {
  if (!ON_WEBSITE) return null;
  const f = (srv && srv.features) || {};
  const chip = (on, label) => html`<span className=${'status ' + (on ? 'ok' : '')}>${on ? '✓' : '—'} ${label}</span>`;
  return html`<div className="card stack">
    <span className="eyebrow">Real services</span>
    ${srv ? html`<div className="chips">${chip(f.ai, 'AI')}${chip(f.calls, 'Phone calls')}${chip(f.sms, 'Texts')}${chip(f.push, 'Push')}</div>${srv.mock ? html`<span className="small muted">Mock mode: services are simulated on this computer.</span>` : null}`
      : html`<p className="small muted">No CareBridge server found. Calls, texts and push use demo mode. See the deploy guide to turn them on.</p>`}
    ${f.calls ? html`<div className="field"><label htmlFor="cb-clinic">Phone number CareBridge calls to book (must be on the approved list)</label>
      <input id="cb-clinic" className="input" inputMode="tel" placeholder="+1 408 555 0100" value=${st.settings.clinicPhone || ''} onInput=${(e) => update((n) => { n.settings.clinicPhone = e.target.value.trim(); })} /></div>
      <span className="small muted">Leave empty to use the practice call. For the demo, use a family member's phone playing the clinic.</span>` : null}
    ${f.sms ? html`<span className="small muted">Ride requests are texted to people in the ride circle who have a phone number. They reply YES or NO.</span>` : null}
  </div>`;
}

/* =====================================================================
   SETTINGS
   ===================================================================== */
function Settings({ st, update, go, notify, resync, focus, srv }) {
  const [pushMsg, setPushMsg] = useState('');
  const L = st.profile.lang;
  const [confirmReset, setConfirmReset] = useState(false);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const langRef = useRef(null);
  useEffect(() => { if (focus === 'lang' && langRef.current) langRef.current.scrollIntoView({ block: 'start' }); }, []);
  const h = st.hospital;

  // Real push (works even when CareBridge is closed): needs the server and, on iPhone, the Home Screen app.
  async function turnOnPush() {
    setPushMsg('');
    try {
      const id = await enablePush();
      update((n) => { n.settings.pushId = id; n.settings.notify = true; });
      setTimeout(() => pushNow(id, 'CareBridge', t(L, 'setNotif') + ' ✓'), 300);
    } catch (e) {
      setPushMsg(e.message);
    }
  }
  // Without the server: the browser can still show notifications while the CareBridge tab is open.
  async function turnOnBrowserNotifications() {
    const answer = await Notification.requestPermission();
    setPerm(answer);
    update((n) => { n.settings.notify = answer === 'granted'; });
    if (answer === 'granted') notify('CareBridge', t(L, 'remNone'));
  }
  function previewReminder() {
    const driverName = st.people.length ? st.people[0].name : 'Avi';
    notify(t(L, 'remDayBefore', { time: '9:30', doctor: 'Dr. Nirmala Gopalan' }), t(L, 'remPickup', { name: driverName, pickup: '8:50' }), { preview: true, channel: 'Push' });
  }
  return html`<div className="stack-lg">
    <${TopBar} onBack=${() => go({ name: 'home' })} title=${t(L, 'setTitle')} />
    <div className="stack" ref=${langRef}><span className="eyebrow">${t(L, 'setLang')}</span><${LangTiles} value=${L} onPick=${(id) => update((n) => { n.profile.lang = id; })} /></div>
    <div className="setting"><span>${t(L, 'setText')}</span><button className="switch" role="switch" aria-checked=${!!st.profile.bigText} aria-label=${t(L, 'setText')} onClick=${() => update((n) => { n.profile.bigText = !n.profile.bigText; })}></button></div>
    <div className="card stack">
      <div className="row" style=${{ justifyContent: 'space-between' }}><span className="eyebrow">${t(L, 'setHosp')}</span>${h && h.connectedAt ? html`<span className="badge-demo">${serverBadge(h)}</span>` : null}</div>
      ${h && h.connectedAt ? html`<b>${h.name}</b>
        ${st.patient ? html`<dl className="kv small"><dt>${st.patient.fullName}</dt><dd></dd><dt>${t(L, 'dob')}</dt><dd>${st.patient.birthDate || '—'}</dd><dt>${t(L, 'mrn')}</dt><dd>${st.patient.mrn || '—'}</dd></dl>` : null}
        <span className="muted small">${t(L, 'lastSync', { time: fmtDay(new Date(h.lastSync).toISOString(), L) + ' ' + fmtTime(new Date(h.lastSync).toISOString(), L) })}</span>
        <button className="btn btn-soft btn-sm" onClick=${resync}><${Icon} name="sync" size=${18} />${t(L, 'syncNow')}</button>`
      : html`<span className="muted">${t(L, 'notConnected')}</span><button className="btn btn-soft btn-sm" onClick=${() => { update((n) => { n.profile.setupDone = false; n.setupStep = 'hosp'; }); go({ name: 'setup' }); }}>${t(L, 'connect')}</button>`}
    </div>
    <div className="stack"><span className="eyebrow">${t(L, 'setCircle')}</span><${CircleEditor} st=${st} update=${update} lang=${L} /></div>
    <div className="card stack">
      <span className="eyebrow">${t(L, 'setNotif')}</span>
      ${srv && srv.features.push ? html`<div className="row"><span className="grow small">${st.settings.pushId ? 'On: reminders arrive on this phone, even when CareBridge is closed.' : 'Get reminders on this phone, even when CareBridge is closed. On iPhone, add CareBridge to the Home Screen first (Share → Add to Home Screen).'}</span>
          ${!st.settings.pushId ? html`<button className="btn btn-primary btn-sm" onClick=${turnOnPush}>${t(L, 'setNotifOn')}</button>` : null}</div>
        ${pushMsg ? html`<p className="small" style=${{ color: 'var(--danger)' }}>${pushMsg}</p>` : null}`
      : ON_WEBSITE && perm !== 'unsupported' ? html`<div className="row"><span className="grow small">${perm === 'granted' ? 'On' : 'Reminders and ride updates appear even when CareBridge is in the background (while the tab is open).'}</span>
          ${perm !== 'granted' ? html`<button className="btn btn-primary btn-sm" onClick=${turnOnBrowserNotifications}>${t(L, 'setNotifOn')}</button>` : null}</div>`
        : html`<p className="small muted">Real phone notifications work on the CareBridge website. Here you see previews, and “${t(L, 'addCal')}” creates reminders in the phone's own calendar.</p>`}
      <button className="btn btn-secondary btn-sm" onClick=${previewReminder}>Preview a reminder</button>
    </div>
    <button className="list-choice" onClick=${() => go({ name: 'letter' })}><${Icon} name="doc" /><span className="grow"><b>${t(L, 'letterTitle')}</b></span><${Icon} name="chev" /></button>
    <${RealServices} st=${st} update=${update} srv=${srv} />
    ${!confirmReset ? html`<button className="btn btn-secondary btn-block" style=${{ color: 'var(--danger)' }} onClick=${() => setConfirmReset(true)}>${t(L, 'setReset')}</button>`
      : html`<div className="card stack"><b>${t(L, 'setReset')}?</b><div className="tiles"><button className="btn btn-primary" onClick=${() => { clearState(); location.reload(); }}>${t(L, 'yes')}</button><button className="btn btn-secondary" onClick=${() => setConfirmReset(false)}>${t(L, 'cancel')}</button></div></div>`}
    <p className="small muted center">CareBridge · data stays on this phone · ${ON_WEBSITE ? 'website version' : 'local file (demo mode)'}</p>
  </div>`;
}

/* =====================================================================
   FAMILY VIEW (what a family member like Avi sees on her own phone)
   ===================================================================== */
function Family({ st, update, go, id, notify }) {
  const p = st.people.find((x) => x.id === id);
  if (!p) return html`<div><${TopBar} onBack=${() => go({ name: 'home' })} /><p>Not found.</p></div>`;
  const L = st.profile.lang;
  const senior = st.profile.name || 'Your family member';
  const onSeniorsPhone = { channel: senior + "'s phone" };

  // Every ride is its own request. A weekly visit has two: the ride there and the ride home.
  const asks = [];
  const mine = [];
  for (const a of st.appts.filter(isUpcoming)) {
    for (const leg of legsOf(a)) {
      const ride = a[legKey(leg)];
      if (ride.status === 'asking' && ride.askedId === p.id) asks.push({ a, leg });
      if (ride.status === 'confirmed' && ride.driverId === p.id) mine.push({ a, leg });
    }
  }
  const notes = st.messages.filter((m) => m.to === p.id);

  function rideName(a, leg) {
    if (!a.seriesId) return 'Ride';
    return leg === 'back' ? 'Ride home' : 'Ride there';
  }
  function question(a, leg) {
    if (!a.seriesId) return senior + " has a doctor's visit";
    if (leg === 'back') return 'Can you bring ' + senior + ' home from ' + a.reason + '?';
    return 'Can you drive ' + senior + ' to ' + a.reason + '?';
  }
  function pickupLine(a, leg) {
    if (leg === 'back') return 'Pick up at the clinic ' + fmtTime(endTime(a), 'en') + ' · we text you when the session ends';
    return 'Pick up ' + fmtTime(pickupTime(a), 'en') + ' · ' + (a.seriesId ? 'from home' : a.doctor);
  }
  function freeTimeWords(iso) {
    const d = new Date(iso);
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d);
    return day + (d.getHours() < 12 ? ' mornings' : ' afternoons');
  }

  function sayYes(a, leg) {
    update((n) => acceptRide(n, a.id, p.id, leg));
    notify(saidYesText(L, a, leg, p.name), fmtDay(a.start, L) + ' · ' + fmtTime(legTime(a, leg), L), onSeniorsPhone);
  }
  function takeEveryWeek(a, leg) {
    update((n) => {
      acceptRide(n, a.id, p.id, leg);
      setStanding(n, a.seriesId, leg, p.id);
    });
    const day = fmtWeekdayLong(new Date(a.start).getDay(), L);
    notify(t(L, leg === 'back' ? 'bringsYou' : 'dropsYou', { name: p.name }), t(L, 'everyDay', { day }), onSeniorsPhone);
  }
  function sayNo(a, leg) {
    update((n) => declineRide(n, a.id, p.id, leg));
  }
  function cantThisWeekTap(a, leg) {
    update((n) => { cantThisWeek(n, a.id, leg); });
    notify('Thanks for letting us know', 'Only ' + fmtDay(a.start, 'en') + ' is affected. We will quietly ask someone else.', { channel: p.name + "'s phone" });
  }

  return html`<div className="stack-lg">
    <div className="top">
      <div className="brand"><${Icon} name="people" size=${20} /><span>Family circle</span></div>
      <span className="muted small">Hi, ${p.name} · <span className="badge-demo">${p.name}'s phone</span></span>
    </div>

    ${asks.map(({ a, leg }) => html`<div key=${a.id + leg} className="stack-lg">
      <div className="stack">
        <span className="eyebrow">Ride request${a.seriesId ? ' · ' + rideName(a, leg) : ''}</span>
        <h1 className="h1" style=${{ fontSize: '1.6rem' }}>${question(a, leg)}</h1>
      </div>
      <div className="card stack" style=${{ gap: 0, padding: 0 }}>
        <div className="row" style=${{ padding: 16 }}><${Icon} name="cal" /><span>${fmtDay(a.start, 'en')} · ${fmtTime(visitTime(a), 'en')}${a.seriesId ? '–' + fmtTime(endTime(a), 'en') : ''}</span></div>
        <div className="divider" style=${{ marginLeft: 52 }}></div>
        <div className="row" style=${{ padding: 16 }}><${Icon} name="pin" /><span>${a.place || a.doctor}</span></div>
        <div className="divider" style=${{ marginLeft: 52 }}></div>
        <div className="row" style=${{ padding: 16 }}><${Icon} name="car" /><span>${pickupLine(a, leg)}</span></div>
      </div>
      <div className="row card card-tint" style=${{ padding: 12 }}>
        <${Icon} name=${a[legKey(leg)].outside ? 'clock' : 'check'} />
        <span className="small" style=${{ fontWeight: 600 }}>${a[legKey(leg)].outside ? 'Outside your usual free times' : 'Fits your free ' + freeTimeWords(legTime(a, leg))}</span>
      </div>
      <div className="stack">
        <span className="eyebrow">${senior}'s ride circle</span>
        <div className="avatars">${st.people.map((x) => html`<div key=${x.id} className="av">
          <${Avatar} name=${x.name} on=${x.id === p.id} />
          <span style=${{ fontWeight: x.id === p.id ? 700 : 400 }}>${x.name}${x.id === p.id ? ' (you)' : ''}</span>
        </div>`)}</div>
      </div>
      <div className="stack">
        <button className="btn btn-primary btn-block" onClick=${() => sayYes(a, leg)}>I'll drive${a.seriesId ? ' this week' : ''}</button>
        ${a.seriesId ? html`<button className="btn btn-soft btn-block" onClick=${() => takeEveryWeek(a, leg)}>Take this ride every week</button>` : null}
        <button className="btn btn-secondary btn-block" onClick=${() => sayNo(a, leg)}>Can't this time</button>
        <p className="small muted center">No pressure. If you can't, we'll quietly ask the next person. ${senior} only sees who's driving.</p>
      </div>
    </div>`)}
    ${!asks.length ? html`<div className="card card-tint stack">
      <b>No ride requests right now.</b>
      <span className="small muted">When ${senior} has a visit that fits your free times, you'll get a request here.</span>
    </div>` : null}

    ${mine.length ? html`<div className="card stack">
      <span className="eyebrow">You're driving</span>
      ${mine.map(({ a, leg }) => html`<div key=${a.id + leg} className="row" style=${{ alignItems: 'flex-start' }}>
        <${DateTile} iso=${a.start} lang="en" />
        <div className="grow stack" style=${{ gap: 2 }}>
          <b>${a.seriesId ? a.reason + ' · ' + rideName(a, leg) : a.doctor}</b>
          <div className="muted small">
            Pick up ${leg === 'back' ? 'at the clinic ' : ''}${fmtTime(legTime(a, leg), 'en')}
            ${a.delayMin ? ' (clinic running ' + a.delayMin + ' min late)' : ''}
            ${a[legKey(leg)].standing ? ' · every week' : ''}
          </div>
          ${a.seriesId ? html`<button className="link-btn small" style=${{ alignSelf: 'flex-start' }} onClick=${() => cantThisWeekTap(a, leg)}>Can't this week</button>` : null}
        </div>
      </div>`)}
    </div>` : null}

    ${notes.length ? html`<div className="card stack">
      <span className="eyebrow">From ${senior}</span>
      ${notes.map((m) => (m.audio || m.audioUrl)
        ? html`<div key=${m.id} className="stack" style=${{ gap: 6 }}>
            <div className="row"><${Icon} name="mic" /><b>${senior}'s voice</b></div>
            <audio controls src=${m.audio || m.audioUrl} style=${{ width: '100%' }}></audio>
          </div>`
        : html`<div key=${m.id} className="row"><${Icon} name="heart" /><span>“${m.text}”</span></div>`)}
    </div>` : null}
    <button className="btn btn-soft btn-block" onClick=${() => go({ name: 'home' })}>Back to ${senior}'s phone</button>
  </div>`;
}

/* =====================================================================
   DEMO CONTROLS (for the judges and the video; the senior never sees this)
   ===================================================================== */
function DemoSheet({ st, update, go, close, notify }) {
  const L = st.profile.lang;
  const next = st.appts.filter(isUpcoming)[0];
  const nextWeekly = st.appts.find((a) => a.seriesId && isUpcoming(a));
  const hasDemoPhysio = (st.series || []).some((w) => w.demo && w.active);

  function jumpToVisitDay() {
    update((n) => { n.demoToday = next.id; });
    go({ name: 'visit', id: next.id });
    notify(t(L, 'remDayOf', { time: fmtTime(visitTime(next), L), doctor: next.doctor }), '', { preview: true, channel: 'Push' });
    close();
  }

  function clinicRunsLate() {
    update((n) => { n.appts.find((x) => x.id === next.id).delayMin = 20; });
    const newPickup = new Date(new Date(pickupTime(next)).getTime() + 20 * 60000).toISOString();
    const driver = st.people.find((p) => p.id === next.ride.driverId);
    if (driver) {
      sendText(driver, 'CareBridge: the clinic is running 20 minutes late. New pickup time: ' + fmtTime(newPickup, 'en') + '.');
      notify(t(L, 'lateTitle', { n: 20 }), t(L, 'lateBody', { name: driver.name, time: fmtTime(newPickup, L) }), { channel: 'Push' });
    } else {
      notify(t(L, 'lateTitle', { n: 20 }), '', { channel: 'Push' });
    }
    close();
  }

  // Pretend the hospital moved a visit by two days, then sync it the same way a real sync would.
  function hospitalMovesVisit() {
    let message = null;
    update((n) => {
      const portalVisits = n.appts.filter((a) => a.source === 'portal' && isUpcoming(a));
      const target = portalVisits.find((a) => !next || a.id !== next.id) || portalVisits[0];
      if (!target) return;
      const moved = Object.assign({}, target, { start: new Date(new Date(target.start).getTime() + 2 * DAY).toISOString() });
      const changes = mergeSync(n, [moved]);
      n.hospital.lastSync = Date.now();
      if (!changes.length) return;
      const visit = n.appts.find((x) => x.id === target.id);
      const driver = n.people.find((p) => p.id === visit.ride.driverId);
      message = visit.doctor + ' → ' + fmtDay(visit.start, L) + ' ' + fmtTime(visit.start, L);
      if (driver) {
        // The old driver said yes to the old time, so ask again for the new time.
        message += ' · ' + driver.name + ' ✓';
        visit.ride = { status: 'idle', driverId: null, askedId: null, declinedIds: [] };
        askNext(n, visit);
      }
    });
    setTimeout(() => { if (message) notify('MyChart sync: visit moved', message, { channel: 'Push' }); }, 50);
    close();
  }

  function addPhysio() {
    update((n) => { addDemoPhysio(n); });
    go({ name: 'rides' });
    notify(t(L, 'weeklySaved'), t(L, 'physio') + ' · ' + t(L, 'everyDay', { day: fmtWeekdayLong(4, L) }) + ' ' + fmtTime(atTime(0, 16, 0), L), { channel: 'Push' });
    close();
  }

  function jumpToPhysioDay() {
    update((n) => {
      n.demoToday = nextWeekly.id;
      const visit = n.appts.find((y) => y.id === nextWeekly.id);
      if (visit.ride.status === 'idle') askNext(n, visit, 'to');
      if (visit.rideBack.status === 'idle') askNext(n, visit, 'back');
    });
    go({ name: 'visit', id: nextWeekly.id });
    close();
  }

  function previewReminder() {
    if (next) {
      const driver = st.people.find((p) => p.id === next.ride.driverId);
      const body = driver ? t(L, 'remPickup', { name: driver.name, pickup: fmtTime(pickupTime(next), L) }) : '';
      notify(t(L, 'remDayBefore', { time: fmtTime(visitTime(next), L), doctor: next.doctor }), body, { preview: true, channel: 'Push' });
    }
    close();
  }

  // Start over with Purna Ji, her hospital visits and her family, with past rides already filled in.
  function loadSample() {
    update((n) => {
      const lang = n.profile.lang;
      const bundle = demoBundle('Purna Ji');
      Object.assign(n, blankState());
      n.profile = { name: 'Purna Ji', lang, setupDone: false, bigText: false };
      n.setupStep = 'ready';
      n.hospital = Object.assign({}, HOSPITALS[0], { mode: 'demo', server: 'demo', connectedAt: Date.now(), lastSync: Date.now() });
      n.patient = mapPatient(bundle.patient, bundle.meds);
      n.patient.fullName = 'Purna Sharma';
      mergeSync(n, bundle.appts.map(mapAppointment));
      n.people = sampleFamily();
      let i = 0;
      for (const a of n.appts.filter((x) => x.status === 'done')) {
        a.ride.driverId = n.people[i % n.people.length].id;
        a.ride.status = 'confirmed';
        i++;
      }
      for (const a of n.appts.filter(isUpcoming)) {
        const person = askNext(n, a);
        if (person) acceptRide(n, a.id, person.id);
      }
    });
    close();
  }

  return html`<div className="sheet-back" onClick=${close}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Demo controls" onClick=${(e) => e.stopPropagation()}>
      <div className="row" style=${{ justifyContent: 'space-between' }}>
        <b className="h2">Demo controls</b>
        <button className="icon-btn" aria-label="Close" onClick=${close}><${Icon} name="x" /></button>
      </div>
      <p className="small muted">For the judges and the video. The senior never sees this panel.</p>

      <span className="eyebrow">See a family member's phone</span>
      <div className="chips">
        ${st.people.map((p) => html`<button key=${p.id} className="chip" onClick=${() => { go({ name: 'family', id: p.id }); close(); }}>${p.name}</button>`)}
        ${!st.people.length ? html`<span className="small muted">Add a ride circle first.</span>` : null}
      </div>
      <div className="setting">
        <span>Family accepts ride requests automatically</span>
        <button className="switch" role="switch" aria-checked=${!!st.settings.autoAccept} aria-label="Auto-accept rides" onClick=${() => update((n) => { n.settings.autoAccept = !n.settings.autoAccept; })}></button>
      </div>

      <span className="eyebrow">Next visit${next ? ': ' + next.doctor : ''}</span>
      <div className="stack">
        <button className="btn btn-secondary btn-sm" disabled=${!next} onClick=${jumpToVisitDay}>Jump to the day of the visit</button>
        <button className="btn btn-secondary btn-sm" disabled=${!next} onClick=${clinicRunsLate}>Clinic is running 20 minutes late</button>
        <button className="btn btn-secondary btn-sm" disabled=${!st.hospital || st.hospital.mode !== 'demo'} onClick=${hospitalMovesVisit}>Hospital moves a visit (sync picks it up)</button>
        <button className="btn btn-secondary btn-sm" disabled=${!next} onClick=${() => { go({ name: 'after', id: next.id }); close(); }}>Finish the next visit</button>
      </div>

      <span className="eyebrow">Weekly visit</span>
      <div className="stack">
        <button className="btn btn-secondary btn-sm" disabled=${!st.people.length || hasDemoPhysio} onClick=${addPhysio}>Add Purna Ji's Thursday physio</button>
        <button className="btn btn-secondary btn-sm" disabled=${!nextWeekly} onClick=${jumpToPhysioDay}>Jump to physio day (asks for any open ride)</button>
      </div>

      <span className="eyebrow">Notifications</span>
      <button className="btn btn-secondary btn-sm" onClick=${previewReminder}>Preview the day-before reminder</button>

      <span className="eyebrow">Start over</span>
      <div className="tiles">
        <button className="btn btn-soft btn-sm" onClick=${loadSample}>Load Purna Ji sample</button>
        <button className="btn btn-secondary btn-sm" onClick=${() => { clearState(); location.reload(); }}>Reset everything</button>
      </div>
    </div>
  </div>`;
}

/* =====================================================================
   APP
   ===================================================================== */
function App() {
  const [st, setSt] = useState(loadState);
  const [route, setRoute] = useState(() => (loadState().profile.setupDone ? { name: 'home' } : { name: 'setup' }));
  const [notif, setNotif] = useState(null);
  const [toast, setToast] = useState('');
  const [demoOpen, setDemoOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [srv, setSrv] = useState(null);
  const stRef = useRef(st); stRef.current = st;
  useEffect(() => { getServer().then((j) => {
    if (j && j.epic) { if (j.epic.nonProd) CONFIG.EPIC_CLIENT_ID = j.epic.nonProd; if (j.epic.prod) CONFIG.EPIC_PROD_CLIENT_ID = j.epic.prod; }
    setSrv(j);
  }); }, []);

  const update = useCallback((fn) => setSt((prev) => { const n = clone(prev); fn(n); saveState(n); return n; }), []);
  // Weekly visits: keep the next 4 weeks on the calendar, mark past weeks done, fill rides (on open and every hour).
  useEffect(() => { const run = () => { if ((stRef.current.series || []).length) update(ensureSeries); }; run(); const id = setInterval(run, 3600000); return () => clearInterval(id); }, []);
  const go = useCallback((r) => { setRoute(r); window.scrollTo(0, 0); }, []);
  const notifTimer = useRef(null);
  const notify = useCallback((title, body, opts = {}) => {
    clearTimeout(notifTimer.current);
    setNotif({ title, body, preview: !!opts.preview, channel: opts.channel || '' });
    notifTimer.current = setTimeout(() => setNotif(null), 5200);
    try {
      if (opts.preview) return;
      const s = stRef.current;
      if (s.settings.pushId) pushNow(s.settings.pushId, title, body);
      else if (ON_WEBSITE && s.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body });
    } catch (e) { }
  }, []);
  const showToast = (s) => { setToast(s); setTimeout(() => setToast(''), 2600); };

  // Calendar file: a plain download on the website; a page opened as a plain file can't save it.
  const saveFile = useCallback((filename, data, type) => {
    if (!ON_WEBSITE) { showToast('Calendar files download on the CareBridge website version.'); return; }
    try { const url = URL.createObjectURL(new Blob([data], { type })); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
    catch (e) { showToast('Could not create the calendar file.'); }
  }, []);

  // Finish a real hospital sign-in when the hospital sends the person back here.
  useEffect(() => {
    if (!ON_WEBSITE || !/[?&](code|error)=/.test(location.search)) return;
    setSyncing(true);
    smartComplete().then((res) => {
      setSyncing(false);
      if (!res) return;
      if (res.error) { showToast(res.error); return; }
      update((n) => {
        n.patient = mapPatient(res.data.patient, res.data.meds);
        const fresh = res.data.appts.map(mapAppointment);
        mergeSync(n, fresh);
        n.hospital = Object.assign({}, n.hospital || HOSPITALS[0], { mode: 'real', server: res.serverId, connectedAt: Date.now(), lastSync: Date.now() });
        if (n.patient.language && !n.profile.setupDone && LANGS.some((l) => l.id === n.patient.language)) n.profile.lang = n.patient.language;
        if (!n.profile.setupDone) n.setupStep = 'portal';
        else n.appts.filter(isUpcoming).forEach((a) => { if (a.ride.status === 'idle' && !a.seriesId) askNext(n, a); });
      });
      notify('Connected', res.data.appts.length + ' appointments synced from ' + smartServer(res.serverId).label);
    }).catch((e) => { setSyncing(false); showToast('Sign-in failed: ' + (e.message || e)); });
  }, []);

  // Real texts: each ride request goes to the asked person's phone; their YES or NO comes back here.
  useEffect(() => {
    if (!srv || !srv.features.sms) return;
    const busy = new Set();
    for (const a of st.appts) for (const leg of legsOf(a)) { const r = a[legKey(leg)]; if (isUpcoming(a) && r.status === 'asking' && r.smsTo && r.smsTo === r.askedId) busy.add(r.askedId); }
    for (const a of st.appts) for (const leg of legsOf(a)) {
      const r = a[legKey(leg)];
      if (!isUpcoming(a) || r.status !== 'asking' || !r.askedId || r.smsTo === r.askedId || busy.has(r.askedId)) continue;
      const p = st.people.find((x) => x.id === r.askedId);
      if (!p || !p.phone) continue;
      busy.add(p.id);
      update((n) => { const x = n.appts.find((y) => y.id === a.id); if (x) x[legKey(leg)].smsTo = r.askedId; });
      sendText(p, rideRequestText(st, a, leg), { requestId: smsRequestId(a, leg), personId: p.id });
    }
  }, [st, srv]);
  useEffect(() => {
    if (!srv || !srv.features.sms) return;
    // Every 4 seconds, ask the server whether anyone we texted has answered YES or NO.
    const id = setInterval(async () => {
      const waiting = [];
      for (const a of stRef.current.appts.filter(isUpcoming)) {
        for (const leg of legsOf(a)) {
          const ride = a[legKey(leg)];
          if (ride.status === 'asking' && ride.smsTo && ride.smsTo === ride.askedId) waiting.push({ a, leg, ride });
        }
      }
      if (!waiting.length) return;
      let replies;
      try {
        const ids = waiting.map((w) => encodeURIComponent(smsRequestId(w.a, w.leg))).join(',');
        replies = (await api('sms/replies?ids=' + ids)).replies;
      } catch (e) {
        return; // the server didn't answer; try again in 4 seconds
      }
      for (const { a, leg, ride } of waiting) {
        const answers = replies[smsRequestId(a, leg)];
        const reply = answers && answers[ride.askedId];
        if (!reply) continue;
        if (reply.at < (ride.askedAt || 0) - 60000) continue; // an old answer from before this request
        if (reply.answer === 'no') {
          update((n) => declineRide(n, a.id, ride.askedId, leg));
          continue;
        }
        update((n) => acceptRide(n, a.id, ride.askedId, leg));
        const s = stRef.current;
        const person = s.people.find((x) => x.id === ride.askedId);
        if (person) {
          notify(saidYesText(s.profile.lang, a, leg, person.name), fmtDay(a.start, s.profile.lang) + ' · ' + fmtTime(legTime(a, leg), s.profile.lang), { channel: 'Text reply' });
          sendText(person, rideConfirmText(s, a, leg));
        }
      }
    }, 4000);
    return () => clearInterval(id);
  }, [srv]);
  // Keep the server's list of push reminders in step with the visits.
  const schedKey = JSON.stringify(computeReminders(st).map((r) => [r.id, r.when, r.title, r.body]));
  useEffect(() => { if (srv && srv.features.push && st.settings.pushId) { const id = setTimeout(() => pushSchedule(stRef.current), 800); return () => clearTimeout(id); } }, [schedKey, srv, st.settings.pushId]);

  // Demo helper: the family answers ride requests on their own after a moment.
  useEffect(() => {
    if (!st.settings.autoAccept) return;
    // Find the first ride that is waiting for an answer.
    let asking = null;
    let leg = 'to';
    for (const a of st.appts.filter(isUpcoming)) {
      for (const l of legsOf(a)) {
        if (!asking && a[legKey(l)].status === 'asking') { asking = a; leg = l; }
      }
    }
    if (!asking) return;
    const id = setTimeout(() => {
      const L = st.profile.lang;
      const askedId = asking[legKey(leg)].askedId;
      const person = st.people.find((x) => x.id === askedId);
      update((n) => acceptRide(n, asking.id, askedId, leg));
      if (person) notify(saidYesText(L, asking, leg, person.name), fmtDay(asking.start, L) + ' · ' + fmtTime(legTime(asking, leg), L), { channel: 'Push' });
    }, 2200);
    return () => clearTimeout(id);
  }, [st]);

  useEffect(() => { document.documentElement.lang = st.profile.lang; document.documentElement.classList.toggle('big', !!st.profile.bigText); }, [st.profile.lang, st.profile.bigText]);

  const resync = async () => {
    const h = st.hospital;
    if (!h) return;
    if (h.mode === 'real' && ON_WEBSITE) {
      const tok = savedToken();
      if (!tok) { smartBegin(h.server || 'smart'); return; }
      try {
        const data = await smartFetchAll(tok.serverId, tok.access_token, tok.patient);
        let changes = [];
        update((n) => { n.patient = mapPatient(data.patient, data.meds); changes = mergeSync(n, data.appts.map(mapAppointment)); n.hospital.lastSync = Date.now(); });
        notify(t(st.profile.lang, 'syncNow'), t(st.profile.lang, 'syncedN', { n: data.appts.length }));
      } catch (e) { showToast(e.message || String(e)); }
      return;
    }
    const b = demoBundle(st.profile.name);
    update((n) => { mergeSync(n, b.appts.map(mapAppointment).filter((a) => n.appts.some((x) => x.id === a.id))); n.hospital.lastSync = Date.now(); });
    notify(t(st.profile.lang, 'syncNow'), t(st.profile.lang, 'syncedN', { n: st.appts.length }), { channel: 'Demo' });
  };

  const P = { st, update, go, notify, saveFile, srv };
  let screen;
  if (!st.profile.setupDone || route.name === 'setup') screen = html`<${Setup} ...${P} syncing=${syncing} />`;
  else if (route.name === 'talk') screen = html`<${Talk} ...${P} listen=${!!route.listen} key=${'talk-' + st.profile.lang} />`;
  else if (route.name === 'call') screen = html`<${Call} ...${P} draft=${route.draft} practice=${!!route.practice} key=${'call-' + (route.n || 0) + (route.practice ? 'p' : '')} />`;
  else if (route.name === 'visit') screen = html`<${Visit} ...${P} id=${route.id} />`;
  else if (route.name === 'after') screen = html`<${After} ...${P} id=${route.id} />`;
  else if (route.name === 'letter') screen = html`<${Letter} ...${P} />`;
  else if (route.name === 'rides') screen = html`<${Rides} ...${P} />`;
  else if (route.name === 'weekly') screen = html`<${Weekly} ...${P} id=${route.id} prefill=${route.prefill} key=${'wk-' + (route.id || 'new')} />`;
  else if (route.name === 'reminders') screen = html`<${Reminders} ...${P} />`;
  else if (route.name === 'settings') screen = html`<${Settings} ...${P} resync=${resync} focus=${route.focus} />`;
  else if (route.name === 'family') screen = html`<${Family} ...${P} id=${route.id} />`;
  else screen = html`<${Home} ...${P} openDemo=${() => setDemoOpen(true)} />`;

  return html`<main className="app">
    ${screen}
    <${NotifLayer} notif=${notif} onClose=${() => setNotif(null)} />
    ${demoOpen ? html`<${DemoSheet} ...${P} close=${() => setDemoOpen(false)} />` : null}
    ${toast ? html`<div className="toast" role="status">${toast}</div>` : null}
  </main>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
