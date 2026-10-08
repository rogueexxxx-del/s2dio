"use client";

import React, { useState } from "react";

interface PromptBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function PromptBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Enter command or session name...",
  submitLabel = "Launch",
  autoFocus = false,
}: PromptBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      className={`group relative flex items-center bg-surface-elevated border rounded-md transition-all duration-150 p-1 font-sans ${
        isFocused
          ? "border-hairline-strong bg-surface-card"
          : "border-hairline hover:border-hairline-strong"
      }`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-1.5 text-sm text-ink placeholder:text-mute focus:outline-none tracking-normal"
        autoFocus={autoFocus}
      />

      <div className="flex items-center gap-2 pr-1">
        {value.trim().length > 0 && (
          <span className="keycap hidden sm:inline-flex">
            ⏎ Enter
          </span>
        )}
        <button
          type="submit"
          className="btn-primary"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
