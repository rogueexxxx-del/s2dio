"use client";

import React from "react";
import { RecordedTake } from "@/lib/useMultiTrackRecorder";

interface TakesModalProps {
  isOpen: boolean;
  onClose: () => void;
  takes: RecordedTake[];
  onDownloadStem: (blob: Blob, filename: string) => void;
  onAddToStems?: (take: RecordedTake) => void;
}

export function TakesModal({
  isOpen,
  onClose,
  takes,
  onDownloadStem,
  onAddToStems,
}: TakesModalProps) {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none font-sans animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface border border-hairline rounded-xl overflow-hidden shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-red" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Recorded Session Takes & Stems ({takes.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-elevated hover:bg-surface-card border border-hairline flex items-center justify-center text-xs text-mute hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Takes List */}
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {takes.length === 0 ? (
            <div className="text-center py-8 text-mute text-xs space-y-2">
              <div className="text-2xl">🎙</div>
              <div>No takes recorded yet in this session.</div>
              <div className="text-[11px] text-stone">
                Hit the <span className="text-accent-red font-semibold">● Record</span> button in the dock to capture isolated master and vocal stems.
              </div>
            </div>
          ) : (
            takes.map((take) => (
              <div
                key={take.id}
                className="p-4 rounded-lg bg-surface-elevated border border-hairline space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{take.name}</h4>
                    <span className="text-[11px] text-mute font-mono">
                      Duration: {formatTime(take.durationSeconds)} • {take.recordedAt}
                    </span>
                  </div>

                  {onAddToStems && (
                    <button
                      type="button"
                      onClick={() => onAddToStems(take)}
                      className="text-[11px] px-2.5 py-1 rounded bg-surface hover:bg-surface-card border border-hairline text-accent-green hover:text-white transition-colors"
                      title="Add stems directly to collaborator stem exchange drawer"
                    >
                      + Add to Room Stems
                    </button>
                  )}
                </div>

                {/* Stems Download Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-hairline/60">
                  <div className="flex items-center justify-between p-2 rounded bg-surface border border-hairline text-xs">
                    <div>
                      <div className="font-medium text-white">Master DAW Stem</div>
                      <div className="text-[10px] text-mute font-mono">Stereo • Float32</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDownloadStem(take.masterBlob, `${take.name.replace(/\s+/g, "_")}_Master.webm`)}
                      className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-card border border-hairline text-xs text-white font-medium transition-colors"
                    >
                      Download ↓
                    </button>
                  </div>

                  {take.vocalBlob ? (
                    <div className="flex items-center justify-between p-2 rounded bg-surface border border-hairline text-xs">
                      <div>
                        <div className="font-medium text-white">Vocal / Mic Stem</div>
                        <div className="text-[10px] text-mute font-mono">Isolated Voice</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDownloadStem(take.vocalBlob!, `${take.name.replace(/\s+/g, "_")}_Vocal.webm`)}
                        className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-card border border-hairline text-xs text-white font-medium transition-colors"
                      >
                        Download ↓
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded bg-surface border border-hairline/40 text-xs opacity-60">
                      <div>
                        <div className="font-medium text-mute">Vocal Stem</div>
                        <div className="text-[10px] text-stone">Not active during take</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-hairline/60">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-8 px-4 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
