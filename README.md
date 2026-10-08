# S2DIO

Real-time audio collaboration for music producers and collaborators.

S2DIO connects your digital audio workstation (DAW) to a private web room. You stream pristine stereo master bus audio directly to clients, vocalists, or co-producers with zero lag. Collaborators join directly in their web browser without installing a DAW, plugins, or creating an account.

---

## How It Works

```
[Producer DAW]
       │
       ▼ (Lossless 48kHz Stereo Audio)
[S2DIO Master Bridge VST3]
       │
       ▼ (Local binary WebSocket on 127.0.0.1:4949)
[Host Browser Studio Room]
       │
       ▼ (Encrypted WebRTC Peer-to-Peer)
[Collaborator Browser (Any device, anywhere)]
```

1. **For the Producer (Host)**:
   - Place the `S2DIO Master Bridge` VST3 plugin on your Master channel in Ableton Live, FL Studio, Logic, Reaper, or Studio One.
   - Open your studio session link in the browser.
   - Hit play in your DAW. The web room immediately locks to the stream.

2. **For the Collaborator (Guest)**:
   - Open the invite link in any modern browser (Chrome, Safari, Firefox, Edge on macOS, Windows, iOS, or Android).
   - Type your name and click **Start Listening**.
   - Hear uncompressed 48kHz stereo master bus audio in real time.
   - Talk back using push-to-talk, send notes in the side drawer, drag and drop stems, or request DAW screen control.

---

## Core Capabilities

- **Lossless DAW Stream**: Intercepts 48kHz 32-bit float audio directly inside `processBlock()` and streams binary PCM chunks via local loopback.
- **Zero-Install Collaborator Access**: Collaborators only need a browser. No DAW, no audio drivers, and no account needed.
- **Push-to-Talk with Smart Ducking**: Talkback microphone channel with automatic -12dB music ducking prevents audio feedback.
- **Stem & File Exchange**: Drag and drop WAV, AIFF, and MIDI stems directly inside the session drawer with presigned storage uploads.
- **Live Hardware-Calibrated Metering**: Real-time dual RMS and peak stereo VU meters calibrated to digital full-scale (dBFS).
- **Remote DAW Screen Control**: Guests can request interactive control with single-click host approval.

---

## Tech Stack

- **Frontend & Web Engine**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Audio Processing**: Web Audio API (AudioContext, AnalyserNode, ChannelSplitter, GainNode)
- **Plugin Architecture**: JUCE 8, C++20, IXWebSocket (RFC 6455 binary frame streaming)
- **Database & Storage**: Supabase (PostgreSQL with Row Level Security, Storage Buckets)
- **Payments (Optional)**: Stripe Checkout & Billing Portal

---

## Getting Started

### 1. Web Application

Clone the repository and install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build and run for production:

```bash
npm run build
npm start
```

Visit `http://localhost:3000` to launch a new studio room.

---

### 2. Native VST3 Plugin

Pre-compiled plugin binaries for Windows are located in the `dist/` directory:
- `dist/S2DIO Master Bridge.vst3` (VST3 bundle)
- `dist/S2DIO Master Bridge.exe` (Standalone test app)

To install manually on Windows:
Copy `dist/S2DIO Master Bridge.vst3` to your system VST3 directory:
```
C:\Program Files\Common Files\VST3\
```

#### Building the Plugin from Source

Requirements:
- CMake 3.22 or higher
- Visual Studio 2022 with C++ desktop workload (or Clang on macOS)

```bash
cd vst3
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

The build automatically pulls JUCE 8 and IXWebSocket via CMake FetchContent. Output binaries are generated in `vst3/build/S2DioBridge_artefacts/Release/`.

---

## License

MIT License. See LICENSE for details.
