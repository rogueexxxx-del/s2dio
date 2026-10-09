"use client";

import React, { useState } from "react";
import { supabase, isSupabaseClientConfigured } from "@/lib/supabase-client";
import { S2DioLogo } from "./S2DioLogo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { email: string; name: string }) => void;
  defaultMode?: "signin" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = "signin",
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "magic">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const fallbackName = displayName.trim() || email.split("@")[0] || "Producer";

    if (!isSupabaseClientConfigured) {
      // Local development fallback simulation
      setLoading(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("s2dio_username", fallbackName);
        localStorage.setItem("s2dio_auth_email", email);
        window.dispatchEvent(new CustomEvent("s2dio-auth-change", { detail: { email, name: fallbackName } }));
      }
      setSuccessMsg("Signed in.");
      setTimeout(() => {
        onSuccess?.({ email, name: fallbackName });
        onClose();
      }, 300);
      return;
    }

    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const resolvedName = data.user?.user_metadata?.display_name || fallbackName;
        if (typeof window !== "undefined") {
          localStorage.setItem("s2dio_auth_email", email);
          localStorage.setItem("s2dio_username", resolvedName);
          window.dispatchEvent(new CustomEvent("s2dio-auth-change", { detail: { email, name: resolvedName } }));
        }
        setSuccessMsg("Signed in successfully.");
        setTimeout(() => {
          onSuccess?.({ email, name: resolvedName });
          onClose();
        }, 300);
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

        const resolvedName = displayName.trim() || email.split("@")[0];
        if (typeof window !== "undefined") {
          localStorage.setItem("s2dio_username", resolvedName);
          localStorage.setItem("s2dio_auth_email", email);
          window.dispatchEvent(new CustomEvent("s2dio-auth-change", { detail: { email, name: resolvedName } }));
        }

        if (data.session) {
          setSuccessMsg("Account created and signed in.");
          setTimeout(() => {
            onSuccess?.({ email, name: resolvedName });
            onClose();
          }, 300);
        } else {
          setSuccessMsg("Verification link sent to your email.");
        }
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        setSuccessMsg("Magic sign-in link sent to your email.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-surface border border-hairline rounded-lg p-6 space-y-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <S2DioLogo variant="monogram" height={18} className="text-ink" />
            <span className="font-semibold text-sm text-ink tracking-tight">S2DIO Studio</span>
          </div>

          <button
            onClick={onClose}
            className="text-mute hover:text-ink text-xs px-2 py-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
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
            Create Account
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-mute text-[11px] block">Producer Name / Tag</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your producer name or alias"
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
              ? "Sign In"
              : mode === "signup"
              ? "Create Producer Account"
              : "Send Magic Link"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[11px] text-mute">
            Collaborators joining via guest link do not need an account.
          </p>
        </div>
      </div>
    </div>
  );
}
