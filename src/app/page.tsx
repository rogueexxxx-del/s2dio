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

          <a
            href="/downloads/S2DIO-Windows-VST3.zip"
            download="S2DIO-Windows-VST3.zip"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-card border border-hairline text-ink hover:text-white transition-colors text-[11px] font-medium"
            title="Download S2DIO Master Bridge VST3 and 1-click installer for FL Studio, Ableton, Cubase"
          >
            <span>Download VST3</span>
            <span className="text-[10px] text-mute">↓</span>
          </a>

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
      <main className="max-w-5xl w-full mx-auto px-6 pt-16 pb-24 flex-1 flex flex-col items-center justify-center space-y-16 z-10">
        {/* Pitch Headline & Download Primary Action */}
        <div className="text-center space-y-5 max-w-3xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-hairline text-xs text-mute">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
            <span className="text-ink font-medium">S2DIO v1.0 for Windows</span>
            <span className="text-stone">•</span>
            <span>48kHz Float32 Master Stream</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-lemon font-normal text-ink tracking-tight leading-tight">
            Real-time audio collaboration for music producers
          </h1>

          <p className="text-base md:text-lg text-mute leading-relaxed max-w-2xl mx-auto">
            Stream your DAW master bus in uncompressed stereo directly to clients and collaborators with 60fps screen sharing, smart auto-ducking talkback, and drag-and-drop stem exchange.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <a
              href="/downloads/S2DIO-Windows-VST3.zip"
              download="S2DIO-Windows-VST3.zip"
              className="btn-primary h-11 px-6 text-sm font-semibold inline-flex items-center gap-2.5 shadow-lg shadow-white/5"
            >
              <span>Download S2DIO for Windows</span>
              <span className="text-xs opacity-75">(.zip • 7.5 MB)</span>
            </a>

            <button
              onClick={() => setActiveTab(activeTab === "join" ? "create" : "join")}
              className="btn-secondary h-11 px-5 text-sm"
            >
              Join Room via Code
            </button>
          </div>

          <div className="text-[11px] text-mute flex items-center justify-center gap-3 pt-1">
            <span>Includes S2DIO Control Room (.exe)</span>
            <span>•</span>
            <span>VST3 64-bit Plugin</span>
            <span>•</span>
            <span>1-Click Installer</span>
          </div>
        </div>

        {/* Join Session Card (Appears cleanly when user wants to connect to a room) */}
        {activeTab === "join" && (
          <div className="w-full max-w-md bg-surface border border-hairline rounded-lg p-5 shadow-2xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Enter Collaborator Studio</span>
              <button
                onClick={() => setActiveTab("create")}
                className="text-xs text-mute hover:text-ink"
              >
                ✕ Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste room code or guest URL..."
                className="flex-1 bg-surface-elevated border border-hairline rounded-md px-3 py-2 text-xs text-ink placeholder:text-mute focus:outline-none focus:border-accent-blue/50"
                autoFocus
              />
              <button type="submit" className="btn-primary text-xs h-9 px-4">
                Connect →
              </button>
            </form>
          </div>
        )}

        {/* 3-Step Setup Guide */}
        <section className="w-full max-w-4xl space-y-6 pt-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-semibold text-ink tracking-tight">How S2DIO Works</h2>
            <p className="text-xs text-mute">One unified pipeline from your DAW master bus straight to your collaborator's speakers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-6 h-6 rounded bg-surface-elevated border border-hairline flex items-center justify-center text-xs font-mono font-semibold text-ink">
                1
              </div>
              <h3 className="text-sm font-medium text-ink">Install & Insert</h3>
              <p className="text-xs text-mute leading-relaxed">
                Run the 1-click installer and insert <code className="text-ink">S2DIO Master Bridge</code> onto your Master mixer track in FL Studio, Ableton, Cubase, or Reaper.
              </p>
            </div>

            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-6 h-6 rounded bg-surface-elevated border border-hairline flex items-center justify-center text-xs font-mono font-semibold text-ink">
                2
              </div>
              <h3 className="text-sm font-medium text-ink">Launch Control Room (.exe)</h3>
              <p className="text-xs text-mute leading-relaxed">
                Open the native S2DIO desktop app. It instantly hooks into your DAW master stream with zero mixed-content blocks, mixer trims, and talkback calibration.
              </p>
            </div>

            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-6 h-6 rounded bg-surface-elevated border border-hairline flex items-center justify-center text-xs font-mono font-semibold text-ink">
                3
              </div>
              <h3 className="text-sm font-medium text-ink">Send Zero-Install Link</h3>
              <p className="text-xs text-mute leading-relaxed">
                Click Copy Invite Link and send it to your artists or clients. They join directly in their web browser with no plugin, no login, and no DAW installed.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="w-full max-w-4xl space-y-6 pt-10">
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-semibold text-ink tracking-tight">Built Specifically for Producers</h2>
            <p className="text-xs text-mute">Everything you need for live production, vocal direction, and mixdown sessions.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
                🎛
              </div>
              <h3 className="text-sm font-semibold text-ink">Lossless Float32 PCM</h3>
              <p className="text-xs text-mute leading-relaxed">
                Direct master bus ingestion with 48kHz 32-bit floating point precision. Zero lossy compression during mixdown evaluation.
              </p>
            </div>

            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
                🖥
              </div>
              <h3 className="text-sm font-semibold text-ink">60fps DAW Screen Share</h3>
              <p className="text-xs text-mute leading-relaxed">
                Stream your arrangement timeline, piano roll, or plugin GUI in high-definition 60fps video with full-screen playback.
              </p>
            </div>

            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
                🎙
              </div>
              <h3 className="text-sm font-semibold text-ink">Smart Talkback Ducking</h3>
              <p className="text-xs text-mute leading-relaxed">
                Speak naturally while the track plays. DAW playback automatically ducks by -12dB when talkback triggers, then snaps right back.
              </p>
            </div>

            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
                📁
              </div>
              <h3 className="text-sm font-semibold text-ink">Drag-to-DAW Stem Exchange</h3>
              <p className="text-xs text-mute leading-relaxed">
                Drop full mixes or vocal takes into the room. Collaborators can drag stems straight from the browser into their DAW timeline.
              </p>
            </div>

            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
                ⚡
              </div>
              <h3 className="text-sm font-semibold text-ink">Ultra-Low Ingest Latency</h3>
              <p className="text-xs text-mute leading-relaxed">
                Sub-5ms local buffer design gives instant feedback as you hit play, scrub markers, or tweak EQ in your DAW.
              </p>
            </div>

            <div className="bg-surface border border-hairline rounded-lg p-5 space-y-2">
              <div className="w-8 h-8 rounded-md bg-surface-elevated border border-hairline flex items-center justify-center text-xs text-ink">
                🌐
              </div>
              <h3 className="text-sm font-semibold text-ink">Zero-Install Guest Portal</h3>
              <p className="text-xs text-mute leading-relaxed">
                Remote artists and clients join via Chrome, Safari, or Edge without downloading any software or creating an account.
              </p>
            </div>
          </div>
        </section>

        {/* DAW Compatibility Badge Strip */}
        <div className="w-full max-w-4xl py-6 px-4 bg-surface border border-hairline rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mute">
          <div>
            <span className="text-ink font-medium">DAW Support: </span>
            <span>FL Studio 20+ • Ableton Live 11+ • Cubase 12+ • Studio One 6+ • Reaper 7+</span>
          </div>
          <div className="text-[11px] text-stone">
            Platform: Windows 10/11 64-bit VST3
          </div>
        </div>
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
