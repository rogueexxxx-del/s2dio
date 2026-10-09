"use client";

import React, { useState } from "react";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}

export function Accordion({ items, defaultOpenId, className = "" }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? items[0]?.id ?? null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={`rounded-xl border transition-all duration-200 overflow-hidden ${
              isOpen
                ? "border-hairline-strong bg-surface/90 shadow-lg shadow-black/40"
                : "border-hairline bg-surface/50 hover:bg-surface/75 hover:border-hairline-strong"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer select-none transition-colors"
              aria-expanded={isOpen}
            >
              <span className={`text-sm font-semibold tracking-tight transition-colors ${
                isOpen ? "text-white" : "text-ink hover:text-white"
              }`}>
                {item.question}
              </span>
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border transition-all duration-200 shrink-0 ${
                  isOpen
                    ? "rotate-45 bg-accent-green/15 text-accent-green border-accent-green/30"
                    : "rotate-0 bg-surface-elevated text-mute border-hairline hover:text-ink"
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-xs text-mute leading-relaxed border-t border-hairline/40 animate-in fade-in-50 duration-200">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
