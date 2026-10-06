"use client";

import { useEffect, useRef } from "react";
import { Question } from "@/types/api";

interface LongTextProps {
  question: Question;
  value: any;
  onChange: (val: string) => void;
  onEnter: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function LongText({ question, value, onChange, onEnter, disabled, autoFocus }: LongTextProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const settings = question.settings as { placeholder?: string; max_length?: number };

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Let it insert a newline
        return;
      }
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        className="w-full bg-transparent border-0 border-b border-border/50 focus:border-action outline-none py-2 text-xl md:text-2xl transition-colors text-foreground placeholder:text-muted-foreground/40 resize-none overflow-hidden disabled:opacity-50"
        placeholder={settings.placeholder || "Type your answer here..."}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        maxLength={settings.max_length}
        disabled={disabled}
        rows={1}
      />
      <div className="text-xs text-muted-foreground mt-2">
        <strong className="font-semibold">Shift + Enter</strong> for a new line
      </div>
    </div>
  );
}
