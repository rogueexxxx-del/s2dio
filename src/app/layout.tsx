import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "S2DIO — Lossless Audio Collaboration for Music Producers",
  description: "Virtual recording studio for music producers with direct VST3 master bus DAW ingestion, real-time talkback, and low-latency canvas stage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-canvas text-body antialiased font-sans selection:bg-surface-elevated selection:text-ink">
        {children}
      </body>
    </html>
  );
}
