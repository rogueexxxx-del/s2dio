"use client";

import React, { useEffect, useRef } from "react";
import { ScreenControlStatus, Participant } from "@/lib/types";

interface AudioStageProps {
  isStreaming: boolean;
  rmsDbL: number;
  rmsDbR: number;
  screenControlStatus: ScreenControlStatus;
  onRequestControl: () => void;
  onGrantControl: (granted: boolean) => void;
  isHost: boolean;
  participants: Participant[];
  onUpdateParticipantName?: (id: string, newName: string) => void;
  onInviteClick?: () => void;
  videoStream?: MediaStream | null;
  isScreenSharing?: boolean;
  onToggleScreenShare?: () => void;
}

export function AudioStage({
  isStreaming,
  rmsDbL,
  rmsDbR,
  screenControlStatus,
  onRequestControl,
  onGrantControl,
  isHost,
  participants,
  onUpdateParticipantName,
  onInviteClick,
  videoStream,
  isScreenSharing,
  onToggleScreenShare,
}: AudioStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tempName, setTempName] = React.useState("");

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Audio waveform animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
      const height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

      ctx.clearRect(0, 0, width, height);

      const level = isStreaming ? Math.max(0.06, (rmsDbL + 60) / 60) : 0.02;
      const centerY = height / 2;

      // Draw primary crisp filament wave (Raycast ink)
      ctx.lineWidth = 1.5 * window.devicePixelRatio;
      ctx.strokeStyle = isStreaming ? "rgba(244, 244, 246, 0.6)" : "rgba(106, 107, 108, 0.25)";
      ctx.beginPath();

      const step = 4;
      for (let x = 0; x <= width; x += step) {
        const normX = x / width;
        const envelope = Math.sin(normX * Math.PI); // tapering edges
        const wave = Math.sin(normX * 8 + phase) * 28 * level * envelope;
        const harmonic = Math.sin(normX * 18 - phase * 1.5) * 12 * level * envelope;
        const y = centerY + (wave + harmonic) * window.devicePixelRatio;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Second harmonic filament (accent blue or green)
      if (isStreaming) {
        ctx.lineWidth = 1 * window.devicePixelRatio;
        ctx.strokeStyle = "rgba(87, 193, 255, 0.4)";
        ctx.beginPath();
        for (let x = 0; x <= width; x += step) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);
          const wave = Math.cos(normX * 10 - phase * 0.8) * 20 * level * envelope;
          const y = centerY + wave * window.devicePixelRatio;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += isStreaming ? 0.04 : 0.01;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isStreaming, rmsDbL, rmsDbR]);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden p-6 select-none bg-canvas">
      {/* Waveform Canvas (Background filament when no video, or ambient background) */}
      {!videoStream && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* Video Viewport or Center Hardware Studio Console */}
      {videoStream ? (
        <div className="relative w-full max-w-5xl h-[72vh] flex items-center justify-center rounded-lg overflow-hidden border border-hairline bg-surface shadow-2xl z-10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain bg-canvas"
          />

          {/* Floating live indicator on video */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-surface/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-hairline text-xs shadow-md">
            <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
            <span className="text-ink font-medium">DAW Screen Live</span>
            <span className="text-mute text-[11px]">• 60fps</span>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    videoRef.current.requestFullscreen();
                  }
                }
              }}
              className="px-2.5 py-1.5 rounded-md bg-surface/85 hover:bg-surface border border-hairline text-ink text-xs backdrop-blur-md transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              ⛶ Fullscreen
            </button>
            {isHost && onToggleScreenShare && (
              <button
                onClick={onToggleScreenShare}
                className="px-2.5 py-1.5 rounded-md bg-accent-red hover:bg-accent-red/90 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Stop Sharing
              </button>
            )}
          </div>

          {/* Floating Live Audio Filament over Video */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface/90 backdrop-blur-md border border-hairline text-xs shadow-md">
            <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-accent-green animate-pulse" : "bg-stone"}`} />
            <span className="text-ink font-mono text-[11px]">L {rmsDbL.toFixed(1)} dB</span>
            <span className="text-stone">|</span>
            <span className="text-ink font-mono text-[11px]">R {rmsDbR.toFixed(1)} dB</span>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-2xl mx-auto space-y-6">
          {/* Hardware Ingest Header Card */}
          <div className="bg-surface/95 border border-hairline rounded-xl p-6 shadow-2xl space-y-5 backdrop-blur-md">
            {/* Top Bar: Connection & Stream Type */}
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isStreaming ? "bg-accent-green animate-pulse" : "bg-stone"}`} />
                <span className="text-sm font-semibold text-ink">
                  {isStreaming ? "DAW Master Bus Active" : "DAW Bridge Standby"}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-surface-elevated border border-hairline font-mono text-mute">
                  127.0.0.1:4949
                </span>
              </div>

              <div className="text-[11px] font-mono text-mute">
                48.0 kHz • 32-bit Float Stereo
              </div>
            </div>

            {/* Stereo Hardware VU Meters */}
            <div className="space-y-3 bg-surface-elevated/70 border border-hairline rounded-lg p-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-mute uppercase tracking-wider">
                <span>Master Bus Output</span>
                <div className="flex gap-4">
                  <span>-48</span>
                  <span>-36</span>
                  <span>-24</span>
                  <span>-18</span>
                  <span>-12</span>
                  <span>-6</span>
                  <span>-3</span>
                  <span className="text-accent-red font-bold">0 dB</span>
                </div>
              </div>

              {/* Left Channel */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-ink w-4">L</span>
                  <div className="flex-1 h-3.5 bg-canvas rounded-xs overflow-hidden p-0.5 flex items-center border border-hairline">
                    <div
                      className="h-full rounded-xs transition-all duration-75"
                      style={{
                        width: `${Math.max(2, Math.min(100, ((rmsDbL + 60) / 60) * 100))}%`,
                        backgroundColor: rmsDbL > -3 ? '#ff453a' : rmsDbL > -12 ? '#ffd60a' : '#30d158',
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-ink w-14 text-right">
                    {rmsDbL > -59 ? `${rmsDbL.toFixed(1)} dB` : "-inf"}
                  </span>
                </div>
              </div>

              {/* Right Channel */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-ink w-4">R</span>
                  <div className="flex-1 h-3.5 bg-canvas rounded-xs overflow-hidden p-0.5 flex items-center border border-hairline">
                    <div
                      className="h-full rounded-xs transition-all duration-75"
                      style={{
                        width: `${Math.max(2, Math.min(100, ((rmsDbR + 60) / 60) * 100))}%`,
                        backgroundColor: rmsDbR > -3 ? '#ff453a' : rmsDbR > -12 ? '#ffd60a' : '#30d158',
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-ink w-14 text-right">
                    {rmsDbR > -59 ? `${rmsDbR.toFixed(1)} dB` : "-inf"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Screen Share & Instructions Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
              <div className="text-xs text-mute space-y-1 text-center sm:text-left">
                <div className="text-ink font-medium">
                  {isStreaming ? "Audio streaming in real time" : "Ready for audio ingest"}
                </div>
                <div className="text-[11px]">
                  Play your arrangement in FL Studio, Ableton, or Reaper to stream.
                </div>
              </div>

              {isHost && onToggleScreenShare && (
                <button
                  onClick={onToggleScreenShare}
                  className="btn-primary h-9 px-4 text-xs font-medium inline-flex items-center gap-2 whitespace-nowrap shadow-md cursor-pointer"
                >
                  <span>🖥</span>
                  <span>Share DAW Screen (60fps)</span>
                </button>
              )}
            </div>
          </div>

          {/* Broadcast & Room Info Strip */}
          <div className="flex items-center justify-between px-2 text-[11px] text-mute">
            <div>
              <span>Talkback Auto-Ducking: </span>
              <strong className="text-ink font-medium">-12 dB active</strong>
            </div>
            <div>
              <span>Latency target: </span>
              <strong className="text-ink font-medium">~5.3ms (256 smp)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Floating Participant Badges in Top Right of Canvas */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        {participants.map((p) => {
          const isCurrentUser = (isHost && p.role === "host") || (!isHost && p.role !== "host");
          const isEditing = editingId === p.id;

          const handleCommit = () => {
            if (tempName.trim() && onUpdateParticipantName) {
              onUpdateParticipantName(p.id, tempName.trim());
            }
            setEditingId(null);
          };

          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-1.5 bg-surface border rounded-md transition-all text-xs ${
                p.isTalkbackActive
                  ? "border-hairline-strong text-ink bg-surface-elevated"
                  : "border-hairline text-mute"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  p.isTalkbackActive ? "bg-accent-green animate-pulse" : "bg-stone"
                }`}
              />
              {isEditing ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleCommit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCommit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="w-20 bg-canvas border border-accent-blue/50 rounded px-1.5 py-0.5 text-xs text-ink focus:outline-hidden"
                />
              ) : (
                <button
                  onClick={() => {
                    if (isCurrentUser) {
                      setEditingId(p.id);
                      setTempName(p.name);
                    }
                  }}
                  title={isCurrentUser ? "Click to edit your display name" : undefined}
                  className={`font-medium text-ink flex items-center gap-1 ${
                    isCurrentUser ? "hover:text-white cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span>{p.name}</span>
                  {isCurrentUser && (
                    <span className="text-[10px] text-mute opacity-60 hover:opacity-100">✎</span>
                  )}
                </button>
              )}
              {p.role === "host" && (
                <span className="text-[10px] text-mute border border-hairline rounded-xs px-1">Host</span>
              )}
            </div>
          );
        })}

        {/* Quick Invite Button */}
        {onInviteClick && (
          <button
            onClick={onInviteClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface/80 hover:bg-surface border border-dashed border-hairline hover:border-hairline-strong rounded-md transition-all text-xs text-mute hover:text-ink cursor-pointer"
            title="Copy guest invite link"
          >
            <span className="text-accent-blue font-bold">+</span>
            <span>Invite</span>
          </button>
        )}

        {/* Remote Screen Control Request / Status Badge */}
        {!isHost ? (
          <button
            onClick={onRequestControl}
            className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all ${
              screenControlStatus === "granted"
                ? "bg-accent-green/10 border-accent-green text-accent-green"
                : screenControlStatus === "requested"
                ? "bg-accent-amber/10 border-accent-amber text-accent-amber"
                : "bg-surface border-hairline text-mute hover:text-ink hover:border-hairline-strong"
            }`}
          >
            {screenControlStatus === "granted"
              ? "Control Active"
              : screenControlStatus === "requested"
              ? "Requested"
              : "Request Control"}
          </button>
        ) : (
          screenControlStatus === "requested" && (
            <div className="flex items-center gap-1.5 bg-surface-elevated border border-accent-blue/40 px-2.5 py-1 rounded-md text-xs">
              <span className="text-ink">Guest requested control</span>
              <button
                onClick={() => onGrantControl(true)}
                className="px-2 py-0.5 rounded bg-accent-blue text-white text-[11px] font-medium hover:bg-accent-blue/90"
              >
                Grant
              </button>
              <button
                onClick={() => onGrantControl(false)}
                className="px-2 py-0.5 rounded bg-surface border border-hairline text-mute hover:text-ink text-[11px]"
              >
                Deny
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
