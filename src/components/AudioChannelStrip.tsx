"use client";

import React from "react";
import { AudioChannel } from "@/lib/types";
import { VUMeter } from "./VUMeter";

interface ChannelStripProps {
  channel: AudioChannel;
  onVolumeChange: (id: string, vol: number) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
}

export function AudioChannelStrip({
  channel,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
}: ChannelStripProps) {
  const volumeDb = channel.volume <= 0.001 ? -Infinity : 20 * Math.log10(channel.volume);
  const displayDb = volumeDb === -Infinity ? "—" : `${volumeDb > 0 ? "+" : ""}${volumeDb.toFixed(1)}`;
  
  // Percentage for fader cap position (0% to 100%)
  const faderPct = Math.min(100, Math.max(0, (channel.volume / 1.41) * 100));

  return (
    <div
      className={`flex flex-col items-center w-28 sm:w-32 p-3 bg-surface border rounded-md transition-all select-none font-sans overflow-hidden ${
        channel.isMuted
          ? "border-hairline opacity-40"
          : channel.isSolo
          ? "border-hairline-strong bg-surface-elevated"
          : "border-hairline"
      }`}
    >
      {/* Channel Header */}
      <div className="w-full text-center pb-2 border-b border-hairline">
        <div className="text-xs font-semibold text-ink truncate" title={channel.name}>
          {channel.name}
        </div>
        <div className="text-[10px] text-mute truncate mt-0.5">
          {channel.ownerName}
        </div>
      </div>

      {/* Mute & Solo Buttons */}
      <div className="flex gap-2 my-2.5">
        <button
          onClick={() => onMuteToggle(channel.id)}
          aria-label={`Mute ${channel.name}`}
          className={`w-7 h-5 rounded-xs text-[10px] uppercase font-medium transition-all border ${
            channel.isMuted
              ? "bg-accent-red text-white border-accent-red"
              : "bg-surface-elevated border-hairline text-mute hover:text-ink hover:border-hairline-strong"
          }`}
          title="Mute Channel"
        >
          M
        </button>
        <button
          onClick={() => onSoloToggle(channel.id)}
          aria-label={`Solo ${channel.name}`}
          className={`w-7 h-5 rounded-xs text-[10px] uppercase font-semibold transition-all border ${
            channel.isSolo
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-elevated border-hairline text-mute hover:text-ink hover:border-hairline-strong"
          }`}
          title="Solo Channel"
        >
          S
        </button>
      </div>

      {/* Fader & Meter Stage - Centered with no element sticking outside */}
      <div className="flex items-center justify-center gap-3 my-2 w-full h-[155px]">
        {/* Hardware-styled Vertical Fader with confined bounds */}
        <div className="relative w-8 h-[145px] bg-surface-card border border-hairline rounded-xs flex items-center justify-center overflow-hidden">
          {/* Central groove line */}
          <div className="absolute w-[2px] h-[125px] bg-hairline rounded-full pointer-events-none" />

          {/* Precision Hardware Fader Cap */}
          <div
            className="absolute w-6 h-3 bg-white rounded-xs border border-hairline flex items-center justify-center shadow-md pointer-events-none transition-all duration-75"
            style={{
              bottom: `calc(${faderPct * 0.82}% + 6px)`,
            }}
          >
            <div className="w-3 h-[1px] bg-black" />
          </div>

          {/* Invisible interactive range input bound strictly to track */}
          <input
            type="range"
            min="0"
            max="1.41"
            step="0.01"
            value={channel.volume}
            onChange={(e) => onVolumeChange(channel.id, parseFloat(e.target.value))}
            className="absolute w-[130px] h-8 -rotate-90 origin-center cursor-pointer opacity-0 z-20"
            aria-label={`${channel.name} volume fader`}
          />
        </div>

        {/* Centered VU Meter */}
        <div className="flex items-center justify-center">
          <VUMeter
            dbL={channel.isMuted ? -60 : channel.rmsDbL}
            dbR={channel.isMuted ? -60 : channel.rmsDbR}
            height={145}
            showLabels={false}
          />
        </div>
      </div>

      {/* Level Readout */}
      <div className="mt-1 w-full text-center py-1 bg-surface-elevated border border-hairline rounded-xs text-[11px] text-ink font-mono">
        <span>{displayDb}</span> <span className="text-[9px] text-mute">dB</span>
      </div>
    </div>
  );
}
