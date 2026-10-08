# S2DIO Master Bus Audio Bridge (VST3 / AU / Standalone)

Real-time audio collaboration plugin for Ableton Live, FL Studio, Logic Pro, Cubase, and Pro Tools.

Pipes DAW master bus audio in pristine **48kHz Float32 stereo PCM** directly into your **S2DIO** browser studio sessions via low-latency local loopback on port `4949`.

---

## Architecture

- **Plugin Format**: VST3, AU, Standalone
- **Framework**: JUCE 8 (C++20)
- **Transport**: `ixwebsocket` / RFC 6455 local loopback streaming (`ws://127.0.0.1:4949`)
- **Latency**: ~0ms host-internal buffer capture (512 samples / 10.6ms transmission block)
- **GUI**: S2DIO dark minimal design with real-time stereo VU peak metering and instant web session launcher.

---

## Directory Structure

```
vst3/
├── CMakeLists.txt              # Standard JUCE 8 CMake build definition
├── README.md                   # Build and installation instructions
└── src/
    ├── PluginProcessor.h/cpp   # AudioProcessor DSP & processBlock loopback capture
    ├── PluginEditor.h/cpp      # Clean hardware UI with stereo LED meters
    └── WebSocketSender.h/cpp   # Multi-client binary Float32 WebSocket broadcaster
```

---

## How to Build

### Requirements
- **Windows**: Visual Studio 2022 (Community or higher) with "Desktop development with C++" + CMake
- **macOS**: Xcode 15+ + CMake (`brew install cmake`)

### 1. Build via CMake (One Command)

```bash
cd vst3
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

### 2. Output Location
- **Windows VST3**:
  `vst3/build/S2DioBridge_artefacts/Release/VST3/S2DIO Master Bridge.vst3`
  Copy to: `C:\Program Files\Common Files\VST3\`
- **macOS VST3 / AU**:
  `vst3/build/S2DioBridge_artefacts/Release/VST3/S2DIO Master Bridge.vst3`
  Copy to: `/Library/Audio/Plug-Ins/VST3/` and `/Library/Audio/Plug-Ins/Components/`

---

## How It Works in your DAW

1. Open your DAW (Ableton, FL Studio, Logic, etc.).
2. Put **S2DIO Master Bridge** as the **very last plugin** on your **Master Bus**.
3. Open [`http://localhost:3000`](http://localhost:3000) (or your live S2DIO URL) in Chrome / Edge / Brave.
4. The plugin automatically detects the connection (Green dot illuminates in plugin & browser).
5. Whenever you hit Play in your DAW, all collaborators hear your exact master bus in uncompressed 48kHz Float32 audio!
