"use client";

import React from "react";
import { AudioChannel } from "@/lib/types";
import { AudioChannelStrip } from "./AudioChannelStrip";

interface MixerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  channels: AudioChannel[];
  onVolumeChange: (id: string, vol: number) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
}

export function MixerPopover({
  isOpen,
  onClose,
  channels,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
}: MixerPopoverProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-xs p-4 select-none font-sans">
      <div className="bg-surface border border-hairline rounded-lg p-6 space-y-5 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between border-b border-hairline pb-3.5">
          <div>
            <div className="text-sm font-semibold text-ink">Console Faders & Metering</div>
            <div className="text-xs text-mute mt-0.5">
              Individual channel faders, mute/solo, and stereo meters
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-mute hover:text-ink px-2.5 py-1 rounded-md border border-hairline hover:border-hairline-strong transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex gap-4 sm:gap-6 justify-center py-2 overflow-x-auto">
          {channels.map((channel) => (
            <AudioChannelStrip
              key={channel.id}
              channel={channel}
              onVolumeChange={onVolumeChange}
              onMuteToggle={onMuteToggle}
              onSoloToggle={onSoloToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
