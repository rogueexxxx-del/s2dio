# Architecture: StudioCollab (a rebuild of Muse Sessions' core features with VST3 Bridge)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web & client | Next.js (App Router) + TypeScript + Tailwind CSS | Fast SSR for guest links, rich interactive Web Audio / WebRTC client, easy to wrap in Tauri/Electron for desktop |
| VST3 bridge plugin | Rust (`nih-plug`) or C++ (JUCE VST3) | Sits on DAW Master bus. Transmits 24/32-bit float audio directly to local client over zero-latency IPC (`ws://127.0.0.1:4949`). Completely avoids installing buggy virtual audio cable drivers |
| realtime media | WebRTC via LiveKit SFU (or Cloudflare Calls) | Low-latency SFU supporting multi-track separation: dedicated 320kbps stereo Opus channel for DAW audio + 32kbps mono AEC channel for talkback mic |
| database | Postgres on Supabase | Managed, relational integrity, native Row Level Security (RLS), instant Realtime events for chat & mixer states |
| auth | Supabase Auth (Email OTP + Google) | Managed session cookies, zero boilerplate, seamless integration with Postgres RLS policies |
| storage | Supabase Storage (S3-compatible) | Fast presigned uploads for lossless stems, session WAVs, and MIDI files |
| payments | Stripe Checkout & Customer Portal | Standard subscription management (Starter, Pro Flex, Pro Unlimited) and webhook provisioning |
| hosting | Vercel (Web/API) + LiveKit Cloud (SFU) | Global edge distribution, automated deployments, zero devops overhead |

---

## The VST3 Audio Pipeline Architecture

Instead of fighting OS kernel audio drivers, multi-output device drift, and feedback loops, **we lean into a dedicated VST3 plugin**:

```
+-----------------------------------------------------------------------------------+
| PRODUCER'S COMPUTER                                                               |
|                                                                                   |
|  +------------------------+             Local IPC                                 |
|  | Any DAW                |          (WebSocket/RingBuf)                          |
|  | (Ableton, FL, Logic...) |          ws://127.0.0.1:4949                          |
|  |                        |                                                       |
|  | [Master Bus]           |                                                       |
|  |    v                   |       PCM Float32 (48kHz)                             |
|  | [StudioCollab VST3]----+----------------------------------+                   |
|  +------------------------+                                  |                   |
|                                                              v                   |
|  +-----------------------------------------------------------------------------+ |
|  | StudioCollab App (Web or Tauri Desktop Shell)                               | |
|  |                                                                             | |
|  |  [Talkback Mic] ---------> Echo Canceller (AEC) -------> WebRTC Voice Track | |
|  |                                                              (32kbps Mono)  | |
|  |                                                                             | |
|  |  [VST3 Local Stream] ----> Resampler / Jitter Buffer --> WebRTC Music Track | |
|  |                                                              (320kbps Opus) | |
|  +----------------------------------------------------------------+------------+ |
+-------------------------------------------------------------------|---------------+
                                                                    |
                                                  Encrypted WebRTC  | (SRTP / UDP)
                                                                    v
                                                     +------------------------------+
                                                     | LiveKit Media SFU            |
                                                     +--------------+---------------+
                                                                    |
                                                                    v
+-----------------------------------------------------------------------------------+
| COLLABORATOR / GUEST (Browser or Desktop App)                                     |
|                                                                                   |
|   +----------------------------------------------------------------------------+  |
|   | StudioCollab Guest Portal / Desktop App                                    |  |
|   |                                                                            |  |
|   |   WebRTC Music Track ------> AudioContext Destination (Headphones/Monitors)|  |
|   |   WebRTC Voice Track ------> AudioContext Destination (Headphones)         |  |
|   |   WebRTC Screen Share -----> 60fps Canvas / Remote Input Handler           |  |
|   |                                                                            |  |
|   |   (Optional Receiver VST3 in collaborator's DAW to record audio into track)|  |
|   +----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Key Advantages of Leaning into VST3:
1. **Zero Virtual Audio Cables**: No need for BlackHole, VB-Cable, or complex aggregate devices in Mac Audio MIDI Setup.
2. **True Master Capture**: What the producer hears in the DAW is bit-accurately sent to the session before computer system notifications or voice chat can contaminate it.
3. **No Feedback Loops**: The collaborator's voice coming through the producer's headphones never touches the DAW master bus, eliminating feedback by design.
4. **Bi-Directional**: In "Receiver" mode, a collaborator can drop the VST3 onto an audio track in *their* DAW to record incoming audio passes directly into their arrangement.

---

## Schema

See [replica/schema.sql](file:///h:/OPENCODE/replica/schema.sql).
- **Tables (6)**: `profiles`, `sessions`, `session_participants`, `session_messages`, `session_files`, `subscriptions`.
- **Access Rules**: Postgres Row Level Security (RLS) on all tables. Authenticated users manage own profile and sessions; guests can view active session metadata and participant rosters.

---

## API

### F01: Host creates room & streams DAW audio
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `POST /api/sessions` | Creates studio room & mints VST3 token | Authenticated | `{ title, audioQuality, maxCollaborators }` | `{ id, slug, vst3SessionToken }` | F01 |
| `GET /api/sessions/:slug` | Retrieves session config & status | Public (Host/Guest) | `slug` | Session record + participant limits | F01, F02 |
| `POST /api/sessions/:slug/token` | Mints LiveKit WebRTC connection token | Participant | `{ participantName, role }` | `{ livekitToken, wsUrl }` | F01, F02 |
| `WS ws://127.0.0.1:4949/vst` | Local loopback bridge from VST3 | Local DAW Plugin | `{ token, pcmBuffer, sampleRate }` | `{ ack, status }` | F01 |

