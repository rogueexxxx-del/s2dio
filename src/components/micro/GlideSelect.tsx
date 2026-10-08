"use client";

import React, { useRef, useEffect, useState } from "react";

export interface GlideOption {
  id: string;
  label: string;
  count?: number;
}

interface GlideSelectProps {
  options: GlideOption[];
  activeId: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
}

export function GlideSelect({
  options,
  activeId,
  onChange,
  size = "md",
}: GlideSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector(
      `[data-glide-id="${activeId}"]`
    ) as HTMLElement | null;

    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeId, options]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center bg-surface-elevated border border-hairline rounded-full p-0.5 select-none font-sans"
    >
      {/* Gliding background indicator (Raycast pill-tab-active) */}
      <div
        className="absolute top-0.5 bottom-0.5 bg-surface-card border border-hairline-strong rounded-full transition-all duration-200 ease-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />

      {options.map((opt) => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            data-glide-id={opt.id}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 flex items-center justify-center gap-1.5 transition-colors duration-150 rounded-full font-medium ${
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
            } ${isActive ? "text-ink font-medium" : "text-mute hover:text-body"}`}
          >
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full border transition-colors ${
                  isActive
                    ? "border-hairline-strong text-ink bg-surface"
                    : "border-hairline text-mute"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
