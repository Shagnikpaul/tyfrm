"use client";

import { useEffect, useRef } from "react";
import { Question } from "@/types/api";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Kbd } from "../common/Kbd";

interface MultipleChoiceProps {
  question: Question;
  value: any;
  onChange: (val: any) => void;
  onEnter: () => void;
  disabled?: boolean;
}

export function MultipleChoice({ question, value, onChange, onEnter, disabled }: MultipleChoiceProps) {
  const settings = question.settings as { options?: { id: string; label: string }[]; allow_multiple?: boolean };
  const options = settings.options || [];
  const isMulti = settings.allow_multiple || false;
  
  const selectedValues: string[] = isMulti 
    ? (Array.isArray(value) ? value : []) 
    : (typeof value === "string" ? [value] : []);

  // Letters A-Z
  const getLetter = (index: number) => String.fromCharCode(65 + index);

  useEffect(() => {
    if (disabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toUpperCase();
      const optionIndex = key.charCodeAt(0) - 65;
      
      if (optionIndex >= 0 && optionIndex < options.length) {
        handleSelect(options[optionIndex].label);
      } else if (e.key === "Enter") {
        if (isMulti || selectedValues.length > 0) {
          onEnter();
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, selectedValues, isMulti, onEnter, disabled]);

  const handleSelect = (label: string) => {
    if (disabled) return;
    
    if (isMulti) {
      if (selectedValues.includes(label)) {
        onChange(selectedValues.filter(v => v !== label));
      } else {
        onChange([...selectedValues, label]);
      }
    } else {
      onChange(label);
      setTimeout(onEnter, 350);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl">
      {isMulti && (
        <div className="text-sm text-muted-foreground mb-1">
          Choose as many as you like
        </div>
      )}
      {options.map((opt, i) => {
        const isSelected = selectedValues.includes(opt.label);
        const letter = getLetter(i);
        
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(opt.label)}
            className={cn(
              "flex items-center text-left w-full p-3 rounded-lg border-2 transition-all outline-none",
              isSelected 
                ? "border-action bg-action/5 shadow-sm" 
                : "border-border/60 hover:border-action/50 bg-background/50 hover:bg-surface/50"
            )}
          >
            <div className={cn(
              "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded mr-4 border text-xs font-bold font-mono transition-colors",
              isSelected 
                ? "bg-action border-action text-action-foreground" 
                : "border-border bg-surface text-muted-foreground"
            )}>
              {letter}
            </div>
            <span className="flex-1 text-lg">{opt.label}</span>
            {isMulti && (
              <div className={cn(
                "w-5 h-5 ml-4 rounded-sm border flex items-center justify-center transition-colors",
                isSelected ? "bg-action border-action text-action-foreground" : "border-muted-foreground/30"
              )}>
                {isSelected && <Check className="w-3 h-3" />}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
