# What changed, version by version

What actually changed in each version, October 2026. Add your own entries as you make changes.

## v1: first working app
- Setup in 3 steps: language, hospital, the people who can drive.
- Home screen: next visit, who is driving, and a chart of past visits by driver.
- Booking by voice or typing, with a practice call to the clinic.
- Rides: one family member is asked at a time, fewest rides first; a "no" is never shown to the senior.
- Reminders, a calendar file, a follow-up reminder, and a thank-you to the driver.
- 7 languages, and the deep orange design on white.
- Hospital sign-in with SMART on FHIR, tested on the SMART Health IT test server.
- Adding a visit from a photo or pasted text of an appointment letter.

## v1.1: real services
- A small server on Vercel: Claude for understanding requests and reading letters, real phone calls and texts through Twilio, push notifications, and a daily reminder job.
- Mock mode, so the whole thing can be tested on one computer with no accounts.
- Server tests.

## v1.2: weekly visits
- Inspired by Dadima's weekly physiotherapy: she didn't want to ask for a ride every week.
- A weekly visit is told once. Every week gets a ride there and a ride home, each with its own driver.
- A family member can take a ride every week; open rides are asked 5 days ahead.
- "I'm done, come get me", "Skip this week" and "Can't this week".

## Fix: the site wouldn't deploy (October 23)
- Problem: Vercel's build finished but "Deploying outputs" failed. Vercel's free plan allows 12 server functions and the app had 13.
- Fix: the three notification functions (`subscribe`, `send`, `schedule`) became one, `api/push/[action].js`. Added a test that fails if the server goes over 12 functions.
- Also set Node to version 22 so Vercel stops warning on every function.

## v4: simpler and closer to the real story (October 24)
- Avi is Dadima's granddaughter: in high school, just started driving, free after school and on Saturdays. The demo physio moved to Thursdays at 4, after school.
- Removed an unused way of running the AI. The AI now has two paths: our server, or simple keyword matching when there is no AI.
- Rewrote the family phone screen, the demo controls, the notification settings and the text-reply check so each action is a short named function instead of one very long line. Lines over 300 characters in `ui.js` went from 34 to 13 (most of the rest are icon drawings and screen layout).
- Removed a shortcut in the family screen that built a fake copy of the app's data just to make one sentence.
- The build makes one file, `index.html`.
- All tests still pass: 13 server tests and the browser tests for setup, booking, rides, letters, weekly visits and mock-server mode.

## v4: voice thank-you (October 24)
- After a visit, the senior can record a thank-you of up to 15 seconds in her own voice, listen to it, and send it.
- The driver gets a text with a link that plays the recording, and it also plays on the family screen.
- New server route `api/voice.js` saves the recording for 30 days under a long random id. It only accepts audio and refuses recordings that are too long. That makes 12 server functions, exactly Vercel's free limit.
- The story's scene 6 is back to the recorded voice.
- Tested with a simulated microphone in the browser, in demo mode and with the mock server; 14 server tests pass.
