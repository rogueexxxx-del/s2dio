"use client";

import React, { useEffect, useState } from "react";

interface VUMeterProps {
  dbL: number;
  dbR?: number;
  height?: number;
  showLabels?: boolean;
}

export function VUMeter({ dbL, dbR, height = 180, showLabels = true }: VUMeterProps) {
  const isStereo = typeof dbR === "number";
  const [peakL, setPeakL] = useState(-60);
  const [peakR, setPeakR] = useState(-60);

  useEffect(() => {
    if (dbL > peakL) {
      setPeakL(dbL);
    } else {
      const timer = setTimeout(() => {
        setPeakL((prev) => Math.max(-60, prev - 3));
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [dbL, peakL]);

  useEffect(() => {
    if (typeof dbR === "number") {
      if (dbR > peakR) {
        setPeakR(dbR);
      } else {
        const timer = setTimeout(() => {
          setPeakR((prev) => Math.max(-60, prev - 3));
        }, 80);
        return () => clearTimeout(timer);
      }
    }
  }, [dbR, peakR]);

  const dbToPercent = (db: number) => {
    const clamped = Math.max(-60, Math.min(3, db));
    return ((clamped + 60) / 63) * 100;
  };

  const pctL = dbToPercent(dbL);
  const pctR = isStereo ? dbToPercent(dbR!) : pctL;
  const peakPctL = dbToPercent(peakL);
  const peakPctR = isStereo ? dbToPercent(peakR) : peakPctL;

  return (
    <div className="flex items-center gap-1.5 select-none font-sans text-[9px] text-mute">
      {showLabels && (
        <div className="flex flex-col justify-between h-[180px] text-right pr-0.5 select-none leading-none">
          <span className="text-accent-red font-medium">+3</span>
          <span className="text-accent-yellow">0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-18</span>
          <span>-30</span>
          <span>-60</span>
        </div>
      )}

      {/* Meter Bars Container */}
      <div className="flex gap-1 p-0.5 bg-surface-card border border-hairline rounded-xs" style={{ height }}>
        {/* Left Channel */}
        <div className="relative w-1.5 bg-surface-elevated overflow-hidden flex flex-col justify-end rounded-xs">
          <div
            className="w-full transition-all duration-75"
            style={{
              height: `${pctL}%`,
              background: "linear-gradient(to top, #59d499 0%, #ffc533 75%, #ff6161 96%)",
            }}
          />
          {peakL > -55 && (
            <div
              className="absolute w-full h-[1px] bg-ink pointer-events-none"
              style={{ bottom: `${peakPctL}%` }}
            />
          )}
        </div>

        {/* Right Channel */}
        {isStereo && (
          <div className="relative w-1.5 bg-surface-elevated overflow-hidden flex flex-col justify-end rounded-xs">
            <div
              className="w-full transition-all duration-75"
              style={{
                height: `${pctR}%`,
                background: "linear-gradient(to top, #59d499 0%, #ffc533 75%, #ff6161 96%)",
              }}
            />
            {peakR > -55 && (
              <div
                className="absolute w-full h-[1px] bg-ink pointer-events-none"
                style={{ bottom: `${peakPctR}%` }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
