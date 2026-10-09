"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StudioAudioEngine } from "@/lib/audio-engine";
import { AudioStage } from "@/components/AudioStage";
import { PushToTalkButton } from "@/components/PushToTalkButton";
import { ScreenControlStatus, Participant } from "@/lib/types";
import { S2DioLogo } from "@/components/S2DioLogo";

export default function GuestPortalPage() {
  const params = useParams();
  const slug = (params.slug as string) || "session";
  const router = useRouter();

  const [engine, setEngine] = useState<StudioAudioEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTalkbackActive, setIsTalkbackActive] = useState(false);
  const [screenControlStatus, setScreenControlStatus] = useState<ScreenControlStatus>("none");
  const [volume, setVolume] = useState(1.0);
  const [guestName, setGuestName] = useState("");

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "p-host",
      name: "Producer",
      role: "host",
      isTalkbackActive: false,
      isMuted: false,
      isVstConnected: true,
      screenControl: "none",
      videoEnabled: false,
    },
    {
      id: "p-guest",
      name: "Guest",
      role: "collaborator",
      isTalkbackActive: false,
      isMuted: false,
      isVstConnected: false,
      screenControl: "none",
      videoEnabled: false,
    },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("s2dio_guest_name");
      if (saved) {
        setGuestName(saved);
        setParticipants((prev) =>
          prev.map((p) => (p.role === "collaborator" ? { ...p, name: saved } : p))
        );
      }
    }
    const audioEng = new StudioAudioEngine();
    setEngine(audioEng);
    return () => {
      audioEng.stopTestAudio();
    };
  }, []);

  const handleUpdateParticipantName = (id: string, newName: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
    if (typeof window !== "undefined") {
      localStorage.setItem("s2dio_guest_name", newName);
    }
  };

  const handleStartListening = async () => {
    const finalName = guestName.trim() || "Guest";
    if (typeof window !== "undefined") {
      localStorage.setItem("s2dio_guest_name", finalName);
    }
    setParticipants((prev) =>
      prev.map((p) => (p.role === "collaborator" ? { ...p, name: finalName } : p))
    );

    try {
      await fetch(`/api/sessions/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName, role: "collaborator" }),
      });
    } catch {
      // fallback
    }

    if (engine) {
      engine.init();
      engine.startTestAudio();
    }
    setIsPlaying(true);
  };

  const handleTalkbackChange = (active: boolean) => {
    setIsTalkbackActive(active);
    if (engine) {
      engine.setTalkbackActive(active);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas text-body select-none overflow-hidden font-sans relative">
      {/* Calm Guest Header (Transparent, Borderless) */}
      <header className="h-16 px-6 md:px-10 flex items-center justify-between z-20 bg-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <S2DioLogo variant="full" height={20} className="text-ink hover:text-white transition-colors" />
          </button>

          <div className="h-3 w-[1px] bg-hairline" />
          <span className="text-xs text-mute font-normal">Room: {slug}</span>
        </div>

        <div className="text-[11px] text-mute flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          <span>Lossless 48k Stream</span>
        </div>
      </header>

      {/* Main Focus Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {!isPlaying ? (
          <div className="max-w-md w-full p-8 bg-surface border border-hairline rounded-lg text-center space-y-6 shadow-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-hairline text-xs text-mute">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              <span>Studio Invitation</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-semibold text-ink leading-tight">
              Join the live DAW broadcast.
            </h2>

            <p className="text-sm text-mute leading-relaxed font-sans max-w-sm mx-auto">
              Experience uncompressed 48kHz stereo master bus audio directly from the studio with real-time talkback.
            </p>

            <div className="max-w-xs mx-auto space-y-1.5">
              <input
                type="text"
                placeholder="Enter your name or alias (e.g. Producer, Artist, Engineer)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleStartListening();
                }}
                className="w-full px-3.5 py-2 rounded-md bg-canvas border border-hairline text-ink text-xs placeholder:text-mute focus:outline-hidden focus:border-accent-green/50 text-center transition-colors"
              />
            </div>

            <button
              onClick={handleStartListening}
              className="btn-primary w-full max-w-xs mx-auto"
            >
              Start Listening Now
            </button>
          </div>
        ) : (
          <AudioStage
            isStreaming={isPlaying}
            rmsDbL={-18}
            rmsDbR={-18}
            screenControlStatus={screenControlStatus}
            onRequestControl={() => setScreenControlStatus("requested")}
            onGrantControl={() => {}}
            isHost={false}
            participants={participants}
            onUpdateParticipantName={handleUpdateParticipantName}
          />
        )}
      </main>

      {/* Guest Dock */}
      {isPlaying && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-surface border border-hairline rounded-lg p-2 shadow-2xl">
          <PushToTalkButton
            isActive={isTalkbackActive}
            onStateChange={handleTalkbackChange}
          />

          <div className="h-4 w-[1px] bg-hairline" />

          {/* Master Volume */}
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-mute">Vol</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (engine) engine.setChannelVolume("daw", val);
              }}
              className="w-20 cursor-pointer accent-white"
            />
            <span className="text-xs text-ink w-8 text-right font-medium">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <div className="h-4 w-[1px] bg-hairline" />

          <button
            onClick={() => {
              if (engine) engine.stopTestAudio();
              setIsPlaying(false);
            }}
            className="btn-tertiary h-9 px-3 text-xs"
          >
            Leave
          </button>
        </div>
      )}
    </div>
  );
}
