"use client";

import { useEffect, useState } from "react";
import { Question } from "@/types/api";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface RatingProps {
  question: Question;
  value: any;
  onChange: (val: number) => void;
  onEnter: () => void;
  disabled?: boolean;
}

export function Rating({ question, value, onChange, onEnter, disabled }: RatingProps) {
  const settings = question.settings as { steps?: number };
  const steps = settings.steps || 5;
  const [hovered, setHovered] = useState<number | null>(null);
  
  useEffect(() => {
    if (disabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= steps) {
        onChange(num);
        setTimeout(onEnter, 350);
      } else if (e.key === "Enter" && typeof value === "number") {
        onEnter();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChange, onEnter, value, steps, disabled]);

  const handleSelect = (val: number) => {
    if (disabled) return;
    onChange(val);
    setTimeout(onEnter, 350);
  };

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: steps }).map((_, i) => {
        const rating = i + 1;
        const isFilled = hovered !== null ? rating <= hovered : typeof value === "number" && rating <= value;
        
        return (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHovered(rating)}
            onMouseLeave={() => !disabled && setHovered(null)}
            onClick={() => handleSelect(rating)}
            className="p-2 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 ring-action rounded-full outline-none"
          >
            <Star
              className={cn(
                "w-8 h-8 md:w-10 md:h-10 transition-colors",
                isFilled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
