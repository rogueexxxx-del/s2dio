"use client";

import React, { useEffect, useState, useRef } from "react";

interface VoicePillProps {
  isActive: boolean;
  onStateChange: (active: boolean) => void;
  label?: string;
  sublabel?: string;
}

export function VoicePill({
  isActive,
  onStateChange,
  label = "Talkback",
  sublabel = "␣ Space",
}: VoicePillProps) {
  const [isLatched, setIsLatched] = useState(false);
  const lastClickRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.code === "Space" && !e.repeat && !isLatched) {
        e.preventDefault();
        onStateChange(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.code === "Space" && !isLatched) {
        e.preventDefault();
        onStateChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isLatched, onStateChange]);

  const handleMouseDown = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 300) {
      const nextLatched = !isLatched;
      setIsLatched(nextLatched);
      onStateChange(nextLatched);
    } else {
      if (!isLatched) {
        onStateChange(true);
      }
    }
    lastClickRef.current = now;
  };

  const handleMouseUp = () => {
    if (!isLatched) {
      onStateChange(false);
    }
  };

  return (
    <div className="relative inline-flex items-center select-none font-sans">
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all duration-150 h-9 ${
          isActive
            ? "bg-primary text-on-primary border-primary font-medium"
            : "bg-surface-elevated border-hairline text-ink hover:border-hairline-strong"
        }`}
        title="Hold Spacebar to talk, or double-click to latch open"
      >
        {/* Animated Voice Harmonic Bars */}
        <div className="flex items-center gap-[2px] h-3.5 px-0.5">
          {[0.4, 0.9, 0.6, 1.0, 0.5].map((scale, i) => (
            <span
              key={i}
              className={`w-[2px] rounded-full transition-all duration-150 ${
                isActive
                  ? "bg-on-primary animate-pulse"
                  : "bg-mute group-hover:bg-ink"
              }`}
              style={{
                height: isActive ? `${Math.max(4, scale * 12)}px` : "4px",
                animationDelay: `${i * 90}ms`,
                animationDuration: "500ms",
              }}
            />
          ))}
        </div>

        <span className="text-sm font-medium">
          {isActive ? (isLatched ? `${label} (Latched)` : `${label} Live`) : label}
        </span>

        {sublabel && (
          <span
            className={`keycap text-xs ${
              isActive ? "bg-black/10 border-black/20 text-black shadow-none" : ""
            }`}
          >
            {sublabel}
          </span>
        )}
      </button>
    </div>
  );
}
