# S2DIO

Real-time, lossless audio collaboration platform for music producers, mix engineers, vocalists, and clients.

S2DIO connects your digital audio workstation (DAW) directly to a private control room. You stream pristine stereo master bus audio with zero lag and zero lossy speech-codec compression. Collaborators join directly in their web browser without installing a DAW, plugins, or creating an account.

---

## Architecture & Data Flow

```
[Producer DAW (FL Studio, Ableton, Cubase, Studio One, Reaper)]
       │
       ▼ (Lossless 48kHz 32-bit Float Audio via Master Bus)
[S2DIO Master Bridge VST3]
       │
       ▼ (Local binary stream on 127.0.0.1:4949)
[S2DIO Windows Control Room Desktop App]
       │
       ▼ (Encrypted WebRTC Peer-to-Peer + 60fps DAW Screen Share)
[Collaborator Browser (Chrome, Safari, Firefox, Edge on Windows/macOS/iOS/Android)]
```

1. **For the Producer (Host)**:
   - Run the 1-click installer: `S2DIO-Windows-Setup.exe`.
   - Place `S2DIO Master Bridge` VST3 on your Master mixer channel.
   - Launch `S2DIO` desktop app from your desktop or start menu.
   - The engine automatically binds to local port `:4949` and locks the master audio stream.

2. **For the Collaborator (Guest)**:
   - Click the private room invite link sent by the producer.
   - Join instantly in any browser with zero installation or account requirements.
   - Hear uncompressed 48kHz stereo master bus audio in real time.
   - Talk back using push-to-talk (with automatic DAW music ducking), exchange WAV stems, or request interactive screen co-pilot control.

---

## Core Capabilities

- **Lossless Float32 Master Audio**: Intercepts 48kHz 32-bit floating point audio directly inside `processBlock()` and streams binary PCM chunks via local loopback. Sub-5ms internal buffer latency.
- **Native Windows Control Room (.exe)**: High-performance desktop host app with hardware-accelerated WebView2 engine and system tray integration.
- **60fps DAW Screen Share**: High-definition, low-latency screen streaming designed for timelines, piano rolls, and third-party plugin GUIs.
- **Zero-Install Collaborator Access**: Collaborators join via Chrome, Safari, Firefox, or Edge. No DAW, audio drivers, or software installation needed.
- **Smart Talkback Ducking**: Auto-ducking talkback channel attenuates DAW playback by -12dB when speaking and snaps smoothly back to unity gain.
- **Remote DAW Screen Control**: Collaborators can request interactive mouse/keyboard co-pilot control with instant ESC revoke by host.
- **Stem & File Exchange**: Drag-to-DAW stem transfer zone supporting uncompressed WAV, AIFF, and MIDI files.
- **Live Hardware-Calibrated Metering**: Real-time dual RMS and peak stereo VU meters calibrated to digital full-scale (dBFS) with clip detection.
- **Producer Profiles & Online Friends**: Custom producer badges, telemetry stats, and 1-click room invites to online producer friends.
- **ReactBits UI System**: Modern, responsive dark obsidian interface powered by ReactBits SpotlightCard, Accordion FAQ, and technical studio grid backgrounds.

---

## Windows Installation

### Option 1: 1-Click Installer (Recommended)
Download and run the installer:
- **`dist/S2DIO-Windows-Setup-v1.0.0.exe`** (or `public/downloads/S2DIO-Windows-Setup.exe`)
- Installs the native desktop app to `%ProgramFiles%\S2DIO`.
- Installs `S2DIO Master Bridge.vst3` directly to `%CommonProgramFiles%\VST3` for FL Studio, Ableton Live, Cubase, Reaper, and Studio One.
- Creates Desktop and Start Menu shortcuts.
- Includes automated clean-slate wipe to ensure zero conflicts with older builds.

### Option 2: Clean-Slate Uninstaller
If you ever want to perform a 100% clean reset:
- Run `public/downloads/Clean-Slate-Uninstall.bat` as Administrator.
- Wipes all installed files, registry shortcuts, and local application cache cleanly.

---

## Tech Stack

- **Desktop Application**: .NET 9 WinForms with Microsoft WebView2 Core, Win32 raw input and low-latency audio loopback.
- **Frontend & Web Portal**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, ReactBits components.
- **Audio Processing**: Web Audio API (AudioContext, AnalyserNode, ChannelSplitter, GainNode), 32-bit float PCM streamer.
- **Plugin Architecture**: JUCE 8, C++20, universal 64-bit VST3 bundle with IXWebSocket RFC 6455 binary frame support.
- **Database & Storage**: Supabase (PostgreSQL with RLS, storage buckets for stem sharing).
- **Installer**: Inno Setup 6 with x64 solid LZMA2 compression.

---

## Development & Building

### 1. Web Application
```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

### 2. Desktop Application (.NET 9)
```bash
dotnet publish desktop-app/desktop-app.csproj -c Release -r win-x64 --self-contained false -o dist/app
```

### 3. VST3 Plugin (C++ / CMake)
```bash
cd vst3
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

### 4. Windows Installer (Inno Setup)
```bash
"C:\Users\<user>\AppData\Local\Programs\Inno Setup 6\ISCC.exe" installer\S2DIO.iss
```

---

## License

MIT License. See LICENSE for details.
