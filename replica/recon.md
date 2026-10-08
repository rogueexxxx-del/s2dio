# Recon map: Muse Sessions (Desktop macOS/Windows + Web Guest)

Scope: The real-time virtual studio session (high-fidelity DAW audio stream, talkback mic, webcam video, 60fps DAW screen sharing, remote DAW screen control, real-time MIDI sync, and stem/file drop).
For: Music producers, recording engineers, vocalists, songwriters, and beatmakers collaborating remotely without audio dropouts, feedback loops, or complex routing friction.
Date: 2026-10-07

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Marketing Homepage | https://musesessions.co/ | Core value proposition, feature breakdown, platform downloads |
| 2 | Pricing & Plan Comparison | https://musesessions.co/plans | Feature gating (session limits, audio bitrates PCM 32-bit vs Opus, collaborator limits, boosts) |
| 3 | FAQ & Knowledge Base | https://musesessions.co/faq | Echo/feedback causes, loopback configuration, driver & hardware workarounds |
| 4 | Video Tutorial Breakdown | https://musesessions.co/tutorials | In-depth flow analysis: Mac/Win audio share, plugin vs virtual driver, MIDI sync, screen control |
| 5 | Spark AI Plugin Page | https://musesessions.co/spark | Add-on chord generator plugin (evaluated for scope boundary) |
| 6 | Technical Community Reviews | Reddit (r/audioengineering, r/edmproduction) & Audiomovers comparisons | Real-world latency constraints, DAW integration pain points |

## Core loop

Producers host a low-latency virtual studio room where collaborators hear DAW playback in uncompressed high-fidelity stereo alongside video and talkback mic—tweaking tracks in real-time as if sitting in the same control room.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Auth & Landing Hub | `/login`, `/sign-up`, Desktop launch | Authenticate user, check active subscription tier | Email/OAuth form, SSO button, trial/boost status banner | Empty, Error (bad auth), Loading |
| S02 | Studio Dashboard | `/dashboard`, App Home | Start instant session, schedule future session, view past rooms | "New Session" CTA, "Join with Code/Link", Scheduled Sessions list, Audio test card | Empty (no scheduled), Populated, Upgrading tier |
| S03 | Studio Room (Main Canvas) | `/session/:id` | Core collaboration workspace; video grid and shared DAW display | Stage canvas, floating toolbar, participant tiles, network quality indicator | Waiting for guests, Active session, Screen sharing mode, Audio-only |
| S04 | Audio Mixer Sidebar | Sidebar toggle in S03 | Control levels and routing for all audio streams independently | Channel strips (Host Mic, Host DAW, Guest Mics, Guest DAWs), Volume fader, VU meters, Mute, Solo, Push-to-Talk | Idle, Audio peaking, Muted, Solo active, Talkback active |
| S05 | Audio & MIDI Engine Settings | Modal from S03 / S04 gear icon | Audio driver, sample rate, buffer size, and MIDI device routing | Input/Output dropdowns (ASIO/CoreAudio/Loopback), Sample rate picker (44.1k/48k/96k), Buffer slider (64 to 1024 samples), MIDI In/Out toggles | Connected, Device missing, Drift correction warning, Feedback loop warning |
| S06 | Screen Share & Remote Control | Overlay on S03 | Select application window or full display; grant remote DAW control | Window picker grid, Framerate selector (30/60fps), "Request Control" button, "Revoke Control" banner | Request pending, Control active, Permission denied |
| S07 | In-Session Chat & File Transfer | Drawer toggle in S03 | Text chat, sharing reference MP3s, stems, and MIDI files | Message stream, drag-to-upload target, file card with "Drag to DAW" handle, upload progress | Empty chat, Uploading, Download ready, Transfer failed |
| S08 | Web Guest Portal | Link opened in web/mobile browser | Zero-install participant view for listening and feedback | Audio player canvas, Video grid, Chat drawer, "Mute Mic" button, "Join with Desktop App" banner | Loading stream, Live playback, Disconnected, Reconnecting |
| S09 | Invite & Session Link Modal | Modal from S03 header | Share session link, copy guest pass, configure permissions | Copy link button, QR code (mobile join), Participant limits counter, Boost session CTA | Copied toast, Free limit reached (upsell) |
| S10 | Multi-Track Session Recorder | Drawer / Modal in S03 | Record session audio, guest vocal inputs, and master mix | Track arm checkboxes, Record toggle, Timer, Storage quota bar, Export WAV button | Ready, Recording (blinking red), Quota full, Exporting |

