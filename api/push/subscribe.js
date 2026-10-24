// POST /api/push/subscribe — saves this phone's push subscription. Body: { subscription } → { id }
import { send, readBody, fromOurPage, pushConfigured, kvConfigured, kvSet, kv, hashId } from '../_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  if (!fromOurPage(req)) return send(res, 403, { error: 'Not allowed' });
  if (!(pushConfigured() && kvConfigured())) return send(res, 503, { error: 'Push is not set up on this server' });
  const { subscription } = await readBody(req);
  if (!subscription || !subscription.endpoint || !/^https:\/\//.test(subscription.endpoint)) return send(res, 400, { error: 'Bad subscription' });
  const id = hashId(subscription.endpoint);
  await kvSet('pushsub:' + id, subscription, 120 * 86400);
  await kv('SADD', 'pushsubs', id);
  send(res, 200, { id });
}
