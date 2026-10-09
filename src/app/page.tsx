"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { S2DioLogo } from "@/components/S2DioLogo";
import { AuthModal } from "@/components/AuthModal";
import { supabase, isSupabaseClientConfigured } from "@/lib/supabase-client";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { Accordion } from "@/components/reactbits/Accordion";
import { StudioGridBackground } from "@/components/reactbits/StudioGridBackground";
import { ScheduleModal } from "@/components/ScheduleModal";

const faqs = [
  {
    id: "faq-1",
    question: "How does S2DIO achieve pristine DAW audio with low latency?",
    answer:
      "Standard communication software filters sound through voice speech codecs that strip bass frequencies and stereo imaging. S2DIO runs a native 64-bit C++ VST3 plugin directly on your master bus, capturing 48kHz 32-bit floating point audio straight from the ASIO output buffer and streaming it over low-overhead WebRTC with sub-5ms local ingest latency.",
  },
  {
    id: "faq-2",
    question: "Do artists or clients need to install any software or plugins?",
    answer:
      "No. S2DIO features a zero-install browser portal. Anyone you send your guest invite link to can listen in full stereo fidelity, watch your DAW screen at 60fps, talk back through their microphone, and exchange stems right inside Google Chrome, Apple Safari, Microsoft Edge, or Firefox without installing plugins or creating an account.",
  },
  {
    id: "faq-3",
    question: "Which DAWs and operating systems are supported?",
    answer:
      "The S2DIO Master Bridge is a universal 64-bit VST3 plugin tested across FL Studio (20/21/24), Ableton Live (11/12), Steinberg Cubase (12/13/14), PreSonus Studio One (6+), Cockos Reaper (7+), and Bitwig Studio. The host app runs on Windows 10 and 11. Remote collaborators can join from any operating system including Windows, macOS, Linux, iOS, and Android.",
  },
  {
    id: "faq-4",
    question: "How does remote DAW screen control work, and is it secure?",
    answer:
      "Remote control lets your co-producer adjust plugin knobs, scrub timeline markers, or edit arrangement regions directly on your screen. Remote input is disabled by default and requires explicit host authorization per session. While active, the collaborator actions are rendered with a distinct co-pilot cursor, and the host can instantly revoke control at any millisecond by hitting the ESC key.",
  },
  {
    id: "faq-5",
    question: "How does smart talkback ducking prevent feedback and echo?",
    answer:
      "S2DIO includes an automated hardware-calibrated ducking circuit. When you or your collaborator speak into the talkback microphone, the DAW master playback stream is instantaneously attenuated by -12dB so conversation remains crystal clear over loud tracks. The moment you stop talking, DAW playback smoothly returns to unity gain without clicks or pops.",
  },
  {
    id: "faq-6",
    question: "Can I transfer large multi-gigabyte stem files during sessions?",
    answer:
      "Yes. S2DIO includes a drag-to-DAW stem exchange zone. You can drag and drop uncompressed 24-bit or 32-bit WAV, AIFF, and MIDI stems directly into the side drawer. Collaborators can download them immediately or drag them straight onto their local DAW timeline without leaving the live session.",
  },
  {
    id: "faq-7",
    question: "Do I need to configure firewall or router port forwarding?",
    answer:
      "No router port forwarding is required. The VST3 plugin communicates with the S2DIO desktop application over local loopback (127.0.0.1:4949), which never exposes raw audio outside your physical machine. Outbound session streaming uses standard WebRTC STUN/TURN traversal over secure HTTPS/WSS (ports 443/80), working transparently behind standard home and studio firewalls.",
  },
  {
    id: "faq-8",
    question: "What is included in the installer download?",
    answer:
      "The Windows setup package (S2DIO-Windows-Setup.exe) installs both the native S2DIO Control Room desktop application and the S2DIO Master Bridge VST3 plugin into your system standard Common Files\\VST3 folder. A standalone ZIP archive with manual installation scripts is also provided for custom studio workstation setups.",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

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
        if (!custom.detail.email && !custom.detail.name) {
          setUser(null);
        } else {
          setUser({
            email: custom.detail.email,
            name: custom.detail.name,
          });
        }
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

  return (
    <div className="min-h-screen flex flex-col bg-studio-canvas text-body font-sans selection:bg-surface-elevated selection:text-ink relative overflow-x-hidden">
      {/* ReactBits Technical Studio Grid Background */}
      <StudioGridBackground />

      {/* Top Studio Header (Clean, Polished Spacing) */}
      <header className="h-16 px-6 md:px-12 flex items-center justify-between bg-transparent z-30">
        <div className="flex items-center gap-3">
          <S2DioLogo variant="full" height={22} className="text-ink hover:text-white transition-colors" />
        </div>

        {/* Right Edge: Local port badge + VST3 download pill + User auth status pill + FAQ Help button */}
        <div className="flex items-center gap-4 text-xs text-mute">
          <div
            className="hidden sm:flex items-center gap-1.5 hover:text-ink transition-colors cursor-default"
            title="Local VST3 Bridge running on port 4949"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="font-mono text-[11px] tracking-tight text-mute">:4949</span>
          </div>

          <a
            href="/downloads/S2DIO-Windows-VST3.zip"
            download="S2DIO-Windows-VST3.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-elevated hover:bg-surface-card border border-hairline text-ink hover:text-white transition-colors text-[11px] font-medium"
            title="Download S2DIO Master Bridge VST3 and 1-click installer"
          >
            <span>Download VST3</span>
            <span className="text-[10px] text-mute">↓</span>
          </a>

          {user ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface-elevated border border-hairline text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              <span className="text-ink font-semibold tracking-tight">{user.name || user.email?.split("@")[0] || "Producer"}</span>
              <span className="w-px h-3 bg-hairline" />
              <button
                onClick={async () => {
                  if (isSupabaseClientConfigured) {
                    await supabase.auth.signOut();
                  }
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("s2dio_auth_email");
                    localStorage.removeItem("s2dio_username");
                    window.dispatchEvent(
                      new CustomEvent("s2dio-auth-change", { detail: { email: null, name: null } })
                    );
                  }
                  setUser(null);
                }}
                className="text-[11px] text-mute hover:text-white transition-colors cursor-pointer"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-surface-elevated hover:bg-surface-card border border-hairline text-xs text-ink hover:text-white transition-colors font-medium cursor-pointer"
            >
              Sign In
            </button>
          )}

          <a
            href="#faqs"
            className="w-7 h-7 rounded-full bg-surface-elevated hover:bg-surface-card border border-hairline flex items-center justify-center text-xs font-mono font-medium text-mute hover:text-ink transition-colors"
            title="Frequently Asked Questions & Help"
            aria-label="FAQ & Help"
          >
            ?
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-6 pt-14 pb-24 flex-1 flex flex-col items-center justify-center space-y-16 z-10">
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
              href="/downloads/S2DIO-Windows-Setup.exe"
              download="S2DIO-Windows-Setup.exe"
              className="btn-primary h-11 px-6 text-sm font-semibold inline-flex items-center gap-2.5 shadow-lg shadow-white/5 cursor-pointer"
            >
              <span>Download S2DIO Installer (.exe)</span>
              <span className="text-xs opacity-75">(5.0 MB)</span>
            </a>

            <button
              onClick={() => setActiveTab(activeTab === "join" ? "create" : "join")}
              className="btn-secondary h-11 px-5 text-sm cursor-pointer"
            >
              Join Room via Code
            </button>

            <button
              onClick={() => setIsScheduleOpen(true)}
              className="btn-secondary h-11 px-5 text-sm inline-flex items-center gap-1.5 cursor-pointer"
              title="Schedule session with calendar invite & .ics export"
            >
              <span>📅</span>
              <span>Schedule Session</span>
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
                className="flex-1 bg-surface-elevated border border-hairline rounded-md px-3 py-2 text-xs text-ink placeholder:text-mute focus:outline-none focus:border-accent-green/50"
                autoFocus
              />
              <button type="submit" className="btn-primary text-xs h-9 px-4">
                Connect →
              </button>
            </form>
          </div>
        )}

        {/* Comprehensive How S2DIO Works Section with ReactBits Spotlight */}
        <section className="w-full max-w-4xl space-y-8 pt-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-hairline text-xs text-mute">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              <span>Studio Ingest Pipeline</span>
            </div>
            <h2 className="text-2xl font-semibold text-ink tracking-tight">How S2DIO Works</h2>
            <p className="text-xs text-mute max-w-lg mx-auto">
              A unified audio pipeline from your DAW master bus straight to your collaborator speakers with zero audio degradation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SpotlightCard className="p-6 space-y-3" spotlightColor="rgba(89, 212, 153, 0.08)">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded bg-surface-elevated border border-hairline flex items-center justify-center text-xs font-mono font-semibold text-ink">
                  01
                </div>
                <span className="text-[10px] font-mono text-mute px-2 py-0.5 rounded bg-surface-elevated">VST3 Plugin</span>
              </div>
              <h3 className="text-sm font-semibold text-ink">Insert Master Bridge</h3>
              <p className="text-xs text-mute leading-relaxed">
                Insert <code className="text-ink bg-surface-elevated px-1 py-0.5 rounded">S2DIO Master Bridge</code> on the final slot of your Master mixer track in FL Studio, Ableton Live, Cubase, Studio One, or Reaper.
              </p>
              <div className="text-[11px] text-stone space-y-1 pt-1 border-t border-hairline/60">
                <div>• Ingests 48kHz 32-bit float audio</div>
                <div>• Sub-5ms internal buffer latency</div>
                <div>• Real-time peak telemetry & clip guard</div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-3" spotlightColor="rgba(89, 212, 153, 0.08)">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded bg-surface-elevated border border-hairline flex items-center justify-center text-xs font-mono font-semibold text-ink">
                  02
                </div>
                <span className="text-[10px] font-mono text-mute px-2 py-0.5 rounded bg-surface-elevated">:4949 Engine</span>
              </div>
              <h3 className="text-sm font-semibold text-ink">Launch Control Room</h3>
              <p className="text-xs text-mute leading-relaxed">
                Open the native S2DIO desktop application. It immediately binds to local loopback port :4949, locking your master audio stream with zero mixed-content barriers.
              </p>
              <div className="text-[11px] text-stone space-y-1 pt-1 border-t border-hairline/60">
                <div>• 60fps high-definition DAW screen share</div>
                <div>• Auto-ducking talkback microphone (-12dB)</div>
                <div>• Producer profile & online friends drawer</div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-3" spotlightColor="rgba(89, 212, 153, 0.08)">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded bg-surface-elevated border border-hairline flex items-center justify-center text-xs font-mono font-semibold text-ink">
                  03
                </div>
                <span className="text-[10px] font-mono text-mute px-2 py-0.5 rounded bg-surface-elevated">Zero-Install</span>
              </div>
              <h3 className="text-sm font-semibold text-ink">Share Guest Link</h3>
              <p className="text-xs text-mute leading-relaxed">
                Click Copy Invite Link to send a private room URL to your client or artist. They join instantly inside any browser without installing software or registering.
              </p>
              <div className="text-[11px] text-stone space-y-1 pt-1 border-t border-hairline/60">
                <div>• Uncompressed stereo listening in browser</div>
                <div>• Drag-to-DAW WAV stem exchange</div>
                <div>• Remote co-pilot control with ESC revoke</div>
              </div>
            </SpotlightCard>
          </div>
        </section>

        {/* Feature Grid: ReactBits Spotlight Cards, Clean Headings, NO Emojis/Icons */}
        <section id="features" className="w-full max-w-4xl space-y-6 pt-10">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-semibold text-ink tracking-tight">Built Specifically for Producers</h2>
            <p className="text-xs text-mute">Engineered for mixdowns, tracking sessions, vocal direction, and remote arrangement.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <SpotlightCard className="p-6 space-y-2.5" spotlightColor="rgba(89, 212, 153, 0.08)">
              <h3 className="text-sm font-semibold text-white tracking-tight">Lossless Float32 PCM</h3>
              <p className="text-xs text-mute leading-relaxed">
                Direct master bus ingestion with 48kHz 32-bit floating point precision. Zero lossy compression during mixdown evaluation.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-2.5" spotlightColor="rgba(89, 212, 153, 0.08)">
              <h3 className="text-sm font-semibold text-white tracking-tight">60fps DAW Screen Share</h3>
              <p className="text-xs text-mute leading-relaxed">
                Stream your arrangement timeline, piano roll, or plugin GUI in high-definition 60fps video with full-screen playback.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-2.5" spotlightColor="rgba(89, 212, 153, 0.08)">
              <h3 className="text-sm font-semibold text-white tracking-tight">Smart Talkback Ducking</h3>
              <p className="text-xs text-mute leading-relaxed">
                Speak naturally while the track plays. DAW playback automatically ducks by -12dB when talkback triggers, then snaps right back.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-2.5" spotlightColor="rgba(89, 212, 153, 0.08)">
              <h3 className="text-sm font-semibold text-white tracking-tight">Drag-to-DAW Stem Exchange</h3>
              <p className="text-xs text-mute leading-relaxed">
                Drop full mixes or vocal takes into the room. Collaborators can drag stems straight from the browser into their DAW timeline.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-2.5" spotlightColor="rgba(89, 212, 153, 0.08)">
              <h3 className="text-sm font-semibold text-white tracking-tight">Ultra-Low Ingest Latency</h3>
              <p className="text-xs text-mute leading-relaxed">
                Sub-5ms local buffer design gives instant feedback as you hit play, scrub markers, or tweak EQ in your DAW.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 space-y-2.5" spotlightColor="rgba(89, 212, 153, 0.08)">
              <h3 className="text-sm font-semibold text-white tracking-tight">Zero-Install Guest Portal</h3>
              <p className="text-xs text-mute leading-relaxed">
                Remote artists and clients join via Chrome, Safari, or Edge without downloading any software or creating an account.
              </p>
            </SpotlightCard>
          </div>
        </section>

        {/* Comprehensive FAQs Section with ReactBits Accordion */}
        <section id="faqs" className="w-full max-w-4xl space-y-6 pt-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-hairline text-xs text-mute">
              <span>Producer Knowledge Base</span>
            </div>
            <h2 className="text-2xl font-semibold text-ink tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-mute max-w-md mx-auto">
              Everything you need to know about setting up S2DIO, latency, audio fidelity, and remote control security.
            </p>
          </div>

          <div className="pt-2">
            <Accordion items={faqs} defaultOpenId="faq-1" />
          </div>
        </section>

        {/* Download Hub / CTA Card */}
        <section className="w-full max-w-4xl bg-surface border border-hairline rounded-xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-semibold text-ink tracking-tight">Ready to Elevate Your Studio Sessions?</h2>
            <p className="text-xs text-mute leading-relaxed">
              Download the 64-bit Windows setup package or grab the standalone VST3 bundle. Collaborators connect instantly in their browser with zero setup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/downloads/S2DIO-Windows-Setup.exe"
              download="S2DIO-Windows-Setup.exe"
              className="btn-primary h-12 px-7 text-sm font-semibold inline-flex items-center gap-2.5 shadow-lg shadow-white/5 cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>Download S2DIO Setup (.exe)</span>
              <span className="text-xs opacity-75">(Windows 64-bit)</span>
            </a>

            <a
              href="/downloads/S2DIO-Windows-VST3.zip"
              download="S2DIO-Windows-VST3.zip"
              className="btn-secondary h-12 px-6 text-sm font-medium inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <span>Download VST3 Bundle (.zip)</span>
            </a>
          </div>

          <div className="text-[11px] text-mute flex flex-wrap items-center justify-center gap-3 pt-2">
            <span>Windows 10 & 11 (64-bit)</span>
            <span>•</span>
            <span>FL Studio • Ableton • Cubase • Reaper • Studio One</span>
            <span>•</span>
            <span>Free for Artists & Collaborators</span>
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

      {/* Schedule Studio Session Modal */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        roomSlug="studio-collab"
        defaultTitle="S2DIO Studio Tracking Session"
      />

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
