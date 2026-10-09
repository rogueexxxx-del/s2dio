"use client";

import React, { useState } from "react";
import { downloadIcsFile, getGoogleCalendarUrl, CalendarEventDetails } from "@/lib/calendar";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomSlug: string;
  defaultTitle?: string;
}

export function ScheduleModal({
  isOpen,
  onClose,
  roomSlug,
  defaultTitle = "Studio Tracking & Mixdown",
}: ScheduleModalProps) {
  // Set default start date to tomorrow at 14:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [title, setTitle] = useState(defaultTitle);
  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState("14:00");
  const [duration, setDuration] = useState(60);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomUrl = typeof window !== "undefined"
    ? `${window.location.origin}/session/${roomSlug}`
    : `https://s2dio.live/session/${roomSlug}`;

  const eventDetails: CalendarEventDetails = {
    title: title.trim() || "Studio Session",
    description: "S2DIO Real-Time Lossless Audio Collaboration Session",
    roomUrl,
    startDate: date,
    startTime: time,
    durationMinutes: duration,
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(eventDetails);
  };

  const handleGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(eventDetails);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyInviteText = () => {
    const formatted = `S2DIO Studio Session: ${eventDetails.title}\nDate: ${date} at ${time} (${duration} min)\nJoin Room: ${roomUrl}\n(Lossless 48kHz stereo master stream • Zero install required)`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none font-sans animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface border border-hairline rounded-xl overflow-hidden shadow-2xl space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            <h3 className="text-sm font-semibold text-white tracking-tight">Schedule Studio Session</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-elevated hover:bg-surface-card border border-hairline flex items-center justify-center text-xs text-mute hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form fields */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-mute mb-1 font-medium">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-elevated border border-hairline rounded-lg px-3 py-2 text-white placeholder:text-mute focus:outline-none focus:border-accent-green/50 text-xs"
              placeholder="e.g. Mixdown Review w/ Producer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-mute mb-1 font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-elevated border border-hairline rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-green/50 text-xs"
              />
            </div>
            <div>
              <label className="block text-mute mb-1 font-medium">Start Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-surface-elevated border border-hairline rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-green/50 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-mute mb-1 font-medium">Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-1.5 rounded-lg border text-center transition-colors font-medium text-xs ${
                    duration === mins
                      ? "bg-accent-green/15 text-accent-green border-accent-green/40"
                      : "bg-surface-elevated text-mute border-hairline hover:text-white"
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Room link preview */}
          <div className="p-3 rounded-lg bg-surface-elevated border border-hairline space-y-1">
            <span className="text-[11px] text-mute block">Room Link</span>
            <span className="font-mono text-[11px] text-white break-all">{roomUrl}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 border-t border-hairline/60">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="btn-primary h-9 text-xs font-semibold flex items-center justify-center gap-1.5"
              title="Download standard .ics file for Apple Calendar, Outlook, and Google Calendar"
            >
              <span>Export .ICS File</span>
            </button>

            <button
              type="button"
              onClick={handleGoogleCalendar}
              className="btn-secondary h-9 text-xs font-medium flex items-center justify-center gap-1.5"
              title="Add directly to Google Calendar"
            >
              <span>Google Calendar ↗</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyInviteText}
            className="w-full h-8 rounded-lg bg-surface-elevated hover:bg-surface-card border border-hairline text-mute hover:text-white text-xs font-medium transition-colors"
          >
            {copied ? "✓ Copied Session Invite Details" : "Copy Formatted Invite Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
