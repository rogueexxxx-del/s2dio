"use client";

import React, { useState } from "react";
import { ScreenControlStatus } from "@/lib/types";

interface ScreenShareStageProps {
  isHost: boolean;
  screenControlStatus: ScreenControlStatus;
  onRequestControl: () => void;
  onGrantControl: (granted: boolean) => void;
}

export function ScreenShareStage({
  isHost,
  screenControlStatus,
  onRequestControl,
  onGrantControl,
}: ScreenShareStageProps) {
  const [remoteCursorPos, setRemoteCursorPos] = useState({ x: 420, y: 200 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (screenControlStatus === "granted") {
      const rect = e.currentTarget.getBoundingClientRect();
      setRemoteCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div className="relative flex-1 flex flex-col bg-black border border-border overflow-hidden select-none font-sans">
      {/* Top Stage Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm tracking-wide text-text font-medium italic">
            Ableton Live 12 Suite — Master Arrangement
          </span>
          <span className="px-1.5 py-0.5 border border-border text-[10px] text-accent tracking-wider uppercase">
            60 FPS • 48kHz Stereo
          </span>
        </div>

        {/* Remote Control HUD */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[10px] tracking-wider text-text-muted hidden sm:inline uppercase">
            RTT: 28ms • Lossless Stream
          </span>

          {screenControlStatus === "none" && !isHost && (
            <button
              onClick={onRequestControl}
              className="px-2.5 py-1 bg-surface-raised border border-border text-text hover:border-accent text-[11px] uppercase tracking-wider transition-colors"
            >
              Request Control
            </button>
          )}

          {screenControlStatus === "requested" && isHost && (
            <div className="flex items-center gap-2 bg-warning/15 border border-warning/40 px-2 py-0.5 text-warning text-[11px]">
              <span>Collaborator requested DAW mouse access:</span>
              <button
                onClick={() => onGrantControl(true)}
                className="bg-accent text-on-accent px-2 py-0.5 font-medium hover:opacity-90"
              >
                Allow
              </button>
              <button
                onClick={() => onGrantControl(false)}
                className="bg-danger text-text px-2 py-0.5 font-medium hover:opacity-90"
              >
                Deny
              </button>
            </div>
          )}

          {screenControlStatus === "granted" && (
            <div className="flex items-center gap-2 border border-accent bg-accent/10 text-accent px-2.5 py-0.5 text-[10px] tracking-wider uppercase font-medium">
              <span>Remote Control Granted</span>
              {isHost && (
                <button
                  onClick={() => onGrantControl(false)}
                  className="text-danger hover:underline ml-1"
                >
                  Revoke
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Screen Canvas Area */}
      <div
        onMouseMove={handleMouseMove}
        className="relative flex-1 flex items-center justify-center bg-[#070706] p-3 overflow-hidden cursor-crosshair"
      >
        {/* Mock DAW Graphical Interface */}
        <div className="w-full h-full max-h-[560px] bg-[#12151b] border border-border flex flex-col overflow-hidden relative select-none">
          {/* DAW Transport Bar */}
          <div className="h-9 bg-surface border-b border-border flex items-center justify-between px-4 text-xs text-text-muted">
            <div className="flex items-center gap-4">
              <span className="font-serif text-text text-sm italic">Tempo: 128.0 BPM</span>
              <span className="text-[11px] tracking-widest uppercase text-text-muted">4/4 • Bar 17.1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] text-text tracking-wider uppercase font-medium">
                Master Bus VST3 Linked
              </span>
            </div>
          </div>

          {/* DAW Timeline Tracks */}
          <div className="flex-1 grid grid-rows-4 divide-y divide-border/40 bg-[#0d0f14] p-3 gap-1 overflow-hidden">
            {/* Track 1: Drums */}
            <div className="bg-surface/50 p-2.5 flex items-center justify-between border-l-2 border-accent">
              <div>
                <div className="font-serif text-sm text-text font-medium">01. Drums & Rhythm (808 + Breaks)</div>
                <div className="font-sans text-[10px] text-text-muted tracking-wider uppercase mt-0.5">VST3: Battery 4</div>
              </div>
              <div className="text-[10px] text-accent/80 font-sans tracking-widest border border-border/80 px-2 py-0.5">
                ACTIVE PATTERN
              </div>
            </div>

            {/* Track 2: Bass */}
            <div className="bg-surface/50 p-2.5 flex items-center justify-between border-l-2 border-[#5e503f]">
              <div>
                <div className="font-serif text-sm text-text font-medium">02. Sub Bass & Reese</div>
                <div className="font-sans text-[10px] text-text-muted tracking-wider uppercase mt-0.5">VST3: Serum</div>
              </div>
              <div className="text-[10px] text-text-muted font-sans tracking-widest border border-border/80 px-2 py-0.5">
                SUB C1 - F1
              </div>
            </div>

            {/* Track 3: Keys & Chords */}
            <div className="bg-surface/50 p-2.5 flex items-center justify-between border-l-2 border-[#c6ac8f]">
              <div>
                <div className="font-serif text-sm text-text font-medium">03. Rhodes & Analog Chords</div>
                <div className="font-sans text-[10px] text-text-muted tracking-wider uppercase mt-0.5">VST3: Diva</div>
              </div>
              <div className="text-[10px] text-[#c6ac8f] font-sans tracking-widest border border-border/80 px-2 py-0.5">
                Fm9 — AbMaj7 — Cm7
              </div>
            </div>

            {/* Track 4: Lead Vocal (Remote collaborator input) */}
            <div className="bg-surface/80 p-2.5 flex items-center justify-between border-l-2 border-danger border border-danger/30">
              <div>
                <div className="font-serif text-sm text-text font-medium">04. Lead Vocal (Remote Ingest)</div>
                <div className="font-sans text-[10px] text-text-muted tracking-wider uppercase mt-0.5">
                  StudioCollab VST3 In • 24-bit 48kHz
                </div>
              </div>
              <div className="text-[10px] text-danger font-sans tracking-widest uppercase font-medium">
                ARMED FOR RECORDING
              </div>
            </div>
          </div>

          {/* Interactive Remote Pointer */}
          {screenControlStatus === "granted" && (
            <div
              className="absolute pointer-events-none transition-all duration-75 ease-out z-20 flex flex-col items-start"
              style={{
                left: `${remoteCursorPos.x}px`,
                top: `${remoteCursorPos.y}px`,
              }}
            >
              <div className="w-3 h-3 border-2 border-accent rotate-45 bg-accent/40" />
              <span className="bg-accent text-on-accent text-[9px] font-sans tracking-widest uppercase px-1.5 py-0.5 mt-1 font-semibold">
                Collaborator Cursor
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
