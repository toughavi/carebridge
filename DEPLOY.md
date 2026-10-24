# Putting CareBridge online (about 45 minutes, done by a parent)

Every account below is free or nearly free. Keys go into Vercel's settings, **never** into the code or a chat.

## 1. GitHub (5 min)

1. Create an account at github.com (or sign in).
2. **New repository** → name it `carebridge` → Public → Create.
3. **Add file → Upload files** → drag in everything from the `carebridge-app` folder (not `node_modules`) → Commit.

## 2. Vercel: the website and server (5 min)

1. Go to vercel.com → **Sign up with GitHub**.
2. **Add New → Project** → import `carebridge` → Framework preset **Other** → leave Build Command empty → **Deploy**.
3. Your address appears, for example `https://carebridge-abc.vercel.app`. Open it: the app works already, in demo mode.
4. **Storage → Create Database → Upstash Redis (free) → Connect to project.** This adds the database settings for you.

## 3. Claude (5 min)

1. console.anthropic.com → sign up → **Billing**: add $5 of credit.
2. **API Keys → Create key** → copy it.
3. Vercel → Project → **Settings → Environment Variables** → add `ANTHROPIC_API_KEY` = the key.

## 4. Twilio: calls and texts (15 min)

1. twilio.com → sign up (a trial gives free credit). Verify your own phone when asked.
2. **Phone Numbers → Buy a number** with Voice and SMS (a 408 number is nice for the demo).
3. **Phone Numbers → Verified Caller IDs**: add every phone CareBridge should call or text (the family's phones, plus the phone that plays the "clinic" in the demo). Trial accounts can only reach verified numbers.
4. Copy the **Account SID** and **Auth Token** from the Twilio Console home page.
5. In Vercel, add:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` = the number you bought, like `+14085550100`
   - `ALLOWED_NUMBERS` = the verified phones, comma separated, like `+14085550111,+14085550122`
6. Twilio → your number → **Messaging → "A message comes in"** → Webhook → `https://YOUR-ADDRESS/api/sms/inbound` → HTTP POST → Save. (This is how a family member's YES or NO reaches the app.)
7. Trial accounts add a short "Sent from your Twilio trial account" line and play a trial notice at the start of calls. Upgrading (about $20) removes them. If texts to US phones are blocked, Twilio's console shows a registration message; calls still work, and texts can be shown in demo mode.

## 5. Push notifications (5 min)

In Vercel, add the three values from the separate `secrets-for-vercel.txt` file:
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`. Also add `VAPID_CONTACT` = your email.

## 6. Epic: hospital sign-in (10 min)

1. fhir.epic.com → sign up → **Build Apps → Create**.
2. Audience **Patients**; public client (no secret); no refresh tokens.
3. APIs (R4, read only): Patient.Read, Encounter.Read and Search, MedicationRequest.Read and Search, and Appointment.Read and Search **only if Epic lists them as eligible for automatic distribution**.
4. Redirect URI: `https://YOUR-ADDRESS/` (with the slash at the end).
5. Links Epic asks for: documentation `https://YOUR-ADDRESS/`, terms `https://YOUR-ADDRESS/terms.html`, privacy `https://YOUR-ADDRESS/privacy.html`.
6. Save → **Ready for Production**. Copy both IDs into Vercel:
   - `EPIC_CLIENT_ID` = Non-Production Client ID (Epic's test system; test login `fhircamila` / `epicepic1`)
   - `EPIC_PROD_CLIENT_ID` = Production Client ID (real hospitals: Stanford, SCVMC, El Camino, Sutter)
7. New IDs can take hours (production: about two days) before they work.

## 7. Turn it all on

1. Vercel → **Deployments → ⋯ → Redeploy** (settings only apply after a redeploy).
2. Open your address on a phone → **Settings → Real services** should show ✓ AI, ✓ Phone calls, ✓ Texts, ✓ Push.
3. In Settings, enter the phone that plays the clinic, add phone numbers to the ride circle, and tap **Turn on** for notifications (on iPhone: Share → Add to Home Screen first, then open CareBridge from the Home Screen).

## Safety built in

- Calls and texts only go to numbers in `ALLOWED_NUMBERS`.
- CareBridge says it is an AI at the start of every call, and nothing is recorded.
- Every Twilio webhook is checked for Twilio's signature; requests from other websites are refused.
- Per-minute limits stop anyone from running up the bill.

## Try it without any accounts

```
npm install
npm run dev:mock      # then open http://localhost:8790
```

Mock mode simulates Claude, a clinic receptionist answering the phone, family members texting back (the first says no, the next says yes), the database and push.

Tests: `npm test`
