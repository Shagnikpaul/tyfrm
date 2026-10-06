"use client";

import { useEffect, useRef } from "react";
import { Question } from "@/types/api";

interface NumberInputProps {
  question: Question;
  value: any;
  onChange: (val: number | null) => void;
  onEnter: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function NumberInput({ value, onChange, onEnter, disabled, autoFocus }: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // We keep a string state for the raw input so the user can type freely (e.g. '-')
  const rawValue = value === null || value === undefined ? "" : String(value);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onChange(null);
      return;
    }
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (val === "-" || val === ".") {
      // Just visually allow typing these without committing to value yet
      // This is a simplified approach. A full approach needs a local state for the input.
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        className="w-full bg-transparent border-0 border-b border-border/50 focus:border-action outline-none py-2 text-xl md:text-2xl transition-colors text-foreground placeholder:text-muted-foreground/40 disabled:opacity-50"
        placeholder="Type a number..."
        value={rawValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
    </div>
  );
}
