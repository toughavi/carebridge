// POST /api/ai — the website version asks Claude through here (the key stays on the server).
// Body: { prompt: string, images?: [{ media_type, data (base64) }] }  →  { json, text }
import { send, readBody, fromOurPage, claudeConfigured, claude, parseJSON, underLimit } from './_lib.js';

const MAX_PROMPT = 24000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  if (!fromOurPage(req)) return send(res, 403, { error: 'Not allowed' });
  if (!claudeConfigured()) return send(res, 503, { error: 'AI is not set up on this server' });
  if (!(await underLimit(req, 'ai', 20))) return send(res, 429, { error: 'Too many requests. Please wait a minute.' });
  const body = await readBody(req);
  const prompt = String(body.prompt || '');
  if (!prompt || prompt.length > MAX_PROMPT) return send(res, 400, { error: 'Prompt missing or too long' });
  const images = Array.isArray(body.images) ? body.images.slice(0, 2) : [];
  const content = [];
  for (const im of images) {
    if (!IMAGE_TYPES.includes(im.media_type) || typeof im.data !== 'string' || im.data.length * 0.75 > MAX_IMAGE_BYTES) return send(res, 400, { error: 'Image not accepted' });
    content.push({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } });
  }
  content.push({ type: 'text', text: prompt });
  try {
    const text = await claude({
      system: 'You are part of CareBridge, an app that helps older adults with doctor visits. Follow the instructions in the message exactly and reply with only the JSON requested.',
      messages: [{ role: 'user', content }],
      maxTokens: 900,
      model: images.length ? (process.env.CLAUDE_VISION_MODEL || undefined) : undefined
    });
    send(res, 200, { json: parseJSON(text), text });
  } catch (e) {
    send(res, 502, { error: String(e.message || e) });
  }
}
