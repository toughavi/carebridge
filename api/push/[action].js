// /api/push/subscribe, /api/push/send, /api/push/schedule — one server function for all three
// (Vercel's free plan allows 12 functions per site). The real handlers are in the _ files beside this one.
import { send } from '../_lib.js';
import subscribe from './_subscribe.js';
import sendNow from './_send.js';
import schedule from './_schedule.js';

const ACTIONS = { subscribe, send: sendNow, schedule };

export default async function handler(req, res) {
  const action = String(new URL(req.url, 'http://local').pathname.split('/').pop() || '');
  const fn = ACTIONS[action];
  if (!fn) return send(res, 404, { error: 'Unknown push action' });
  return fn(req, res);
}
