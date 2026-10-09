"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface RecordedTake {
  id: string;
  name: string;
  durationSeconds: number;
  recordedAt: string;
  masterBlob: Blob;
  vocalBlob: Blob | null;
  masterUrl: string;
  vocalUrl: string | null;
}

export function useMultiTrackRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [takes, setTakes] = useState<RecordedTake[]>([]);

  const masterRecorderRef = useRef<MediaRecorder | null>(null);
  const vocalRecorderRef = useRef<MediaRecorder | null>(null);
  const masterChunksRef = useRef<Blob[]>([]);
  const vocalChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  const startRecording = useCallback((masterStream?: MediaStream | null, vocalStream?: MediaStream | null) => {
    if (isRecording) return;
    masterChunksRef.current = [];
    vocalChunksRef.current = [];

    const mimeType = getMimeType();
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

    // 1. Master DAW Stream Recorder
    if (masterStream && masterStream.getAudioTracks().length > 0) {
      try {
        const mr = new MediaRecorder(masterStream, options);
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) masterChunksRef.current.push(e.data);
        };
        mr.start(100);
        masterRecorderRef.current = mr;
      } catch (err) {
        console.error("Failed to start master recorder:", err);
      }
    }

    // 2. Vocal / Talkback Stream Recorder
    if (vocalStream && vocalStream.getAudioTracks().length > 0) {
      try {
        const vr = new MediaRecorder(vocalStream, options);
        vr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) vocalChunksRef.current.push(e.data);
        };
        vr.start(100);
        vocalRecorderRef.current = vr;
      } catch (err) {
        console.error("Failed to start vocal recorder:", err);
      }
    }

    setIsRecording(true);
    setRecordingSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  }, [isRecording]);

  const stopRecording = useCallback((): Promise<RecordedTake | null> => {
    return new Promise((resolve) => {
      if (!isRecording) {
        resolve(null);
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const finishDuration = recordingSeconds;
      setIsRecording(false);
      setRecordingSeconds(0);

      const mimeType = getMimeType() || "audio/webm";

      const finalize = () => {
        const masterBlob = new Blob(masterChunksRef.current, { type: mimeType });
        const vocalBlob = vocalChunksRef.current.length > 0
          ? new Blob(vocalChunksRef.current, { type: mimeType })
          : null;

        const masterUrl = URL.createObjectURL(masterBlob);
        const vocalUrl = vocalBlob ? URL.createObjectURL(vocalBlob) : null;

        const takeNumber = takes.length + 1;
        const newTake: RecordedTake = {
          id: `take-${Date.now()}`,
          name: `Take ${takeNumber} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          durationSeconds: finishDuration,
          recordedAt: new Date().toLocaleTimeString(),
          masterBlob,
          vocalBlob,
          masterUrl,
          vocalUrl,
        };

        setTakes((prev) => [newTake, ...prev]);
        resolve(newTake);
      };

      let pending = 0;
      if (masterRecorderRef.current && masterRecorderRef.current.state !== "inactive") {
        pending++;
        masterRecorderRef.current.onstop = () => {
          pending--;
          if (pending <= 0) finalize();
        };
        masterRecorderRef.current.stop();
      }

      if (vocalRecorderRef.current && vocalRecorderRef.current.state !== "inactive") {
        pending++;
        vocalRecorderRef.current.onstop = () => {
          pending--;
          if (pending <= 0) finalize();
        };
        vocalRecorderRef.current.stop();
      }

      if (pending === 0) {
        finalize();
      }
    });
  }, [isRecording, recordingSeconds, takes.length]);

  const downloadTakeStem = useCallback((blob: Blob, filename: string) => {
    if (typeof window === "undefined") return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isRecording,
    recordingSeconds,
    takes,
    startRecording,
    stopRecording,
    downloadTakeStem,
  };
}
