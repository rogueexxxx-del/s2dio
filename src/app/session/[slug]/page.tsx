"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AudioChannel, ChatMessage, SessionFile, ScreenControlStatus, Participant } from "@/lib/types";
import { StudioAudioEngine } from "@/lib/audio-engine";
import { PushToTalkButton } from "@/components/PushToTalkButton";
import { AudioStage } from "@/components/AudioStage";
import { MixerPopover } from "@/components/MixerPopover";
import { FileTransferDrawer } from "@/components/FileTransferDrawer";
import { AudioSettingsModal } from "@/components/AudioSettingsModal";
import { S2DioLogo } from "@/components/S2DioLogo";
import { AuthModal } from "@/components/AuthModal";
import { supabase, isSupabaseClientConfigured } from "@/lib/supabase-client";

export default function StudioRoomPage() {
  const params = useParams();
  const slug = (params.slug as string) || "session";
  const router = useRouter();

  const [engine, setEngine] = useState<StudioAudioEngine | null>(null);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);
  const [isTalkbackActive, setIsTalkbackActive] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [screenControlStatus, setScreenControlStatus] = useState<ScreenControlStatus>("none");
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [hostName, setHostName] = useState("Producer");

  const handleToggleScreenShare = async () => {
    if (isScreenSharing && screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: 60,
          },
          audio: false,
        });

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setScreenStream(null);
            setIsScreenSharing(false);
          };
        }

        setScreenStream(stream);
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.log("Screen share cancelled or not allowed:", err);
    }
  };

  const handleToggleCamera = async () => {
    if (isCameraActive && cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setCameraStream(null);
            setIsCameraActive(false);
          };
        }

        setCameraStream(stream);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.log("Camera access error or cancelled:", err);
    }
  };

  // Participants
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
      name: "Collaborator",
      role: "collaborator",
      isTalkbackActive: false,
      isMuted: false,
      isVstConnected: false,
      screenControl: "none",
      videoEnabled: false,
    },
  ]);

  useEffect(() => {
    // Initial sync from local storage for instant render
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("s2dio_auth_email");
      const savedName = localStorage.getItem("s2dio_username");
      if (savedEmail || savedName) {
        const profile = {
          email: savedEmail || undefined,
          name: savedName || savedEmail?.split("@")[0] || "Producer",
        };
        setUser(profile);
        setHostName(profile.name);
        setParticipants((prev) =>
          prev.map((p) => (p.role === "host" ? { ...p, name: profile.name } : p))
        );
      }
    }

    let authUnsub: (() => void) | null = null;
    if (isSupabaseClientConfigured) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          const authName =
            data.user.user_metadata?.display_name ||
            data.user.email?.split("@")[0] ||
            "Producer";
          const profile = { email: data.user.email, name: authName };
          setUser(profile);
          setHostName(authName);
          setParticipants((prev) =>
            prev.map((p) => (p.role === "host" ? { ...p, name: authName } : p))
          );
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authName =
            session.user.user_metadata?.display_name ||
            session.user.email?.split("@")[0] ||
            "Producer";
          const profile = { email: session.user.email, name: authName };
          setUser(profile);
          setHostName(authName);
        } else {
          setUser(null);
        }
      });

      authUnsub = () => authListener.subscription.unsubscribe();
    }

    return () => {
      if (authUnsub) authUnsub();
    };
  }, []);

  const handleUpdateParticipantName = (id: string, newName: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          if (p.role === "host") {
            setHostName(newName);
            if (typeof window !== "undefined") {
              localStorage.setItem("s2dio_username", newName);
            }
          }
          return { ...p, name: newName };
        }
        return p;
      })
    );
  };

  // Channels
  const [channels, setChannels] = useState<AudioChannel[]>([
    {
      id: "ch-daw",
      name: "Master DAW",
      type: "daw",
      ownerName: "VST3 Ingest",
      volume: 1.0,
      pan: 0,
      isMuted: false,
      isSolo: false,
      peakDbL: -60,
      peakDbR: -60,
      rmsDbL: -60,
      rmsDbR: -60,
      isClipping: false,
    },
    {
      id: "ch-talkback",
      name: "Talkback",
      type: "talkback",
      ownerName: "Mic In",
      volume: 1.0,
      pan: 0,
      isMuted: false,
      isSolo: false,
      peakDbL: -60,
      peakDbR: -60,
      rmsDbL: -60,
      rmsDbR: -60,
      isClipping: false,
    },
    {
      id: "ch-guest",
      name: "Collaborator",
      type: "guest",
      ownerName: "Remote",
      volume: 0.95,
      pan: 0,
      isMuted: false,
      isSolo: false,
      peakDbL: -24,
      peakDbR: -24,
      rmsDbL: -26,
      rmsDbR: -26,
      isClipping: false,
    },
  ]);

  // Chat & Files
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      senderId: "system",
      senderName: "System",
      text: "Session connected. Master bus stream locked at 48kHz Float32.",
      timestamp: "00:00",
      isSystem: true,
    },
    {
      id: "m-2",
      senderId: "u-2",
      senderName: "Alex",
      text: "Audio is coming through pristine and wide.",
      timestamp: "00:02",
    },
  ]);

  const [files, setFiles] = useState<SessionFile[]>([
    {
      id: "f-1",
      name: "Lead_Vocal_Take1_24bit.wav",
      sizeBytes: 18454932,
      uploaderName: "Alex",
      type: "wav",
      uploadedAt: "00:01",
    },
  ]);

  // Audio Engine Lifecycle
  useEffect(() => {
    const audioEng = new StudioAudioEngine((connected) => {
      setIsPlayingTestAudio(connected);
      setParticipants((prev) =>
        prev.map((p) => (p.role === "host" ? { ...p, isVstConnected: connected } : p))
      );
    });
    setEngine(audioEng);

    // Prompt browser audio unlock on user interaction anywhere in the window
    const unlockAudio = () => {
      audioEng.resume();
    };
    window.addEventListener("click", unlockAudio);
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    let animId: number;
    const updateMeters = () => {
      if (audioEng) {
        const levels = audioEng.getLevels();
        setChannels((prev) =>
          prev.map((ch) => {
            if (ch.type === "daw") {
              return {
                ...ch,
                rmsDbL: levels.dawL,
                rmsDbR: levels.dawR,
                peakDbL: Math.max(ch.peakDbL, levels.dawL),
                peakDbR: Math.max(ch.peakDbR, levels.dawR),
              };
            }
            if (ch.type === "talkback") {
              return {
                ...ch,
                rmsDbL: levels.mic,
                rmsDbR: levels.mic,
              };
            }
            return ch;
          })
        );
      }
      animId = requestAnimationFrame(updateMeters);
    };

    animId = requestAnimationFrame(updateMeters);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      audioEng.stopTestAudio();
    };
  }, []);

  const handleToggleTestAudio = () => {
    if (engine) {
      const active = engine.toggleTestAudio();
      setIsPlayingTestAudio(active);
    }
  };

  const handleTalkbackChange = (active: boolean) => {
    setIsTalkbackActive(active);
    setParticipants((prev) =>
      prev.map((p) => (p.role === "host" ? { ...p, isTalkbackActive: active } : p))
    );
    if (engine) {
      engine.setTalkbackActive(active);
    }
  };

  const handleVolumeChange = (id: string, vol: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, volume: vol } : ch))
    );
    if (engine) {
      const ch = channels.find((c) => c.id === id);
      if (ch?.type === "daw") engine.setChannelVolume("daw", vol);
      if (ch?.type === "talkback") engine.setChannelVolume("talkback", vol);
    }
  };

  const handleMuteToggle = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isMuted: !ch.isMuted } : ch))
    );
  };

  const handleSoloToggle = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, isSolo: !ch.isSolo } : ch))
    );
  };

  const handleSendMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        senderId: "host",
        senderName: hostName,
        text,
        timestamp: "Now",
      },
    ]);
  };

  const handleUploadFile = async (file: File) => {
    const tempId = `f-${Date.now()}`;
    const newFile: SessionFile = {
      id: tempId,
      name: file.name,
      sizeBytes: file.size,
      uploaderName: hostName,
      type: file.name.endsWith(".mid") ? "midi" : "wav",
      uploadedAt: "Now",
    };
    setFiles((prev) => [...prev, newFile]);

    try {
      const presignRes = await fetch(`/api/sessions/${slug}/files/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || "audio/wav",
          uploaderName: "Producer",
        }),
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();
        await fetch(`/api/sessions/${slug}/files/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: presignData.fileId,
            fileName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || "audio/wav",
            storagePath: presignData.storagePath,
            uploaderName: "Producer",
          }),
        });
      }
    } catch (e) {
      console.error("Backend file sync:", e);
    }
  };

  const handleCopyInvite = () => {
    const guestUrl = `${window.location.origin}/guest/${slug}`;
    navigator.clipboard.writeText(guestUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const dawChannel = channels.find((c) => c.type === "daw");

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas text-body overflow-hidden select-none font-sans relative">
      {/* Top Header Bar */}
      <header className="h-14 px-6 md:px-8 flex items-center justify-between z-20 bg-transparent border-b border-hairline/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <S2DioLogo variant="full" height={18} className="text-ink hover:text-white transition-colors" />
          </button>

          <div className="h-3.5 w-[1px] bg-hairline" />

          <span className="text-xs text-mute font-normal font-mono max-w-[200px] truncate">
            {slug}
          </span>

          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-elevated border border-hairline font-mono text-[10px] text-mute ml-2"
            title="Local VST3 Ingest on 127.0.0.1:4949"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span>:4949 Ingest</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* User Account / Login details */}
          {user ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface border border-hairline text-xs">
              <span className="w-2 h-2 rounded-full bg-accent-blue" />
              <span className="text-ink font-medium max-w-[140px] truncate">{user.name || user.email}</span>
              <button
                onClick={async () => {
                  if (isSupabaseClientConfigured) {
                    await supabase.auth.signOut();
                  }
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("s2dio_auth_email");
                  }
                  setUser(null);
                }}
                className="text-[10px] text-mute hover:text-ink transition-colors ml-1 cursor-pointer"
                title="Sign out of account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-xs text-mute hover:text-ink font-medium px-2.5 py-1 rounded-md bg-surface border border-hairline transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Copy Invite Link */}
          <button
            onClick={handleCopyInvite}
            className="btn-primary text-xs h-8 px-3.5 whitespace-nowrap cursor-pointer"
          >
            {copiedLink ? "✓ Copied" : "Copy Invite Link"}
          </button>
        </div>
      </header>

      {/* Main Focus Canvas Stage */}
      <main className="flex-1 flex overflow-hidden relative">
        <AudioStage
          isStreaming={isPlayingTestAudio || (dawChannel ? dawChannel.rmsDbL > -55 : false)}
          rmsDbL={dawChannel?.rmsDbL || -60}
          rmsDbR={dawChannel?.rmsDbR || -60}
          screenControlStatus={screenControlStatus}
          onRequestControl={() => setScreenControlStatus("requested")}
          onGrantControl={(granted) => setScreenControlStatus(granted ? "granted" : "none")}
          isHost={true}
          participants={participants}
          onUpdateParticipantName={handleUpdateParticipantName}
          onInviteClick={handleCopyInvite}
          videoStream={screenStream}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={handleToggleScreenShare}
          cameraStream={cameraStream}
          isCameraActive={isCameraActive}
          onToggleCamera={handleToggleCamera}
        />

        {/* Slide-over Notes & Files Drawer */}
        {isDrawerOpen && (
          <div className="absolute right-0 top-0 bottom-0 z-30 shadow-2xl animate-in slide-in-from-right duration-150">
            <FileTransferDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              messages={messages}
              files={files}
              onSendMessage={handleSendMessage}
              onUploadFile={handleUploadFile}
            />
          </div>
        )}
      </main>

      {/* Floating Zen Bottom Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-surface/95 backdrop-blur-xl border border-hairline-strong rounded-xl p-2 shadow-2xl whitespace-nowrap">
        {/* Push to talk */}
        <PushToTalkButton
          isActive={isTalkbackActive}
          onStateChange={handleTalkbackChange}
        />

        <div className="h-5 w-[1px] bg-hairline mx-1" />

        {/* Share DAW Screen Video Transmission */}
        <button
          onClick={handleToggleScreenShare}
          className={`h-9 px-3.5 text-xs rounded-md border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            isScreenSharing
              ? "bg-accent-red text-white border-accent-red font-medium"
              : "btn-tertiary"
          }`}
          title="Stream DAW Window or Screen Live (60fps)"
        >
          <span>🖥</span>
          <span>{isScreenSharing ? "Stop DAW" : "Share DAW"}</span>
        </button>

        {/* Toggle Studio Camera Video Transmission */}
        <button
          onClick={handleToggleCamera}
          className={`h-9 px-3.5 text-xs rounded-md border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            isCameraActive
              ? "bg-accent-blue text-white border-accent-blue font-medium"
              : "btn-tertiary"
          }`}
          title="Broadcast Studio Webcam"
        >
          <span>📷</span>
          <span>{isCameraActive ? "Stop Cam" : "Camera"}</span>
        </button>

        {/* Play/Stop Audio Test */}
        <button
          onClick={handleToggleTestAudio}
          className={`h-9 px-3.5 text-xs font-medium rounded-md transition-colors border whitespace-nowrap cursor-pointer ${
            isPlayingTestAudio
              ? "bg-accent-red text-white border-accent-red"
              : "btn-tertiary"
          }`}
        >
          {isPlayingTestAudio ? "Stop Audio" : "Play Demo"}
        </button>

        {/* Console Trims Modal Trigger */}
        <button
          onClick={() => setIsMixerOpen(true)}
          className="btn-tertiary h-9 px-3.5 text-xs whitespace-nowrap cursor-pointer"
        >
          Mixer Trims
        </button>

        {/* Notes & Files Toggle */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={`h-9 px-3.5 text-xs rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
            isDrawerOpen
              ? "bg-surface-card border-hairline-strong text-ink font-semibold"
              : "btn-tertiary"
          }`}
        >
          Notes & Stems
        </button>

        {/* Audio Engine Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="btn-tertiary h-9 px-3.5 text-xs whitespace-nowrap cursor-pointer"
        >
          Engine
        </button>
      </div>

      {/* Floating Mixer Trims Popover */}
      <MixerPopover
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        channels={channels}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onSoloToggle={handleSoloToggle}
      />

      {/* Audio Hardware & VST3 Settings Modal */}
      {engine && (
        <AudioSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={engine.config}
          onConfigChange={(newCfg) => {
            Object.assign(engine.config, newCfg);
          }}
          onReconnectVst={() => engine.connectVstBridge()}
        />
      )}

      {/* Sign In & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setHostName(u.name);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
