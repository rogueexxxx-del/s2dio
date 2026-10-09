"use client";

import React from "react";

export type RecFormat = "wav" | "webm-320" | "webm-192";
export type RecRouting = "all" | "master" | "vocal";

interface RecordingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  format: RecFormat;
  routing: RecRouting;
  onSave: (format: RecFormat, routing: RecRouting) => void;
}

export function RecordingOptionsModal({
  isOpen,
  onClose,
  format: initialFormat,
  routing: initialRouting,
  onSave,
}: RecordingOptionsModalProps) {
  const [selectedFormat, setSelectedFormat] = React.useState<RecFormat>(initialFormat);
  const [selectedRouting, setSelectedRouting] = React.useState<RecRouting>(initialRouting);

  React.useEffect(() => {
    setSelectedFormat(initialFormat);
    setSelectedRouting(initialRouting);
  }, [initialFormat, initialRouting, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSave(selectedFormat, selectedRouting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none font-sans animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface border border-hairline rounded-xl overflow-hidden shadow-2xl space-y-5 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-red" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Recording Format & Quality
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-elevated hover:bg-surface-card border border-hairline flex items-center justify-center text-xs text-mute hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="block text-mute text-xs font-medium">Format & Bit Depth</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "wav" as RecFormat, label: "Lossless WAV (Float32)" },
              { id: "webm-320" as RecFormat, label: "WebM Opus (320k)" },
              { id: "webm-192" as RecFormat, label: "WebM Opus (192k)" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormat(f.id)}
                className={`py-2 px-2 rounded-lg border text-center transition-colors font-medium text-xs leading-snug cursor-pointer ${
                  selectedFormat === f.id
                    ? "bg-accent-green/15 text-accent-green border-accent-green/40 font-semibold"
                    : "bg-surface-elevated text-mute border-hairline hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-mute pt-0.5">
            {selectedFormat === "wav"
              ? "Uncompressed 48.0 kHz 32-bit float stereo audio for DAW drag-and-drop."
              : selectedFormat === "webm-320"
              ? "Broadcast-grade 320 kbps Opus compression for pristine master reference."
              : "Efficient 192 kbps Opus compression optimized for fast session reviews."}
          </div>
        </div>

        {/* Stem Routing Selection */}
        <div className="space-y-2">
          <label className="block text-mute text-xs font-medium">Multi-Track Stem Routing</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all" as RecRouting, label: "Master + Vocals" },
              { id: "master" as RecRouting, label: "Master Bus Only" },
              { id: "vocal" as RecRouting, label: "Vocals Only" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRouting(r.id)}
                className={`py-2 px-2 rounded-lg border text-center transition-colors font-medium text-xs leading-snug cursor-pointer ${
                  selectedRouting === r.id
                    ? "bg-accent-green/15 text-accent-green border-accent-green/40 font-semibold"
                    : "bg-surface-elevated text-mute border-hairline hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-mute pt-0.5">
            {selectedRouting === "all"
              ? "Captures separate synchronized stem files for the DAW mix and performer microphone."
              : selectedRouting === "master"
              ? "Captures only the stereo master bus output from your DAW."
              : "Captures only the performer's dry microphone talkback channel."}
          </div>
        </div>

        {/* Audio Pipeline Telemetry */}
        <div className="p-3 rounded-lg bg-surface-elevated border border-hairline flex items-center justify-between text-xs">
          <span className="text-mute">Hardware Audio Pipeline</span>
          <span className="font-mono text-accent-green font-semibold">48,000 Hz Stereo</span>
        </div>

        {/* Save & Apply Button */}
        <button
          type="button"
          onClick={handleApply}
          className="btn-primary w-full h-9 text-xs font-semibold"
        >
          Save & Apply
        </button>
      </div>
    </div>
  );
}
