"use client";

import React from "react";

export function StudioGridBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #ffffff 1px, transparent 1px),
          linear-gradient(to bottom, #ffffff 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse 60% 50% at 50% 30%, #000 70%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 30%, #000 70%, transparent 100%)",
      }}
    />
  );
}