### F02: Guest joins via shareable web link
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `POST /api/sessions/:slug/join` | Registers participant in room roster | Anonymous or Auth | `{ guestName }` | `{ participantId, role }` | F02 |
| `POST /api/sessions/:slug/leave` | Marks participant left / cleanup | Session member | `{ participantId }` | `{ success: true }` | F02 |

### F03: Remote vocalist tracks audio into Producer's DAW
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `POST /api/sessions/:slug/record/start` | Initiates multi-track server recording | Host | `{ armedStreams: [] }` | `{ recordingId, status }` | F03 |
| `POST /api/sessions/:slug/record/stop` | Finalizes recording and writes WAV | Host | `{ recordingId }` | `{ fileUrl, duration }` | F03 |

### F04: Remote producer requests DAW screen control
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `POST /api/sessions/:slug/control/request` | Requests remote screen control | Collaborator | `{ targetParticipantId }` | `{ requestId, status: "pending" }` | F04 |
| `POST /api/sessions/:slug/control/respond` | Accepts or rejects control request | Host | `{ requestId, granted: boolean }` | `{ status }` | F04 |
| `WS WebRTC DataChannel [input]` | Sends mouse move/click & hotkeys | Granted controller | `{ x, y, button, key, type }` | Injected into OS accessibility API | F04 |

### F05: Drop stem or MIDI into chat and import into DAW
| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `POST /api/sessions/:slug/files/presign` | Returns presigned upload URL | Session member | `{ fileName, fileSizeBytes, mimeType }` | `{ uploadUrl, fileId, path }` | F05 |
| `POST /api/sessions/:slug/files/complete` | Confirms file upload & checks storage | Session member | `{ fileId }` | `{ sessionFile }` | F05 |
| `GET /api/sessions/:slug/files` | Lists downloadable session assets | Session member | none | `session_files[]` | F05 |

### Webhooks & Background Jobs
- `POST /api/webhooks/stripe`: Handles `customer.subscription.created`, `updated`, and `deleted` events to update user tier in `profiles` and `subscriptions`.
- **Hourly Cron Job (`cron-session-expiry`)**: Checks active sessions with `is_permanent = false` and terminates sessions that have exceeded their tier duration limit (45 minutes for Starter).

---

## The parts that bite

