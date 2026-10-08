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

      {/* Video Viewport or Center Focus Text */}
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
        <div className="relative z-10 text-center space-y-3 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-hairline text-xs text-mute">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStreaming ? "bg-accent-green animate-pulse" : "bg-stone"
              }`}
            />
            <span className="font-medium text-ink">
              {isStreaming ? "Master Audio Active" : "DAW Audio Standby"}
            </span>
            <span className="text-stone">•</span>
            <span>48kHz VST3</span>
          </div>

          <div className="text-2xl md:text-3xl text-ink font-medium tracking-tight">
            {isStreaming ? "Listening to DAW Master Bus" : "Audio stream is ready"}
          </div>

          <p className="text-sm text-mute leading-relaxed font-sans max-w-sm mx-auto">
            {isStreaming
              ? "Uncompressed Float32 stereo PCM streaming via local loopback on 127.0.0.1:4949."
              : "Trigger playback in your DAW or press Play Demo in the dock to test."}
          </p>

          {isHost && onToggleScreenShare && (
            <div className="pt-2">
              <button
                onClick={onToggleScreenShare}
                className="btn-secondary h-9 px-4 text-xs inline-flex items-center gap-2"
              >
                <span>🖥</span>
                <span>Share DAW Screen</span>
              </button>
            </div>
          )}

          {isHost && !isStreaming && typeof window !== "undefined" && window.location.protocol === "https:" && (
            <div className="p-3 rounded-md bg-surface border border-accent-blue/30 text-[11px] text-mute max-w-sm mx-auto space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-accent-blue font-medium">
                <span>Local Bridge Note</span>
              </div>
              <p className="leading-relaxed">
                Browsers block HTTPS web pages from connecting to unencrypted local machine sockets (<code className="text-ink">127.0.0.1:4949</code>).
              </p>
              <p>
                Open this session on your DAW machine at{" "}
                <a
                  href={`http://localhost:3000${window.location.pathname}`}
                  className="text-ink underline hover:text-accent-blue font-mono font-medium"
                >
                  http://localhost:3000{window.location.pathname}
                </a>{" "}
                to link directly with your VST3 plugin.
              </p>
            </div>
          )}
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
