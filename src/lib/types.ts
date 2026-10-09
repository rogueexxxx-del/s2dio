export type PlanTier = "starter" | "pro_flex" | "pro_unlimited" | "enterprise";

export type ParticipantRole = "host" | "collaborator" | "guest";

export type ScreenControlStatus = "none" | "requested" | "granted";

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  avatar?: string;
  isTalkbackActive: boolean;
  isMuted: boolean;
  isVstConnected: boolean;
  screenControl: ScreenControlStatus;
  videoEnabled: boolean;
}

export interface AudioChannel {
  id: string;
  name: string;
  type: "daw" | "talkback" | "guest" | "instrument";
  ownerName: string;
  volume: number; // 0.0 to 1.5 (unity = 1.0, +3.5dB max)
  pan: number; // -1 (L) to 1 (R)
  isMuted: boolean;
  isSolo: boolean;
  peakDbL: number;
  peakDbR: number;
  rmsDbL: number;
  rmsDbR: number;
  isClipping: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface SessionFile {
  id: string;
  name: string;
  sizeBytes: number;
  uploaderName: string;
  type: "wav" | "midi" | "zip" | "other";
  durationSeconds?: number;
  uploadedAt: string;
}

export interface AudioEngineConfig {
  sampleRate: 44100 | 48000 | 96000;
  bufferSize: 64 | 128 | 256 | 512 | 1024;
  vstConnected: boolean;
  vstPort: number;
  loopbackProtection: boolean;
  talkbackDuckingDb: number;
  midiEnabled?: boolean;
  selectedMidiDevice?: string;
}
