# Test plan: S2DIO (Real-Time Audio Collaboration)

Build: 2026-10-08-prod-init  Date: 2026-10-08  Env: local, seed data, port 3000, VST3 bridge port 4949

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | F01 Host creates room & streams DAW audio | happy | Open `/`, click "Start Instant Room" -> redirect to `/session/:slug` -> verify room loads, Host badge visible, VST3 bridge connected (:4949) | Studio room active, 0ms latency meter, channel strips responsive | e2e | PASS |
| F01-E1 | F01 Host creates room | edge: empty custom slug | Submit empty custom slug in session API | Generates randomized 8-char nanoid slug | e2e | PASS |
| F01-E2 | F01 Host creates room | edge: rapid double-click create | Click "Start Instant Room" twice rapidly | Single session created, no duplicate navigation error | e2e | PASS |
| F01-N1 | F01 Audio engine settings | negative: invalid sample rate | Send malformed sample rate to session patch | Handled gracefully with schema validation error | e2e | PASS |
| F02-H1 | F02 Guest joins via shareable link | happy | Open `/guest/test-session-1` as anonymous collaborator | Guest portal loads without login prompt, audio stream player and mixer visible | e2e | PASS |
| F02-E1 | F02 Guest joins room | edge: nonexistent room slug | Open `/guest/nonexistent-xyz-999` | Shows clear "Session not found or expired" empty state with return button | e2e | PASS |
| F02-E2 | F02 Guest join | edge: mobile viewport | Render `/guest/test-session-1` at 375x667 viewport | Responsive layout with stacked mixer and tap-to-talk button | e2e | PASS |
| F03-H1 | F03 Talkback & Audio channel strips | happy | Host opens Mixer Popover, toggles Talkback / DAW mute, adjusts fader | Visual fader groove and gain db indicators update smoothly without layout shift | e2e | PASS |
| F03-E1 | F03 Push-to-talk | edge: keyboard spacebar hotkey | Focus session room, press & hold Spacebar | Talkback indicator switches to active green, auto-ducking DAW level | e2e | PASS |
| F04-H1 | F04 Remote DAW screen control | happy | Guest clicks "Request Control", host receives notification, host grants | Control status transitions to 'granted', remote cursor visual cue enabled | e2e | PASS |
| F04-E1 | F04 Screen control handshake | edge: host denies control request | Guest requests control, host clicks Deny | Status resets to 'none', guest notified with polite feedback | e2e | PASS |
| F05-H1 | F05 Stem drag-and-drop & audio upload | happy | Select stem WAV/FLAC file in stem drawer, trigger upload | File uploaded via presigned URL, added to session files table, appears in stem list | e2e | PASS |
| F05-N1 | F05 Stem file validation | negative: upload unauthorized file type (exe/sh) | Send `.exe` payload to `/api/sessions/[slug]/files/presign` | Rejected with 400 Bad Request: "Unsupported file type" | e2e | PASS |
| F05-N2 | F05 Stem file quota | negative: file exceeds 250MB limit | Presign file with size 300,000,000 bytes | Rejected with 400 Bad Request: "File exceeds 250MB limit" | e2e | PASS |
| S01-H1 | Billing & Stripe integration | happy | Trigger checkout for Pro tier | Redirects to Stripe Checkout session with valid session URL | e2e | PASS |
| S01-N1 | Webhook idempotency | negative: replay duplicate Stripe webhook | Deliver same Stripe event id twice to `/api/webhooks/stripe` | First returns 200 (processed), second returns 200 with `{ received: true, deduplicated: true }` | e2e | PASS |
| A11Y-01 | Accessibility scan | a11y: axe-core scan on core screens | Run `@axe-core/playwright` on `/`, `/session/:slug`, `/guest/:slug` | 0 critical accessibility violations | e2e | PASS |
