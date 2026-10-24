// GET /api/health — tells the app which real services are set up.
import { send, claudeConfigured, twilioConfigured, kvConfigured, pushConfigured, env } from './_lib.js';

export default async function handler(req, res) {
  const kvOk = kvConfigured();
  send(res, 200, {
    ok: true,
    version: '1.2.0',
    features: {
      ai: claudeConfigured(),
      calls: twilioConfigured() && claudeConfigured() && kvOk,
      sms: twilioConfigured() && kvOk,
      push: pushConfigured() && kvOk,
      kv: kvOk
    },
    vapidPublicKey: env('VAPID_PUBLIC_KEY') || null,
    // Epic client IDs are public values; keeping them here means no code change is needed after registering.
    epic: { nonProd: env('EPIC_CLIENT_ID') || null, prod: env('EPIC_PROD_CLIENT_ID') || null },
    mock: env('MOCK') === '1'
  });
}