## Flows

```
F01 Host creates room & streams DAW audio
    S02 dashboard -> S03 room -> S05 audio settings (select DAW bridge/loopback) -> S04 mixer un-mute DAW stream
    happy path clicks: 4
    edge: DAW driver lockup (ASIO exclusive mode), sample rate mismatch (44.1kHz vs 48kHz), loopback audio echo

F02 Guest joins via shareable web link
    Invite link -> S08 guest web portal -> browser mic permission -> S08 live listening
    happy path clicks: 2
    edge: Browser autoplay blocked (requires user gesture click), WebRTC ICE connection fails (firewall/NAT)

F03 Remote vocalist tracks audio into Producer's DAW
    S03 room -> Guest routes microphone in S04 -> Producer arms track on S10 (or DAW bridge) -> Producer triggers recording -> Guest sings -> Lossless audio received
    happy path clicks: 5
    edge: Jitter buffer underrun, latency too high for live monitoring (must use local hardware monitoring on guest side)

F04 Remote producer requests DAW screen control
    S03 room -> Host shares DAW window (S06) -> Remote guest clicks "Request Control" -> Host receives prompt and accepts -> Remote guest manipulates DAW sliders/plugins
    happy path clicks: 3
    edge: OS accessibility permissions missing, multi-monitor coordinate scaling mismatch, high round-trip latency

F05 Drop stem or MIDI into chat and import into DAW
    S07 chat drawer -> Drag WAV file from desktop into dropzone -> Collaborator sees file card -> Collaborator drags card straight into Ableton/Logic timeline
    happy path clicks: 2
    edge: File exceeds session storage quota (Starter tier 250MB limit), network drop during chunked upload
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| AudioChannelStrip | Talkback Mic, DAW Audio, Instrument, Remote Feed | Default, Muted, Soloed, Peaking, PTT active | S03, S04 |
| VUMeter | Stereo, Mono, Compact | -60dB to 0dB green-to-red gradient, clipping peak hold | S04, S05, S08 |
| PushToTalkButton | Floating bar, Channel strip, Spacebar hotkey | Released, Held (Active green), Disabled | S03, S04, S08 |
| ParticipantVideoTile | Host, Guest, Audio-only avatar | Video active, Cam muted, Speaking ring, Pin/Fullscreen | S03, S08 |
| ScreenShareCanvas | Fit, Stretch, 1:1 Pixel Mapping | Streaming 60fps, Remote cursor active, Control requested | S03, S06 |
| FileTransferCard | WAV, MIDI, Archive, Audio Preview | Uploading, Ready to drag, Downloading, Expired | S07 |
| AudioDeviceSelector | Input Device, Output Device, Driver Type | Available, Active, Disconnected / Fallback | S05 |
| SessionLimitBanner | Free tier countdown, Boost banner, Storage warning | Info, Warning (<5 min left), Expired modal | S03, S08, S09 |

## Inferred data model

```
User
    id, email, display_name, avatar_url, plan_tier ("starter" | "pro_flex" | "pro_unlimited" | "enterprise"),
    boost_balance, storage_used_bytes, created_at
    evidence: Pricing page tiers, S01 auth, boost mechanism (2 free boosts/month)
    confidence: high

Session
    id, host_user_id, slug / custom_link, status ("scheduled" | "active" | "ended"),
    max_collaborators, sample_rate (44100 | 48000 | 96000), audio_codec ("opus_hq" | "pcm_32"),
    scheduled_start_at, expires_at, storage_limit_bytes, is_permanent (bool)
    evidence: S02 dashboard, S05 audio settings, plans table ("Permanent sessions", "Channels 1-2 only")
    confidence: high

