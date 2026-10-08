"use client";

import React, { useState } from "react";
import { ChatMessage, SessionFile } from "@/lib/types";
import { GlideSelect } from "./micro/GlideSelect";
import { PromptBar } from "./micro/PromptBar";

interface FileTransferProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  files: SessionFile[];
  onSendMessage: (text: string) => void;
  onUploadFile: (file: File) => void;
}

export function FileTransferDrawer({
  isOpen,
  onClose,
  messages,
  files,
  onSendMessage,
  onUploadFile,
}: FileTransferProps) {
  const [tab, setTab] = useState<"chat" | "files">("chat");
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-surface border-l border-hairline flex flex-col h-full z-30 select-none font-sans text-xs shadow-2xl">
      {/* Top Header with GlideSelect & Close */}
      <div className="flex items-center justify-between p-3 border-b border-hairline">
        <GlideSelect
          options={[
            { id: "chat", label: "Notes", count: messages.length },
            { id: "files", label: "Stems", count: files.length },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as "chat" | "files")}
          size="sm"
        />

        <button
          onClick={onClose}
          className="text-xs text-mute hover:text-ink px-2 py-1 rounded-md border border-hairline"
        >
          Close
        </button>
      </div>

      {/* Tab Content */}
      {tab === "chat" ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.isSystem ? "items-center text-mute text-xs" : "items-start"
                }`}
              >
                {!msg.isSystem && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-ink font-medium">{msg.senderName}</span>
                    <span className="text-[10px] text-mute">{msg.timestamp}</span>
                  </div>
                )}
                <div
                  className={`p-2.5 text-xs leading-relaxed max-w-[95%] rounded-md ${
                    msg.isSystem
                      ? "border border-hairline text-center text-mute bg-surface-elevated/40"
                      : "bg-surface-elevated border border-hairline text-ink"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input with PromptBar */}
          <div className="p-3 border-t border-hairline bg-surface">
            <PromptBar
              value={inputText}
              onChange={setInputText}
              onSubmit={handleSend}
              placeholder="Send message or note..."
              submitLabel="Send"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border border-dashed border-hairline hover:border-hairline-strong rounded-md p-5 flex flex-col items-center justify-center text-center bg-surface-elevated/40 transition-colors mb-3 cursor-pointer"
          >
            <div className="text-sm font-medium text-ink">Drop Stems or Audio Files</div>
            <div className="text-xs text-mute mt-1">
              Lossless WAV / FLAC / MIDI
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {files.map((file) => (
              <div
                key={file.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", file.name);
                }}
                className="p-2.5 bg-surface-elevated border border-hairline hover:border-hairline-strong rounded-md transition-all flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-medium text-ink truncate">{file.name}</div>
                  <div className="text-[10px] text-mute mt-0.5">
                    {(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {file.uploaderName}
                  </div>
                </div>

                <div
                  className="px-2 py-1 rounded-xs border border-hairline bg-surface-card text-ink text-[10px] uppercase font-medium cursor-grab active:cursor-grabbing hover:border-hairline-strong transition-colors shrink-0"
                  title="Drag directly into DAW timeline"
                >
                  Drag to DAW
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