- **Sample Rate Mismatches (44.1kHz vs 48kHz)**: DAWs frequently operate at 44.1kHz, while WebRTC's Opus codec strictly operates at 48kHz. The VST3 plugin or local IPC layer must implement a polyphase high-quality Sinc resampler (using `rubato` in Rust or `juce::LagrangeInterpolator`) to prevent pitch shifting and metallic comb filtering.
- **ASIO Exclusivity on Windows**: On Windows, DAWs taking exclusive ASIO ownership of an audio interface prevent the web browser or desktop app from playing back audio. The VST3 bypasses this: all DAW audio is routed internally through VST3 buffers into the app, which can output via standard WASAPI Shared Mode.
- **Echo & Monitor Bleed**: Even with headphones, loud monitoring can bleed into vocal microphones. The talkback channel must use standard WebRTC AEC (Acoustic Echo Cancellation) + Noise Suppression, while the DAW music channel must strictly disable AEC to preserve full audio fidelity and bass response.
- **Screen Control Coordinate Scaling**: Multi-monitor setups with mixed DPI (e.g. 4K screen scaled at 150% alongside a 1080p screen) will cause remote clicks to miss plugin knobs. Mouse events must be normalized as relative float ratios `(x / width, y / height)` and projected onto the targeted application window bounds.
- **Webhook Idempotency**: Stripe webhook events can be delivered multiple times. The webhook handler must verify `event.id` against a deduplication table before updating subscription status.

---

## Build order

### Milestone 1: Vertical Slice (The Core Audio Loop)
- **Objective**: Prove the core value proposition: host plays DAW track via VST3, guest hears high-fidelity stereo audio in browser with <100ms latency.
- **Screens**: [S02 (Dashboard)](file:///h:/OPENCODE/replica/recon.md#screens), [S03 (Room)](file:///h:/OPENCODE/replica/recon.md#screens), [S08 (Guest Portal)](file:///h:/OPENCODE/replica/recon.md#screens).
- **Tables**: `profiles`, `sessions`, `session_participants`.
- **Routes**: `POST /api/sessions`, `GET /api/sessions/:slug`, `POST /api/sessions/:slug/token`, `WS ws://127.0.0.1:4949/vst`.
- **VST3 Deliverable**: Minimal transmitter plugin sending stereo Float32 PCM to localhost WebSocket.

### Milestone 2: Must-Haves (Mixer, Voice Talkback & Video)
- **Objective**: Add video tiles, talkback push-to-talk channel with AEC, and the Audio Mixer Sidebar.
- **Screens**: [S04 (Mixer Sidebar)](file:///h:/OPENCODE/replica/recon.md#screens), [S05 (Audio/Device Settings)](file:///h:/OPENCODE/replica/recon.md#screens), [S07 (Chat & File Sharing)](file:///h:/OPENCODE/replica/recon.md#screens).
- **Tables**: `session_messages`, `session_files`.
- **Routes**: `POST /api/sessions/:slug/files/presign`, `POST /api/sessions/:slug/files/complete`.

### Milestone 3: Should-Haves (60fps Screen Share & Remote Control)
- **Objective**: Implement screen sharing optimized for DAW timeline viewing and interactive mouse control of DAW plugins.
- **Screens**: [S06 (Screen Share & Remote Control)](file:///h:/OPENCODE/replica/recon.md#screens), [S10 (Multi-Track Recorder)](file:///h:/OPENCODE/replica/recon.md#screens).
- **Deliverable**: Native desktop helper for OS input injection (Tauri `enigo` or node-native) + WebRTC DataChannel input sync.

### Milestone 4: Billing, Boosts & Commercial Polish
- **Objective**: Implement tiered session limits, temporary 1-hour session boosts, and Stripe subscriptions.
- **Screens**: [S01 (Auth)](file:///h:/OPENCODE/replica/recon.md#screens), [S09 (Invite & Limits Modal)](file:///h:/OPENCODE/replica/recon.md#screens).
- **Tables**: `subscriptions`.
- **Routes**: `POST /api/webhooks/stripe`, `POST /api/sessions/:slug/boost`.
