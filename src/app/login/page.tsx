"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseClientConfigured } from "@/lib/supabase-client";
import { S2DioLogo } from "@/components/S2DioLogo";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseClientConfigured) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          router.push("/");
        }
      });
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!isSupabaseClientConfigured) {
      setLoading(false);
      if (typeof window !== "undefined") {
        const name = displayName.trim() || email.split("@")[0] || "Producer";
        localStorage.setItem("s2dio_username", name);
        localStorage.setItem("s2dio_auth_email", email);
      }
      setSuccessMsg("Signed in.");
      setTimeout(() => router.push("/"), 500);
      return;
    }

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (typeof window !== "undefined") {
          localStorage.setItem("s2dio_auth_email", email);
        }
        router.push("/");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.trim() || email.split("@")[0],
            },
          },
        });
        if (error) throw error;

        if (displayName.trim() && typeof window !== "undefined") {
          localStorage.setItem("s2dio_username", displayName.trim());
        }

        if (data.session) {
          router.push("/");
        } else {
          setSuccessMsg("Check your inbox: verification email sent.");
        }
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        setSuccessMsg("Magic sign-in link dispatched to your email.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Sign in failed. Verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-canvas text-body font-sans relative">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <button
            onClick={() => router.push("/")}
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <S2DioLogo variant="full" height={26} className="text-ink mx-auto" />
          </button>
          <p className="text-xs text-mute">
            DAW audio collaboration for modern music makers.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-hairline rounded-lg p-6 space-y-6 shadow-2xl">
          {/* Tab selector */}
          <div className="flex rounded-md bg-canvas p-1 border border-hairline text-xs font-medium">
            <button
              type="button"
              onClick={() => { setMode("signin"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 rounded text-center transition-all ${
                mode === "signin"
                  ? "bg-surface text-ink font-semibold shadow-xs"
                  : "text-mute hover:text-ink"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 rounded text-center transition-all ${
                mode === "signup"
                  ? "bg-surface text-ink font-semibold shadow-xs"
                  : "text-mute hover:text-ink"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode("magic"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 rounded text-center transition-all ${
                mode === "magic"
                  ? "bg-surface text-ink font-semibold shadow-xs"
                  : "text-mute hover:text-ink"
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-mute text-[11px] block">Producer Name / Moniker</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Maya, Solar, Metro"
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded text-ink text-xs placeholder:text-mute focus:outline-hidden focus:border-accent-blue/60"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-mute text-[11px] block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="producer@studio.com"
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded text-ink text-xs placeholder:text-mute focus:outline-hidden focus:border-accent-blue/60"
              />
            </div>

            {mode !== "magic" && (
              <div className="space-y-1">
                <label className="text-mute text-[11px] block">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded text-ink text-xs placeholder:text-mute focus:outline-hidden focus:border-accent-blue/60"
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-2 rounded bg-accent-red/10 border border-accent-red/20 text-accent-red text-[11px]">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2 rounded bg-accent-green/10 border border-accent-green/20 text-accent-green text-[11px]">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 rounded bg-ink text-canvas font-medium text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? "Connecting..."
                : mode === "signin"
                ? "Sign In to Studio"
                : mode === "signup"
                ? "Create Producer Account"
                : "Send Magic Link"}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-hairline">
            <button
              onClick={() => router.push("/")}
              className="text-[11px] text-mute hover:text-ink transition-colors"
            >
              ← Back to Studio Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
