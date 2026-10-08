"use client";

import React from "react";

interface ShinyTextProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // seconds
}

export function ShinyText({
  children,
  className = "",
  speed = 4,
}: ShinyTextProps) {
  return (
    <span
      className={`relative inline-block overflow-hidden bg-clip-text text-transparent bg-gradient-to-r from-ink via-primary to-ink bg-[length:200%_100%] animate-shimmer ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {children}
    </span>
  );
}