SessionParticipant
    id, session_id, user_id (nullable for anonymous guests), role ("host" | "collaborator" | "guest"),
    is_muted, is_talkback_active, screen_control_status ("none" | "requested" | "granted"),
    joined_at, left_at
    evidence: S03 room, S04 mixer controls, S06 remote control requests
    confidence: high

AudioStream
    id, session_id, participant_id, stream_type ("talkback_mic" | "daw_stereo" | "instrument_line"),
    sample_rate, channels (2 | 8 | 16), bitrate_kbps, is_active
    evidence: S04 mixer multiple devices per user, FAQ device allocation (2 on free, unlimited on Pro)
    confidence: high

ChatMessage
    id, session_id, sender_id, text, created_at
    evidence: S07 chatbox
    confidence: high

SharedFile
    id, session_id, uploader_id, file_name, file_size_bytes, mime_type, storage_url,
    is_stem_archive, created_at
    evidence: S07 chat file drop, plans storage limits (250MB free, 1GB flex, 5GB unlimited)
    confidence: high
```

Relationships:
- `User 1-n Session` (Host owns sessions)
- `Session 1-n SessionParticipant` (Multiple collaborators per room)
- `SessionParticipant 1-n AudioStream` (1 participant can stream both talkback mic and stereo DAW audio)
- `Session 1-n ChatMessage`
- `Session 1-n SharedFile`

## Feature matrix

See `replica/features.csv`.
- Must: 11 (Auth, Room creation, Web guest portal, Hi-Fi stereo DAW audio, Push-to-talk, Audio mixer, Echo cancellation, Audio config, Video grid, 60fps Screen share, Chat & stem drop)
- Should: 5 (Multi-track recording, Real-time MIDI, Screen control, Session scheduling, Storage tiers)
- Could: 2 (DAW VST3/AU bridge plugin, Enterprise breakout rooms / transcripts)
- Skip: 2 (Spark AI chord generator, Legacy OS 10.13 support)

## Out of scope (cannot or should not be cloned)

- **Proprietary Kernel-Level Audio Drivers**: Muse ships signed kernel drivers on macOS / Windows. For an independent clone, standard low-latency virtual audio cable protocols (BlackHole / Loopback on macOS, VB-Cable / WASAPI loopback on Windows) or a lightweight cross-platform VST3/AU plugin transmitter are much leaner and avoid driver signing complexity.
- **Spark AI Chord Generator**: A completely different generative MIDI product that Muse bundles. It does not belong to the core collaborative studio loop.
- **Legacy OS Versions**: macOS 10.13 to 11.x and Windows 7/8 support is deprecated baggage. Target modern macOS 12+ and Windows 10/11.
- **Hardware-based real-time synchronized jamming**: Over standard public internet, latency physics (20ms–80ms ping) prevent playing drums/piano live to a collaborator's live beat in zero-latency sync. Muse explicitly notes this in FAQ: it is a *studio control room* collaboration tool, not an impossible telepathic live jam.

## Size

- Screens: 10 screens / primary surfaces
- Flows: 5 core user journeys
- Entities: 6 core data models
- Hard parts:
  1. **Dual Audio Pipeline**: Running low-latency, echo-cancelled voice talkback (WebRTC Opus voice) simultaneously with high-bitrate, uncompressed or high-fidelity stereo DAW playback (Opus stereo 320kbps or raw WebRTC DataChannel PCM) without feedback loops.
  2. **Virtual Audio Capture / DAW Loopback**: Capturing DAW audio cleanly without capturing the collaborator's voice back into the DAW (isolation of monitor vs mix).
  3. **Low-Latency Screen & Remote Input Control**: Real-time 60fps screen share with responsive remote cursor and mouse click/drag injection for DAW plugin tweaking.

Size: **M (a few weeks)** for a clean, browser-compatible WebRTC desktop/web studio slice (using a browser/Electron shell with virtual audio cable or VST3 bridge); **L (a quarter)** if writing custom signed OS kernel audio drivers and multi-platform native VST3/AU/AAX plugins from scratch.
