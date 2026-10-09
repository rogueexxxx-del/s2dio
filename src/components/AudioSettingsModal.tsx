"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AudioEngineConfig } from "@/lib/types";

interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: AudioEngineConfig;
  onConfigChange: (cfg: Partial<AudioEngineConfig>) => void;
  onReconnectVst: () => void;
}

export function AudioSettingsModal({
  isOpen,
  onClose,
  config,
  onConfigChange,
  onReconnectVst,
}: AudioSettingsProps) {
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [midiStatus, setMidiStatus] = useState<string>("Standby");

  const scanMidiDevices = useCallback(async () => {
    if (typeof window === "undefined" || !("requestMIDIAccess" in navigator)) {
      setMidiStatus("Web MIDI not supported in this browser");
      return;
    }
    try {
      setMidiStatus("Scanning for MIDI devices...");
      const access = await (navigator as any).requestMIDIAccess({ sysex: false });
      const devs: string[] = [];
      for (const input of access.inputs.values()) {
        if (input.name) devs.push(input.name);
      }
      setMidiDevices(devs);
      if (devs.length > 0) {
        setSelectedDevice((prev) => prev || devs[0]);
        setMidiStatus(`Connected (${devs.length} device${devs.length > 1 ? "s" : ""})`);
      } else {
        setMidiStatus("No hardware MIDI controllers detected");
      }
    } catch (err: any) {
      setMidiStatus(err?.message || "MIDI permission required");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scanMidiDevices();
    }
  }, [isOpen, scanMidiDevices]);

  const handleDeviceChange = (dev: string) => {
    setSelectedDevice(dev);
    onConfigChange({ selectedMidiDevice: dev, midiEnabled: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-xs p-4 select-none font-sans">
      <div className="flex flex-col w-full max-w-md bg-surface border border-hairline rounded-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline bg-surface-elevated/50">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            Audio Engine & VST3 Settings
          </h3>
          <button
            onClick={onClose}
            className="text-mute hover:text-ink text-xs transition-colors px-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* VST3 Status Banner */}
          <div
            className={`p-3.5 border rounded-md ${
              config.vstConnected
                ? "bg-surface-elevated border-hairline text-ink"
                : "bg-surface-elevated border-hairline text-mute"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      config.vstConnected ? "bg-accent-green" : "bg-stone"
                    }`}
                  />
                  <span className="text-sm text-ink font-medium">
                    {config.vstConnected ? "VST3 Loopback: Connected" : "VST3 Bridge: Standby"}
                  </span>
                </div>
                <div className="text-xs text-mute mt-1">
                  127.0.0.1:{config.vstPort} • Direct Master Bus Capture
                </div>
              </div>

              <button
                onClick={onReconnectVst}
                className="btn-tertiary text-xs h-7 px-2.5"
              >
                Reconnect
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-hairline flex items-center justify-between text-[11px]">
              <span className="text-mute">Plugin file:</span>
              <span className="text-ink font-mono text-[10px] bg-surface-card px-2 py-0.5 rounded border border-hairline">
                vst3/S2DIO Master Bridge.vst3
              </span>
            </div>
          </div>

          {/* Sample Rate Selector */}
          <div>
            <label className="block text-mute mb-2 text-xs font-medium">
              Sample Rate
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[44100, 48000, 96000].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onConfigChange({ sampleRate: rate as 44100 | 48000 | 96000 })}
                  className={`py-2 px-3 border rounded-md text-center transition-all text-xs ${
                    config.sampleRate === rate
                      ? "bg-primary text-on-primary border-primary font-medium"
                      : "bg-surface-elevated border-hairline text-mute hover:text-ink"
                  }`}
                >
                  {(rate / 1000).toFixed(1)} kHz
                </button>
              ))}
            </div>
          </div>

          {/* Buffer Size Stepper */}
          <div>
            <label className="block text-mute mb-2 text-xs font-medium">
              Buffer Size (Latency Target)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[64, 128, 256, 512, 1024].map((buf) => (
                <button
                  key={buf}
                  onClick={() => onConfigChange({ bufferSize: buf as 64 | 128 | 256 | 512 | 1024 })}
                  className={`py-1.5 border rounded-md text-center transition-all text-xs ${
                    config.bufferSize === buf
                      ? "bg-primary text-on-primary border-primary font-medium"
                      : "bg-surface-elevated border-hairline text-mute hover:text-ink"
                  }`}
                >
                  {buf}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-mute mt-1.5">
              <span>Lowest (~2.9ms)</span>
              <span>Stable (~21.3ms)</span>
            </div>
          </div>

          {/* Talkback Auto-Ducking */}
          <div>
            <div className="flex justify-between text-mute mb-2 text-xs font-medium">
              <span>Music Ducking while Talking</span>
              <span className="text-ink font-semibold">{config.talkbackDuckingDb} dB</span>
            </div>
            <input
              type="range"
              min="-24"
              max="-3"
              step="1"
              value={config.talkbackDuckingDb}
              onChange={(e) => onConfigChange({ talkbackDuckingDb: parseInt(e.target.value) })}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Loopback Protection */}
          <div className="flex items-center justify-between p-3.5 bg-surface-elevated border border-hairline rounded-md">
            <div>
              <div className="text-ink font-medium">Loopback Isolation Shield</div>
              <div className="text-xs text-mute mt-0.5">
                Prevents collaborator voices from bleeding into DAW bus
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.loopbackProtection}
              onChange={(e) => onConfigChange({ loopbackProtection: e.target.checked })}
              className="w-4 h-4 cursor-pointer accent-white"
            />
          </div>

          {/* Web MIDI Hardware & Network Passthrough */}
          <div className="p-3.5 bg-surface-elevated border border-hairline rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-ink font-medium flex items-center gap-2">
                  <span>Web MIDI Controller Passthrough</span>
                  <span className={`w-2 h-2 rounded-full ${midiDevices.length > 0 ? "bg-accent-green" : "bg-stone"}`} />
                </div>
                <div className="text-[11px] text-mute mt-0.5">
                  Stream USB MIDI keyboard/pad events directly to VST3 (:4949)
                </div>
              </div>
              <button
                type="button"
                onClick={scanMidiDevices}
                className="btn-tertiary text-xs h-7 px-2.5"
              >
                Scan
              </button>
            </div>

            {midiDevices.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedDevice}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full bg-surface border border-hairline rounded-md px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-accent-green/50"
                >
                  {midiDevices.map((dev) => (
                    <option key={dev} value={dev} className="bg-surface text-ink">
                      {dev}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-[11px] text-stone">
                  <span>Routing: Omni Channel &rarr; VST3 Loopback</span>
                  <span className="font-mono text-accent-green">Active</span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-stone p-2 rounded bg-surface border border-hairline/60">
                {midiStatus || "Connect a USB MIDI keyboard or launch browser with MIDI access."}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-hairline bg-surface-elevated/30">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
