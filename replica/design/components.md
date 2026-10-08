# Component Specifications: StudioCollab (Precision Audio Slate)

This document specifies the core UI primitives and audio controls for StudioCollab, mapped to the tokens in [tokens.json](file:///h:/OPENCODE/replica/design/tokens.json). Every component is designed specifically for dark studio environments: subtle borders, tactile feedback, monospace readouts, and accessible keyboard navigation.

---

### 1. Button
- **variants**: `primary` (accent fill, high-contrast text), `secondary` (surface-raised fill, border, white text), `ghost` (transparent, hover surface-raised), `danger` (danger outline/fill)
- **sizes**: `sm` (28px height, font xs), `md` (36px height, font sm), `lg` (44px height, font base)
- **states**: `default`, `hover`, `active`, `focus-visible` (2px ring in accent with 2px offset), `disabled` (opacity 40%, cursor not-allowed), `loading` (spinner with accessible aria-busy)
- **tokens**: bg `accent`, text `on-accent`, radius `sm`, font `sm/600`
- **a11y**: Native `<button>`, explicit `aria-label` when icon-only, keyboard activation on Space/Enter.
- **used on**: S01, S02, S03, S05, S08, S09

---

### 2. AudioChannelStrip (Mixer Fader & Bus)
- **variants**: `Host DAW Audio`, `Host Talkback Mic`, `Guest Feed`, `Instrument Input`
- **layout**: Vertical rack strip (width 72px) containing:
  - Top: Track Name label (font xs, uppercase, mono)
  - Status Pills: M (Mute, amber/red), S (Solo, cyan/blue), PTT (Push-to-Talk)
  - Center: Vertical Volume Fader with decibel markings (-inf to +6dB)
  - Flanking: Dual LED Stereo VU Meter (-60dB to 0dB) with peak-clip indicator
  - Bottom: Numeric gain readout (`-3.2 dB`, font xs, mono)
- **states**:
  - `idle`: Fader at unity (0.0dB), VU meter at floor (-60dB)
  - `signal`: Active dynamic audio response with green/amber LED segments
  - `clipping`: Red peak LED illuminates with 1.5s peak-hold
  - `muted`: Strip dims to 50% opacity, M button lights up red
  - `soloed`: S button pulses electric cyan, all other strips dim to 30%
- **tokens**: bg `surface`, border `border`, text `text`, font `mono`
- **a11y**: Fader uses `role="slider"`, `aria-valuenow`, `aria-valuemin="-60"`, `aria-valuemax="6"`, Arrow Up/Down adjusts by 0.5dB, Shift+Arrows adjusts by 2dB.
- **used on**: S03, S04

---

### 3. VUMeter
- **variants**: `Stereo` (L/R dual bar), `Mono` (single bar), `Mini` (inline strip badge)
- **scale**:
  - -60dB to -18dB: Green (`#10b981`) - Normal signal
  - -18dB to -3dB: Amber (`#f59e0b`) - Sweet spot / high energy
  - -3dB to 0dB+: Clip Red (`#f43f5e`) - Digital saturation warning
- **states**: `decaying` (80ms linear ballistics matching standard audio hardware), `peak-hold` (retains highest transient for 1200ms)
- **tokens**: bg `surface-raised`, border `border`, font `mono`
- **a11y**: `aria-live="polite"` with text summary ("Audio level: -12 dB") updated at low frequency for screen readers.
- **used on**: S04, S05, S08

---

### 4. PushToTalkButton (Talkback Controller)
- **variants**: `Toolbar Floating Pill`, `Channel Strip Header`, `Global Hotkey (Spacebar)`
- **states**:
  - `released`: Matte dark surface with subtle cyan border, text "TALK"
  - `pressed / active`: Glowing electric cyan background (`#38bdf8`), dark label, audible subtle ducking on DAW channel
  - `locked (Latch Mode)`: Double-click latches mic open with glowing active indicator
- **tokens**: bg `surface-raised`, active `accent`, border `border`, radius `pill`
- **a11y**: Supports `onKeyDown` (Spacebar hold) when not typing in chat; announces "Talkback mic open" / "Talkback mic muted".
- **used on**: S03, S04, S08

---

### 5. ParticipantVideoTile
- **variants**: `Active Speaker`, `Grid Tile`, `Audio-Only Avatar`, `Screen Share Focus`
- **states**:
  - `video-on`: 16:9 crisp WebRTC stream with participant name badge overlay
  - `video-muted`: Dark slate card with user initials in subtle monospace badge
  - `speaking`: 2px electric cyan perimeter glow (`shadow-glow-signal`) reacting to voice threshold
  - `pinned`: Expanded full-stage viewport
- **tokens**: bg `surface`, border `border`, radius `md`, shadow `panel`
- **a11y**: Fullscreen keyboard toggle (`f`), participant status readout ("John Doe - Talking, DAW Connected").
- **used on**: S03, S08

---

### 6. ScreenShareCanvas
- **variants**: `DAW Stage View`, `Plugin Pop-out View`
- **controls overlay**:
  - Zoom & Scale (`Fit to Screen`, `100% Native Pixels`)
  - Remote Control HUD: "Host granted screen control" / "Request Control" CTA
  - Latency & FPS Badge: `60 FPS | 24ms RTT` (font mono xs)
- **states**: `waiting`, `streaming`, `control-requested`, `control-active`
- **tokens**: bg `#000000`, border `border`, text `text-muted`
- **a11y**: Canvas allows focus, announces connection status and remote input mode.
- **used on**: S03, S06

---

### 7. FileTransferCard (Stem & Asset Drop)
- **variants**: `Audio WAV/FLAC`, `MIDI File`, `Zip/Session Archive`
- **components**:
  - Icon / Type Badge (`WAV 24-bit 48k`, `MIDI`)
  - File Name & Size (`Verse_Vocal_Lead.wav • 42.4 MB`)
  - Mini Waveform Preview (for audio files)
  - Action Handle: "DRAG TO DAW" (supports HTML5 drag-and-drop out of browser into desktop DAWs)
- **states**: `uploading` (linear progress bar in accent), `ready` (highlighted border), `downloading`, `error`
- **tokens**: bg `surface-raised`, border `border`, text `text`, font `mono`
- **a11y**: Download link fallback, keyboard accessible button.
- **used on**: S07

---

### 8. AudioDeviceSelector & BufferModal
- **variants**: `VST3 Status Card`, `Hardware Interface Dropdown`, `Sample Rate Selector`
- **components**:
  - Connection Indicator: "VST3 Plugin: CONNECTED (`ws://127.0.0.1:4949`)" with pulse dot
  - Sample Rate buttons: `44.1 kHz`, `48.0 kHz`, `96.0 kHz`
  - Buffer Size stepper: `64`, `128`, `256`, `512`, `1024` samples
  - Drift / Loopback Protection switch
- **states**: `detecting`, `connected`, `rate-mismatch-warning` (amber banner), `error`
- **tokens**: bg `surface`, border `border`, text `text`
- **a11y**: Trap focus within modal, close on `Esc`, announce connection changes.
- **used on**: S05
