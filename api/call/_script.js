// What CareBridge says on a call, and how Claude decides the next line.
import { claude, parseJSON, env } from '../_lib.js';

export const VOICE = () => env('CALL_VOICE', 'Polly.Joanna');
export const MAX_TURNS = 8;

export function openingLine(s) {
  const pref = s.timePref === 'morning' ? 'Mornings work best.' : s.timePref === 'afternoon' ? 'Afternoons work best.' : 'Any time works.';
  return 'Hello, this is CareBridge, an automated AI assistant calling on behalf of ' + s.patientName +
    '. I would like to book ' + (s.reasonEn || 'an appointment') + (s.doctor ? ' with ' + s.doctor : '') + '. ' + pref;
}

export async function nextLine(s) {
  const today = new Date().toDateString();
  const facts = [
    'Patient: ' + s.patientName,
    s.dob ? 'Date of birth: ' + s.dob + ' (share only if asked)' : null,
    s.mrn ? 'Medical record number: ' + s.mrn + ' (share only if asked)' : null,
    'Wants: ' + (s.reasonEn || 'an appointment') + (s.doctor ? ' with ' + s.doctor : ''),
    'Preferred time: ' + (s.timePref || 'any'),
    s.interpreter ? 'Needs a ' + s.interpreter + ' interpreter at the visit' : null,
    'Callback: the family will call back for anything you cannot answer'
  ].filter(Boolean).join('\n');
  const system = [
    'You are CareBridge, an AI assistant on a live phone call with a clinic receptionist, booking a visit for an older adult.',
    'You already said you are an AI assistant. Today is ' + today + '.',
    'Facts you may use:\n' + facts,
    'Speak like a polite, efficient caller: one or two short sentences per turn, no lists, no markdown.',
    'Accept the first reasonable time that fits the preference. Repeat the agreed day, date and time back once to confirm. Mention the interpreter if one is needed.',
    'Never invent medical details, insurance details or facts not listed. If asked something you do not know, say the family will call back with that.',
    'When the time is confirmed (or the clinic cannot book), say a short thank-you goodbye and set done to true.',
    'Reply with ONLY JSON: {"say": string, "done": boolean, "outcome": "booked"|"no_slot"|"callback"|"in_progress", "date": "YYYY-MM-DD"|null, "time": "HH:MM"|null}'
  ].join('\n');
  // The clinic speaks as "user", CareBridge as "assistant". The conversation must start with a user turn.
  const messages = [{ role: 'user', content: '(The call connects.)' }];
  for (const l of s.lines) messages.push({ role: l.who === 'ai' ? 'assistant' : 'user', content: l.text || '(silence)' });
  if (messages[messages.length - 1].role === 'assistant') messages.push({ role: 'user', content: '(silence)' });
  // Merge consecutive same-role turns (the API needs alternating roles).
  const merged = [];
  for (const m of messages) { const last = merged[merged.length - 1]; if (last && last.role === m.role) last.content += '\n' + m.content; else merged.push({ ...m }); }
  const text = await claude({ system, messages: merged, maxTokens: 300, model: env('CALL_MODEL') || undefined });
  const j = parseJSON(text) || { say: 'Thank you. Our family will call back to confirm. Goodbye.', done: true, outcome: 'callback' };
  j.say = String(j.say || '').slice(0, 400) || 'Thank you, goodbye.';
  return j;
}
