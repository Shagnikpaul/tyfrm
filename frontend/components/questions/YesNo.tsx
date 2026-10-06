"use client";

import { useEffect } from "react";
import { Question } from "@/types/api";
import { cn } from "@/lib/utils";
import { Kbd } from "../common/Kbd";

interface YesNoProps {
  question: Question;
  value: any;
  onChange: (val: boolean) => void;
  onEnter: () => void;
  disabled?: boolean;
}

export function YesNo({ value, onChange, onEnter, disabled }: YesNoProps) {
  
  useEffect(() => {
    if (disabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      if (key === "y") {
        onChange(true);
        setTimeout(onEnter, 350);
      } else if (key === "n") {
        onChange(false);
        setTimeout(onEnter, 350);
      } else if (key === "enter" && (value === true || value === false)) {
        onEnter();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChange, onEnter, value, disabled]);

  const handleSelect = (val: boolean) => {
    if (disabled) return;
    onChange(val);
    setTimeout(onEnter, 350); // auto-advance
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(true)}
        className={cn(
          "flex items-center justify-between flex-1 p-4 rounded-lg border-2 transition-all group outline-none",
          value === true 
            ? "border-action bg-action/5 shadow-sm" 
            : "border-border/60 hover:border-action/50 bg-background/50 hover:bg-surface/50"
        )}
      >
        <span className="font-medium text-lg">Yes</span>
        <Kbd className={cn("hidden sm:inline-block", value === true && "bg-action text-action-foreground")}>Y</Kbd>
      </button>
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(false)}
        className={cn(
          "flex items-center justify-between flex-1 p-4 rounded-lg border-2 transition-all group outline-none",
          value === false 
            ? "border-action bg-action/5 shadow-sm" 
            : "border-border/60 hover:border-action/50 bg-background/50 hover:bg-surface/50"
        )}
      >
        <span className="font-medium text-lg">No</span>
        <Kbd className={cn("hidden sm:inline-block", value === false && "bg-action text-action-foreground")}>N</Kbd>
      </button>
    </div>
  );
}
