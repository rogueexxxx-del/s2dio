"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlideSelect } from "@/components/micro/GlideSelect";
import { S2DioLogo } from "@/components/S2DioLogo";
import { AuthModal } from "@/components/AuthModal";
import { supabase, isSupabaseClientConfigured } from "@/lib/supabase-client";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Initial load from storage for immediate fast render
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem("s2dio_auth_email");
      const savedName = localStorage.getItem("s2dio_username");
      if (savedEmail || savedName) {
        setUser({
          email: savedEmail || undefined,
          name: savedName || savedEmail?.split("@")[0] || "Producer",
        });
      }
    }

    const onAuthEvent = (e: Event) => {
      const custom = e as CustomEvent<{ email?: string; name?: string }>;
      if (custom.detail) {
        setUser({
          email: custom.detail.email,
          name: custom.detail.name,
        });
      }
    };
    window.addEventListener("s2dio-auth-change", onAuthEvent);

    let authUnsub: (() => void) | null = null;
    if (isSupabaseClientConfigured) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          const profile = {
            email: data.user.email,
            name: data.user.user_metadata?.display_name || data.user.email?.split("@")[0] || "Producer",
          };
          setUser(profile);
          if (typeof window !== "undefined") {
            if (profile.email) localStorage.setItem("s2dio_auth_email", profile.email);
            if (profile.name) localStorage.setItem("s2dio_username", profile.name);
          }
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const profile = {
            email: session.user.email,
            name: session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "Producer",
          };
          setUser(profile);
          if (typeof window !== "undefined") {
            if (profile.email) localStorage.setItem("s2dio_auth_email", profile.email);
            if (profile.name) localStorage.setItem("s2dio_username", profile.name);
          }
        } else {
          setUser(null);
        }
      });

      authUnsub = () => authListener.subscription.unsubscribe();
    }

    return () => {
      window.removeEventListener("s2dio-auth-change", onAuthEvent);
      if (authUnsub) authUnsub();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const sessionTitle = inputValue.trim() || "Studio Session";

    if (activeTab === "create") {
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: sessionTitle }),
        });
        const data = await res.json();
        if (data?.slug) {
          router.push(`/session/${data.slug}`);
          return;
        }
      } catch {
        // fallback to client slug
      }
      const slug =
        (inputValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "session") +
        "-" +
        Math.random().toString(36).substring(2, 6);
      router.push(`/session/${slug}`);
    } else {
      router.push(`/session/${inputValue.trim()}`);
    }
  };

  const handleLaunchQuick = async (name: string) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name }),
      });
      const data = await res.json();
      if (data?.slug) {
        router.push(`/session/${data.slug}`);
        return;
      }
    } catch {
      // fallback
    }
    const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;
    router.push(`/session/${slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-studio-canvas text-body font-sans selection:bg-surface-elevated selection:text-ink relative">
      {/* Top Studio Header (Transparent, Borderless) */}
      <header className="h-16 px-6 md:px-12 flex items-center justify-between bg-transparent z-30">
        <div className="flex items-center gap-3">
          <S2DioLogo variant="full" height={22} className="text-ink hover:text-white transition-colors" />
        </div>

        {/* Right Edge: Connection symbol with port + User status + Question mark symbol (No borders) */}
        <div className="flex items-center gap-5 text-xs text-mute">
          <div
            className="flex items-center gap-1.5 hover:text-ink transition-colors cursor-default"
            title="Local VST3 Bridge running on port 4949"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="font-mono text-[11px] tracking-tight text-mute">:4949</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-ink font-medium text-xs">{user.name || user.email}</span>
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
                className="text-[11px] text-mute hover:text-ink transition-colors cursor-pointer"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-xs text-mute hover:text-ink transition-colors font-medium cursor-pointer"
            >
              Sign In
            </button>
          )}

          <a
            href="#features"
            className="w-7 h-7 flex items-center justify-center text-sm font-medium text-mute hover:text-ink transition-colors"
            title="How it works / Help"
            aria-label="How it works"
          >
            ?
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-6 pt-12 pb-24 flex-1 flex flex-col items-center justify-center space-y-10 z-10">
        {/* Pitch Headline (Ends cleanly at 'music' in 1 line) */}
        <div className="text-center space-y-4 max-w-4xl mx-auto w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-lemon font-normal text-ink tracking-tight whitespace-nowrap">
            Real-time audio collaboration for music
          </h1>

          <p className="text-base md:text-lg text-mute leading-relaxed max-w-2xl mx-auto">
            Stream your DAW master bus in pristine 48kHz Float32 stereo. Talk back with automatic ducking and drop stems directly into the timeline.
          </p>
        </div>

        {/* Spread Studio Session Control Card */}
        <div className="w-full max-w-3xl bg-surface border border-hairline rounded-lg overflow-hidden shadow-2xl">
          {/* Top Mode Selector */}
          <div className="p-4 border-b border-hairline flex items-center justify-between bg-surface-elevated/40">
            <GlideSelect
              options={[
                { id: "create", label: "Start Session" },
                { id: "join", label: "Join via Link / Code" },
              ]}
              activeId={activeTab}
              onChange={(id) => {
                setActiveTab(id as "create" | "join");
                setInputValue("");
              }}
              size="sm"
            />
          </div>

          {/* Session Input Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="flex items-center gap-3 bg-surface-elevated border border-hairline rounded-md p-1.5 focus-within:border-hairline-strong transition-colors">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  activeTab === "create"
                    ? "Session title (e.g. Master Mix Review, Vocal Tracking)..."
                    : "Paste room code or guest URL..."
                }
                className="flex-1 bg-transparent px-3.5 py-2 text-sm text-ink placeholder:text-mute focus:outline-none"
                autoFocus
              />

              <button
                type="submit"
                className="btn-primary"
              >
                {activeTab === "create" ? "Open Studio →" : "Connect →"}
              </button>
            </div>
          </form>

          {/* Quick Presets for Producers */}
          {activeTab === "create" && (
            <div className="px-5 pb-5 pt-1">
              <div className="text-[11px] uppercase tracking-wider text-mute mb-2.5">
                Session Presets
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleLaunchQuick("Mixdown Review")}
                  className="p-3.5 text-left bg-surface-elevated/60 hover:bg-surface-elevated border border-hairline hover:border-hairline-strong rounded-md transition-all group"
                >
                  <div className="text-xs font-medium text-ink group-hover:text-white">Mixdown Review</div>
                  <div className="text-[11px] text-mute mt-0.5">48k stereo master</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchQuick("Tracking Session")}
                  className="p-3.5 text-left bg-surface-elevated/60 hover:bg-surface-elevated border border-hairline hover:border-hairline-strong rounded-md transition-all group"
                >
                  <div className="text-xs font-medium text-ink group-hover:text-white">Tracking & Vocal</div>
                  <div className="text-[11px] text-mute mt-0.5">Auto-ducking talkback</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunchQuick("Stem Drop")}
                  className="p-3.5 text-left bg-surface-elevated/60 hover:bg-surface-elevated border border-hairline hover:border-hairline-strong rounded-md transition-all group"
                >
                  <div className="text-xs font-medium text-ink group-hover:text-white">Stem Exchange</div>
                  <div className="text-[11px] text-mute mt-0.5">Drag into arrangement</div>
                </button>
              </div>
            </div>
          )}

          {/* Hardware & DAW Status Bar (Single place for connection info, no duplicate green dot) */}
          <div className="px-5 py-3 border-t border-hairline bg-surface-elevated/30 flex items-center justify-between text-xs text-mute">
            <div className="flex items-center gap-2">
              <span>Stream: <strong className="text-ink font-normal">48.0 kHz 32-bit Float Stereo</strong></span>
            </div>

            <div className="text-[11px] text-stone hidden sm:inline">
              Ableton • FL Studio • Logic • Pro Tools
            </div>
          </div>
        </div>

        {/* 3 Key Pillars for Music Collaboration (Pushed lower with generous spacing) */}
        <section id="features" className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 pt-20 md:pt-28">
          <div className="bg-surface border border-hairline rounded-lg p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
              🎛
            </div>
            <h3 className="text-sm font-semibold text-ink">Direct VST3 Plugin Ingestion</h3>
            <p className="text-xs text-mute leading-relaxed">
              No virtual audio cable drivers or BlackHole configs. Place the VST3 bridge on your master output and audio streams losslessly.
            </p>
          </div>

          <div className="bg-surface border border-hairline rounded-lg p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
              🎙
            </div>
            <h3 className="text-sm font-semibold text-ink">Smart Talkback Ducking</h3>
            <p className="text-xs text-mute leading-relaxed">
              Talk naturally while the music plays. DAW playback smoothly ducks by -12dB when you speak, then snaps right back.
            </p>
          </div>

          <div className="bg-surface border border-hairline rounded-lg p-6 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
              📁
            </div>
            <h3 className="text-sm font-semibold text-ink">Drag-to-DAW Stem Exchange</h3>
            <p className="text-xs text-mute leading-relaxed">
              Drop full mixes or vocal takes into the room. Collaborators can drag stems straight from the browser into their DAW timeline.
            </p>
          </div>
        </section>
      </main>

      {/* Clean Studio Footer (Borderless, Blends into Background) */}
      <footer className="py-8 px-6 md:px-12 bg-transparent text-xs text-mute/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-ink font-medium">S2DIO</span>
          <span className="text-stone">•</span>
          <span>Lossless Audio Collab for Music Creators</span>
        </div>

        <div className="flex items-center gap-4 text-stone">
          <span>Latency target: ~3ms</span>
          <span>•</span>
          <span>Float32 PCM • WebRTC Talkback</span>
        </div>
      </footer>

      {/* Sign In & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
