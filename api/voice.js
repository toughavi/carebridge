// /api/voice — a short thank-you recorded in the senior's own voice.
//   POST { audio (base64), type }  -> saves it and returns { id, url }
//   GET  ?id=...                   -> plays it (the link in the text message to the driver)
import { send, readBody, query, fromOurPage, kvConfigured, kvGet, kvSet, newId, baseUrl, underLimit } from './_lib.js';

const MAX_BASE64 = 700000; // about 500 KB of audio; 15 seconds of speech is usually under 100 KB

export default async function handler(req, res) {
  if (!kvConfigured()) return send(res, 503, { error: 'The database is not set up on this server' });

  if (req.method === 'GET') {
    const clip = await kvGet('voice:' + String(query(req).id || ''));
    if (!clip) return send(res, 404, { error: 'This recording has expired or does not exist' });
    res.statusCode = 200;
    res.setHeader('Content-Type', clip.type);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.end(Buffer.from(clip.data, 'base64'));
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'Use GET or POST' });
  if (!fromOurPage(req)) return send(res, 403, { error: 'Not allowed' });
  if (!(await underLimit(req, 'voice', 6))) return send(res, 429, { error: 'Too many recordings. Please wait a minute.' });
  const b = await readBody(req);
  const type = String(b.type || '').split(';')[0];
  if (!/^audio\/[a-z0-9.+-]+$/.test(type)) return send(res, 400, { error: 'Not an audio recording' });
  if (!b.audio || typeof b.audio !== 'string' || b.audio.length > MAX_BASE64) return send(res, 413, { error: 'The recording is too long' });
  const id = newId(16); // long and random, so nobody can guess another family's link
  await kvSet('voice:' + id, { type, data: b.audio }, 30 * 86400);
  send(res, 200, { id, url: baseUrl(req) + '/api/voice?id=' + id });
}
