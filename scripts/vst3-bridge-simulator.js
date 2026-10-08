/**
 * S2DIO VST3 Bridge Simulator
 *
 * This script simulates a native VST3 plugin running on a DAW Master Bus.
 * It opens a WebSocket server on ws://127.0.0.1:4949/vst and broadcasts
 * raw 32-bit float stereo PCM buffers (48kHz) to connected studio rooms.
 */

const http = require("http");
const crypto = require("crypto");

const PORT = 4949;
const SAMPLE_RATE = 48000;
const BUFFER_SIZE = 512; // ~10.6ms buffer chunks

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("S2DIO VST3 Bridge Local Daemon Running\n");
});

// Minimal RFC 6455 WebSocket Handshake implementation (zero dependencies)
server.on("upgrade", (req, socket) => {
  if (req.headers["upgrade"] !== "websocket") {
    socket.end("HTTP/1.1 400 Bad Request");
    return;
  }

  const acceptKey = req.headers["sec-websocket-key"];
  const hash = crypto
    .createHash("sha1")
    .update(acceptKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
    .digest("base64");

  const responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${hash}`,
    "",
    "",
  ].join("\r\n");

  socket.write(responseHeaders);
  console.log("[VST3 Bridge] Studio room connected to VST3 audio pipeline on 127.0.0.1:4949");

  // Generate continuous Float32 Stereo PCM audio (A440 + harmonics chord)
  let phase = 0;
  const interval = setInterval(() => {
    // 512 frames * 2 channels * 4 bytes per float = 4096 bytes
    const byteLength = BUFFER_SIZE * 2 * 4;
    const floatBuffer = new Float32Array(BUFFER_SIZE * 2);

    for (let i = 0; i < BUFFER_SIZE; i++) {
      const t = phase / SAMPLE_RATE;
      // Gentle stereo audio tone
      const sampleL = Math.sin(2 * Math.PI * 220 * t) * 0.2;
      const sampleR = Math.sin(2 * Math.PI * 330 * t) * 0.2;
      floatBuffer[i * 2] = sampleL;
      floatBuffer[i * 2 + 1] = sampleR;
      phase++;
    }

    const payload = Buffer.from(floatBuffer.buffer);

    // Build WebSocket binary frame (Opcode 0x82)
    let frame;
    if (payload.length < 126) {
      frame = Buffer.concat([Buffer.from([0x82, payload.length]), payload]);
    } else if (payload.length <= 65535) {
      const header = Buffer.alloc(4);
      header[0] = 0x82;
      header[1] = 126;
      header.writeUInt16BE(payload.length, 2);
      frame = Buffer.concat([header, payload]);
    }

    try {
      socket.write(frame);
    } catch {
      clearInterval(interval);
    }
  }, (BUFFER_SIZE / SAMPLE_RATE) * 1000);

  socket.on("close", () => {
    clearInterval(interval);
    console.log("[VST3 Bridge] Studio room disconnected.");
  });

  socket.on("error", () => {
    clearInterval(interval);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`====================================================`);
  console.log(` S2DIO VST3 Bridge Simulator`);
  console.log(` Listening on ws://127.0.0.1:${PORT}/vst`);
  console.log(` Status: Emulating DAW Master Bus Output (48kHz Float32 Stereo)`);
  console.log(`====================================================`);
});
