// Sends one Web Push message. Uses the web-push library (VAPID keys from the environment).
import webpush from 'web-push';
import { env } from '../_lib.js';

let ready = false;
export async function pushTo(subscription, payload) {
  if (env('MOCK') === '1') return { mocked: true };
  if (!ready) { webpush.setVapidDetails('mailto:' + env('VAPID_CONTACT', 'carebridge@example.com'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY')); ready = true; }
  return webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 6 * 3600 });
}
