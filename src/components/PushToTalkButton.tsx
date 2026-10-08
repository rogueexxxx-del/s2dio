"use client";

import React from "react";
import { VoicePill } from "./micro/VoicePill";

interface PushToTalkProps {
  isActive: boolean;
  onStateChange: (active: boolean) => void;
}

export function PushToTalkButton({ isActive, onStateChange }: PushToTalkProps) {
  return (
    <VoicePill
      isActive={isActive}
      onStateChange={onStateChange}
      label="TALKBACK"
      sublabel="SPACE"
    />
  );
}
