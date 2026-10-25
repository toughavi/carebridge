# CareBridge

**Care, without having to ask.** CareBridge helps seniors book doctor visits by voice in their own language, get a ride from family without having to ask, and keep track of reminders and follow-ups. Built for the 2026 Congressional App Challenge.

**Languages:** English, 中文 Mandarin, हिन्दी Hindi, தமிழ் Tamil, ਪੰਜਾਬੀ Punjabi, Español, Tiếng Việt

## What it does

1. **Two-minute setup:** choose a language, connect a hospital (MyChart), add the people who can drive.
2. **Home dashboard:** next visit and who is driving, upcoming visits, and a chart of past visits by who drove.
3. **Book by voice:** the senior speaks in her language; Claude understands, repeats it back (teach-back), then CareBridge **calls the clinic** and books it.
4. **Add a visit from a letter or photo:** for clinics that aren't connected, take a photo or paste the message; the AI fills in doctor, date, time, address and preparation steps, and highlights anything to check.
5. **Rides without asking:** family members say when they're usually free. CareBridge **texts** one person at a time ("Reply YES or NO"), fewest rides first. A "no" is silent; the senior only sees who said yes.
6. **Weekly visits (v1.2):** a standing appointment like physiotherapy is told once ("physio every Thursday at 2") by voice, typing or a letter. Nothing is booked. Every week has a **ride there** and a **ride home**, each with its own driver. A family member can take a ride every week ("Thursday drop-offs"); open rides are asked 5 days ahead, one person at a time. The senior taps **I'm done, come get me** to text the ride-home driver, or **Skip this week** to tell both drivers. A standing driver can say **Can't this week** and only that week is asked again.
7. **Reminders and follow-up:** push notifications, calendar alarms, a clinic-delay alert that moves the pickup, a follow-up reminder, and a thank-you to the driver: one tap, or recorded in the senior's own voice.

## What is real

| Part | Where it runs | Status |
| --- | --- | --- |
| Setup, dashboard, chart, languages, ride matching, weekly visits, reminders, follow-up | On the phone | Real |
| Hospital sign-in | Website version | **Real SMART on FHIR** (OAuth 2.0 + PKCE): Epic's test system, SMART Health IT test server, and real hospitals (Stanford, SCVMC, El Camino, Sutter) once Epic's production ID is active |
| Understanding requests and reading letters | Website + server | Real Claude; keyword fallback if no AI |
| Calling the clinic | Website + server | **Real phone call** (Twilio + Claude, turn by turn); practice call otherwise |
| Texts to family, YES/NO replies | Website + server | **Real texts** (Twilio) |
| Push notifications | Installed website + server | **Real push**, including a daily evening reminder job |
| Calendar alarms | Website version | Real `.ics` file (1 day and 2 hours before) |

Everything works without a server in demo mode, and the screens label what is simulated.

## Run it

```
npm install
npm run dev:mock     # everything simulated, no accounts: http://localhost:8790
npm test             # server tests
```

To put it online with real calls, texts, push and Epic sign-in, follow **DEPLOY.md**.

## How the code is organized

| Path | What is in it |
| --- | --- |
| `src/i18n.js` | All interface text in 7 languages, plus keywords for the offline fallback |
| `src/core.js` | Logic with no screens: storage, dates, FHIR mapping, SMART sign-in, ride matching, reminders, AI, letter reading |
| `src/ui.js` | Screens (React 18 with `htm` templates, no build step) |
| `src/styles.css` | Design tokens and layout, light and dark |
| `src/build.py` | Pastes the four files together into `index.html` (`python3 src/build.py`) |
| `api/` | Server functions on Vercel: `ai`, `call/*`, `sms/*`, `push/*`, `voice`, `cron/reminders`, `health` |
| `scripts/dev-server.mjs` | Local server; `MOCK=1` simulates Claude, Twilio, the database and push |
| `tests/` | Server tests |
| `sw.js`, `manifest.webmanifest`, `icons/` | Installable app and push notifications |
| `privacy.html`, `terms.html` | Pages Epic asks for when registering the app |

## Privacy and safety

- The senior's data stays in the phone's browser; "Erase everything" removes it. No accounts, no tracking.
- Hospital sign-in happens on the hospital's own page; CareBridge never sees the password and can only read.
- Calls and texts only reach numbers on an approved list; every call starts by saying it is an AI; nothing is recorded.
- Server keys live in Vercel's settings, never in the page.

## Version history and who did what

See **CHANGES.md** for what changed in each version and **CONTRIBUTIONS.md** for who did what.
