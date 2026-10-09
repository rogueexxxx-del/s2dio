"use client";

import { AudioEngineConfig } from "./types";

export class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dawGain: GainNode | null = null;
  private talkbackGain: GainNode | null = null;
  private analyserDawL: AnalyserNode | null = null;
  private analyserDawR: AnalyserNode | null = null;
  private analyserMic: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private vstSocket: WebSocket | null = null;
  private testOscillator: OscillatorNode | null = null;
  private testLfo: OscillatorNode | null = null;
  private isTestingAudio: boolean = false;

  public config: AudioEngineConfig = {
    sampleRate: 48000,
    bufferSize: 256,
    vstConnected: false,
    vstPort: 4949,
    loopbackProtection: true,
    talkbackDuckingDb: -12,
  };

  private onVstStatusChange?: (connected: boolean) => void;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private nextPlayTime: number = 0;

  constructor(onVstStatus?: (connected: boolean) => void) {
    this.onVstStatusChange = onVstStatus;
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  public async init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass({ sampleRate: this.config.sampleRate });

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // DAW audio bus
      this.dawGain = this.ctx.createGain();
      this.dawGain.connect(this.masterGain);

      // Talkback bus
      this.talkbackGain = this.ctx.createGain();
      this.talkbackGain.gain.value = 0; // muted by default until push-to-talk
      this.talkbackGain.connect(this.masterGain);

      // Stereo split analysers for DAW metering
      const splitter = this.ctx.createChannelSplitter(2);
      this.analyserDawL = this.ctx.createAnalyser();
      this.analyserDawL.fftSize = 256;
      this.analyserDawR = this.ctx.createAnalyser();
      this.analyserDawR.fftSize = 256;

      this.dawGain.connect(splitter);
      splitter.connect(this.analyserDawL, 0);
      splitter.connect(this.analyserDawR, 1);

      // Analyser for Mic
      this.analyserMic = this.ctx.createAnalyser();
      this.analyserMic.fftSize = 256;
      this.talkbackGain.connect(this.analyserMic);

      // Attempt local VST3 connection
      this.connectVstBridge();
    }

    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        // Will unlock on next user gesture
      }
    }
  }

  public async resume(): Promise<boolean> {
    await this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectVstBridge();
    }, 1500);
  }

  public connectVstBridge() {
    if (typeof window === "undefined") return;
    if (this.vstSocket && (this.vstSocket.readyState === WebSocket.OPEN || this.vstSocket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      if (this.vstSocket) {
        try { this.vstSocket.close(); } catch { /* ignore */ }
      }
      this.vstSocket = new WebSocket(`ws://127.0.0.1:${this.config.vstPort}`);
      this.vstSocket.binaryType = "arraybuffer";

      this.vstSocket.onopen = () => {
        this.config.vstConnected = true;
        this.onVstStatusChange?.(true);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.vstSocket.onclose = () => {
        this.config.vstConnected = false;
        this.onVstStatusChange?.(false);
        this.scheduleReconnect();
      };

      this.vstSocket.onerror = () => {
        this.config.vstConnected = false;
        this.onVstStatusChange?.(false);
        this.scheduleReconnect();
      };

      this.vstSocket.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer && this.ctx && this.dawGain) {
          if (this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
          }

          // Received raw float32 PCM chunk from VST3 plugin!
          const floatArray = new Float32Array(event.data);
          const channelCount = 2;
          const frameCount = floatArray.length / channelCount;
          if (frameCount > 0) {
            const buffer = this.ctx.createBuffer(channelCount, frameCount, this.config.sampleRate);
            const left = buffer.getChannelData(0);
            const right = buffer.getChannelData(1);
            for (let i = 0; i < frameCount; i++) {
              left[i] = floatArray[i * 2];
              right[i] = floatArray[i * 2 + 1];
            }
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            src.connect(this.dawGain);

            const now = this.ctx.currentTime;
            const startTime = Math.max(now, this.nextPlayTime);
            src.start(startTime);
            this.nextPlayTime = startTime + buffer.duration;
          }
        }
      };
    } catch {
      this.config.vstConnected = false;
      this.onVstStatusChange?.(false);
      this.scheduleReconnect();
    }
  }

  public async enableMic(): Promise<boolean> {
    try {
      await this.init();
      if (!this.ctx || !this.talkbackGain) return false;
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.talkbackGain);
      return true;
    } catch {
      return false;
    }
  }

  public setTalkbackActive(active: boolean) {
    if (!this.ctx || !this.talkbackGain || !this.dawGain) return;
    const now = this.ctx.currentTime;
    if (active) {
      // Un-gate microphone
      this.talkbackGain.gain.setValueAtTime(this.talkbackGain.gain.value, now);
      this.talkbackGain.gain.linearRampToValueAtTime(1.0, now + 0.05);

      // Duck DAW audio slightly so voice cuts through clearly
      const duckGain = Math.pow(10, this.config.talkbackDuckingDb / 20);
      this.dawGain.gain.setValueAtTime(this.dawGain.gain.value, now);
      this.dawGain.gain.linearRampToValueAtTime(duckGain, now + 0.05);
    } else {
      // Mute microphone
      this.talkbackGain.gain.setValueAtTime(this.talkbackGain.gain.value, now);
      this.talkbackGain.gain.linearRampToValueAtTime(0.0, now + 0.05);

      // Restore DAW audio
      this.dawGain.gain.setValueAtTime(this.dawGain.gain.value, now);
      this.dawGain.gain.linearRampToValueAtTime(1.0, now + 0.08);
    }
  }

  public isTestAudioActive(): boolean {
    return this.isTestingAudio;
  }

  public get isInitialized(): boolean {
    return this.ctx !== null;
  }

  public toggleTestAudio(): boolean {
    if (this.isTestingAudio) {
      this.stopTestAudio();
      return false;
    } else {
      this.startTestAudio();
      return true;
    }
  }

  public startTestAudio() {
    if (!this.ctx) this.init();
    if (!this.ctx || !this.dawGain) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.stopTestAudio();

    // Create a pleasant warm analog chord simulation (lush minor 9th synth loop)
    const chordFreqs = [174.61, 220.0, 261.63, 329.63, 392.0]; // F minor 9th
    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0.15;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;

    // LFO to simulate authentic studio track movement
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.testLfo = lfo;

    chordFreqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx % 2 === 0 ? "sawtooth" : "triangle";
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start();
    });

    filter.connect(oscGain);
    oscGain.connect(this.dawGain);

    this.isTestingAudio = true;
  }

  public stopTestAudio() {
    if (this.testOscillator) {
      try { this.testOscillator.stop(); } catch { /* ignore */ }
      this.testOscillator = null;
    }
    if (this.testLfo) {
      try { this.testLfo.stop(); } catch { /* ignore */ }
      this.testLfo = null;
    }
    this.isTestingAudio = false;
  }

  public setChannelVolume(channelType: "daw" | "talkback" | "master", volumeLinear: number) {
    if (!this.ctx) return;
    const target = channelType === "daw" ? this.dawGain : channelType === "talkback" ? this.talkbackGain : this.masterGain;
    if (target) {
      target.gain.linearRampToValueAtTime(volumeLinear, this.ctx.currentTime + 0.05);
    }
  }

  public getLevels(): { dawL: number; dawR: number; mic: number } {
    return {
      dawL: this.calcRms(this.analyserDawL),
      dawR: this.calcRms(this.analyserDawR),
      mic: this.calcRms(this.analyserMic),
    };
  }

  // --- Multi-track Stream Taps for Stem Recording ---
  public getDawStream(): MediaStream | null {
    if (!this.ctx || !this.dawGain) return null;
    const dest = this.ctx.createMediaStreamDestination();
    this.dawGain.connect(dest);
    return dest.stream;
  }

  public getMicStream(): MediaStream | null {
    if (this.micStream) return this.micStream;
    if (!this.ctx || !this.talkbackGain) return null;
    const dest = this.ctx.createMediaStreamDestination();
    this.talkbackGain.connect(dest);
    return dest.stream;
  }

  // --- Web MIDI Device Passthrough ---
  private midiAccess: any = null;
  private activeMidiInput: any = null;
  public onMidiActivity?: (note: number, velocity: number) => void;

  public async initMidi(): Promise<{ supported: boolean; devices: string[]; error?: string }> {
    if (typeof window === "undefined" || !("requestMIDIAccess" in navigator)) {
      return { supported: false, devices: [], error: "Web MIDI API is not supported in this browser" };
    }
    try {
      this.midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
      const devices: string[] = [];
      const inputs = this.midiAccess.inputs.values();
      for (const input of inputs) {
        if (input.name) devices.push(input.name);
      }

      // Auto-connect to first device if available
      if (devices.length > 0) {
        this.selectMidiDevice(devices[0]);
      }

      return { supported: true, devices };
    } catch (err: any) {
      return { supported: false, devices: [], error: err?.message || "MIDI permission denied" };
    }
  }

  public selectMidiDevice(deviceName: string): boolean {
    if (!this.midiAccess) return false;
    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      if (input.name === deviceName) {
        if (this.activeMidiInput) {
          this.activeMidiInput.onmidimessage = null;
        }
        this.activeMidiInput = input;
        input.onmidimessage = (event: any) => {
          const [status, note, velocity] = event.data;
          const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;
          if (isNoteOn) {
            this.onMidiActivity?.(note, velocity);
          }
          // Transmit MIDI byte packet to VST3 bridge on :4949 if connected
          if (this.vstSocket && this.vstSocket.readyState === WebSocket.OPEN) {
            try {
              this.vstSocket.send(event.data);
            } catch {
              // ignore loopback write errors
            }
          }
        };
        return true;
      }
    }
    return false;
  }

  private calcRms(analyser: AnalyserNode | null): number {
    if (!analyser) return -60;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);
    if (rms <= 0.001) return -60;
    const db = 20 * Math.log10(rms);
    return Math.max(-60, Math.min(6, db));
  }
}
