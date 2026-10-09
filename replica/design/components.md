# Component Specifications: S2DIO Hardware Studio System

This document specifies the core UI primitives, audio console modules, and interaction components for **S2DIO**, locked to the design tokens in [tokens.json](file:///h:/OPENCODE/replica/design/tokens.json) and [tokens.css](file:///h:/OPENCODE/replica/design/tokens.css).

Every component reflects a **hardware studio rack console**: deep obsidian matte finishes, precision hairlines, hardware LED indicators, monospace telemetry readouts, low-latency responsiveness, and complete keyboard/a11y accessibility.

---

### 1. Button
- **variants**:
  - `primary`: Solid white background (`#ffffff`), pitch black text (`#000000`), tactile press (`#e8e8e8`).
  - `secondary`: Dark surface-elevated fill (`#121316`), hairline border (`#22242a`), crisp off-white text (`#f4f4f6`).
  - `pill`: Rounded-full badge button (`#121316` fill, `#22242a` border) with live status dot.
  - `danger`: Red border & text (`#ff6161`), active red fill on trigger.
  - `ghost`: Transparent background, hover to `#121316`.
- **sizes**:
  - `sm`: Height 28px, font 11px, px 10px, radius 6px
  - `md`: Height 36px, font 12px, px 14px, radius 6px
  - `lg`: Height 44px, font 13px, px 20px, radius 8px
- **states**:
  - `default`: Base elevation with hairline border.
  - `hover`: Surface lightens, border brightens to hairline-strong.
  - `active / pressed`: Scale 0.98, opacity 90%.
  - `focus-visible`: 2px outline in accent green (`#59d499`) with 2px offset.
  - `disabled`: Opacity 40%, cursor not-allowed, pointer-events none.
  - `loading`: Label preserved with aria-busy="true" and 12px spinner.
- **tokens**: bg `primary` / `surface-elevated`, text `ink`, border `hairline`, radius `sm` / `pill`, font `sans 12/500`.
- **a11y**: Native `<button>`, explicit `aria-label` for icon-only buttons, Space/Enter activation.
- **used on**: Top bar, dock, landing page, modals, stem exchange.

---

### 2. TopNavigationBar
- **layout**: Fixed 64px header, max-w-6xl centered framing, obsidian background with bottom hairline border.
- **modules**:
  - Left: Authentic S2DIO Monogram Vector Logo + Local Loopback Ingest Badge (`:4949 Ingest`, pulse green dot).
  - Center/Right: Pipeline Telemetry (`48kHz VST3 Pipeline`, font mono 11px).
  - Session Controls: `Schedule` (calendar intent), `Friends [online]`, `Collaborator`.
  - Primary Action: `Copy Invite Link` (solid white button).
  - Far Right: `Producer [Host]` profile pill button with online status indicator.
- **states**:
  - `standalone-host`: Ingest badge glowing green, Producer pill active.
  - `collaborator-connected`: Guest pill illuminated with live ping.
  - `link-copied`: Feedback changes text to "✓ Copied" for 2000ms.
- **tokens**: bg `bg`, border `border`, height `64px`, font `sans` & `mono`.
- **used on**: Studio Desktop App, Web Session Viewport.

---

### 3. FloatingZenDock
- **layout**: Floating bottom toolbar (`bottom: 24px`, centered horizontally, max-w-fit).
- **styling**: Acrylic backdrop blur (20px), obsidian surface (`rgba(13, 13, 13, 0.95)`), hairline-strong border (`rgba(255, 255, 255, 0.16)`), 12px radius, 40px drop shadow.
- **modules**:
  1. `TALKBACK (PTT)`: Primary tactile button with Spacebar shortcut badge.
  2. `Share DAW`: Screen share toggle (60fps desktop capture).
  3. `Camera`: Studio webcam toggle.
  4. `Record`: Multi-track stem capture button with pulsing tally light.
  5. `Record Options`: Format (Lossless WAV Float32, WebM Opus 320k/192k) & Stem routing toggle.
  6. `Takes (N)`: Inventory badge for recorded stems.
  7. `Play Demo`: 440Hz test tone & VU calibration generator.
  8. `Mixer Trims`: Popover trigger for vertical fader console.
  9. `Notes & Stems`: Slide-over drawer toggle.
  10. `Engine`: VST3 loopback and buffer configuration.
- **states**:
  - `idle`: Muted grey icons and labels.
  - `active / recording`: Red highlight (`#ff6161`) with live timer (`REC 1:24`).
  - `talking`: Glowing red PTT button with DAW master ducking active.
- **tokens**: bg `surface`, border `border-strong`, shadow `dock`, radius `lg`.
- **used on**: Studio Desktop App, Web Session Viewport.

---

### 4. PushToTalkButton (Smart Talkback & Ducking)
- **behavior**:
  - Global hotkey: Press & hold **Spacebar** anywhere in the app to talk.
  - Mouse: Click & hold.
  - Automated Ducking: When active, instantaneously attenuates the DAW master stream by -12dB (configurable -6dB to -24dB) to guarantee voice intelligibility over loud arrangements.
- **states**:
  - `released`: Dark charcoal background (`#18191a`), white text, muted shortcut badge `SPACE`.
  - `talking`: Flashing red background (`#ff6161`), white text, box-shadow red glow.
- **tokens**: bg `#18191a`, active `danger`, font `sans 12/600`, radius `sm`.
- **a11y**: Hotkey suppressed when typing in input or chat fields; screen reader announces "Talkback mic open / closed".
- **used on**: Floating dock, Channel strip.

---

### 5. StereoVUMeter (Hardware VU Ladder)
- **layout**: Dual vertical LED columns (Left / Right) with 20 segments per channel.
- **scale**:
  - `-48 dB` to `-12 dB`: Studio Green (`#59d499`) - Healthy dynamic signal.
  - `-12 dB` to `-3 dB`: Headroom Amber (`#ffd60a`) - Energetic transient peaks.
  - `-3 dB` to `0 dB+`: Clip Red (`#ff6161`) - Digital saturation warning.
- **ballistics**: 80ms decay curve matching analog hardware ballistics, 1200ms peak-hold marker.
- **readout**: Real-time numeric decibel monitor (e.g. `-14.2 dB`, font mono 11px).
- **tokens**: bg `#18191a`, lit `accent-green` / `warning` / `danger`, font `mono`.
- **used on**: Ingest Card, Mixer Console, Video floating HUD.

---

### 6. VerticalChannelStrip (Hardware Mixer Faders)
- **layout**: 110px vertical hardware strip module containing:
  - Top: Channel Name (`Master DAW`, `Talkback`, `Collaborator`) + Subtitle (`VST3 Ingest`, `Mic In`, `Remote Web`).
  - Controls: Mute (`M`, active red) and Solo (`S`, active white) buttons.
  - Center: 150px vertical fader track with center groove, silver/white fader cap, and parallel LED meter ladder.
  - Bottom: High-precision numeric decibel readout (`0.0 dB`, font mono 11px).
- **fader law**: Logarithmic gain scaling: min 0.0 (-inf), unity 1.0 (0.0dB), max 1.41 (+3.0dB boost).
- **tokens**: bg `surface-card`, border `hairline`, fader height `150px`, radius `md`.
- **a11y**: Standard slider role with keyboard arrow up/down (0.5dB step) and shift-arrow (2dB step).
- **used on**: Mixer Console Popover.

---

### 7. DAWScreenViewport & Co-Pilot Remote Control
- **layout**: Responsive 16:9 canvas with hardware letterboxing and zero black-bar distortion.
- **overlays**:
  - Live HUD: Floating red dot + "DAW Screen Live • 60fps".
  - Floating Remote Control Toolbar: Toggle Remote Control (ON/OFF), Grant Control to Guest, Revoke (ESC).
  - Co-Pilot Cursor Layer: Distinct red cursor with guest identifier tag and click ripple animation.
  - PiP (Picture in Picture): Draggable studio webcam inset.
- **safety & security**: Remote input disabled by default; host can revoke control instantly at any millisecond with **ESC**.
- **tokens**: bg `#000000`, border `hairline`, cursor `danger`.
- **used on**: Studio Stage Viewport.

---

### 8. SlideOverDrawer
- **layout**: Right-hand slide-over drawer (`width: 340px`, fixed height 100vh, z-index 50).
- **navigation**: Top tab bar switching between:
  - `Notes (N)`: Real-time collaborative session scratchpad with markdown formatting.
  - `Stems (N)`: Drag-and-drop WAV/AIFF/MIDI exchange zone with direct drag-to-DAW handle.
  - `Friends (N)`: Online collaborator roster with direct studio invite button.
- **animation**: 200ms cubic-bezier(0.16, 1, 0.3, 1) slide-in from right.
- **tokens**: bg `surface`, border-left `hairline`, width `340px`, shadow `-16px 0 40px rgba(0, 0, 0, 0.85)`.
- **used on**: Studio Desktop App.

---

### 9. ScheduleModal
- **layout**: 420px centered dialog, dark acrylic overlay (`rgba(0, 0, 0, 0.75)` with 8px blur).
- **fields**:
  - Session Title input (obsidian background, white text).
  - Date & Time inputs: Native dark mode (`color-scheme: dark;` with `#121316` background).
  - Duration selector pills: 30m, 60m, 2h (subtle green glow on active).
  - Room URL preview box with monospace green link.
- **actions**:
  - `Export .ICS File`: Downloads RFC 5545 compliant `.ics` calendar invitation for Apple/Outlook/Google.
  - `Google Calendar ↗`: One-click browser intent URL.
  - `Copy Invite Message`: Clean formatted clipboard text without emojis.
- **tokens**: bg `surface`, border `hairline`, radius `xl`, shadow `modal`.
- **used on**: Desktop App, Web Session, Landing Page.

---

### 10. RecordOptionsModal
- **layout**: 420px dialog configuring recording engine parameters.
- **selectors**:
  - Format / Quality:
    - `Lossless WAV (Float32 / 48.0 kHz)`: Uncompressed 32-bit float broadcast WAV.
    - `WebM Opus (320 kbps)`: High-bitrate studio stream.
    - `WebM Opus (192 kbps)`: Compact transfer.
  - Stem Routing:
    - `Master + Vocals`: 2 separate synchronized stem files.
    - `Master Bus Only`: DAW playback stream only.
    - `Vocals Only`: Topline microphone stem only.
- **tokens**: bg `surface`, border `hairline`, radius `xl`.
- **used on**: Studio Desktop App.

---

### 11. SpotlightCard (ReactBits Technical Hardware Card)
- **layout**: Elevated card with dynamic cursor-following radial spotlight illumination.
- **behavior**: Tracks cursor mousemove within card boundary, rendering an 8% opacity accent-green radial wash.
- **tokens**: bg `surface`, border `hairline`, spotlight `rgba(89, 212, 153, 0.08)`, radius `lg` (10px).
- **used on**: Landing Page (How S2DIO Works, Features Grid).

---

### 12. TechnicalAccordion (ReactBits FAQ)
- **layout**: Full-width collapsible rows with smooth height interpolation.
- **styling**: Surface-elevated rows (`#121316`), hairline border, off-white question text, crisp muted body text.
- **a11y**: Full WAI-ARIA Accordion pattern (`aria-expanded`, `aria-controls`, `role="region"`, arrow key navigation).
- **tokens**: bg `surface-elevated`, border `hairline`, text `ink`, radius `md`.
- **used on**: Landing Page FAQ Section.
