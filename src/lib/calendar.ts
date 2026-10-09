/**
 * S2DIO Calendar & Scheduling Helper
 * Generates standard RFC 5545 .ics calendar files and Google Calendar intents
 * ponytail: Pure stdlib zero-dependency calendar generation
 */

export interface CalendarEventDetails {
  title: string;
  description: string;
  roomUrl: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
}

export function generateIcs(event: CalendarEventDetails): string {
  const start = new Date(`${event.startDate}T${event.startTime}:00`);
  const end = new Date(start.getTime() + event.durationMinutes * 60 * 1000);

  const formatUtc = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const dtStart = formatUtc(start);
  const dtEnd = formatUtc(end);
  const dtStamp = formatUtc(new Date());
  const uid = `s2dio-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@s2dio.live`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//S2DIO//Studio Session Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}\\n\\nJoin Room: ${event.roomUrl}`,
    `LOCATION:${event.roomUrl}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(event: CalendarEventDetails) {
  if (typeof window === "undefined") return;
  const content = generateIcs(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "session"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(event: CalendarEventDetails): string {
  const start = new Date(`${event.startDate}T${event.startTime}:00`);
  const end = new Date(start.getTime() + event.durationMinutes * 60 * 1000);
  const formatUtc = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    details: `${event.description}\n\nJoin S2DIO Room: ${event.roomUrl} (Lossless stereo audio)`,
    location: event.roomUrl,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
