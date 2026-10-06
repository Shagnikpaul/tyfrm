"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  title: string | null;
  description: string | null;
  buttonText: string;
  onStart: () => void;
  disabled?: boolean;
}

export function WelcomeScreen({ title, description, buttonText, onStart, disabled }: WelcomeScreenProps) {
  useEffect(() => {
    if (disabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onStart();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStart, disabled]);

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
      {title && (
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight text-foreground">
          {title}
        </h1>
      )}
      
      {description && (
        <p className="text-lg md:text-xl text-muted-foreground mb-10 whitespace-pre-wrap">
          {description}
        </p>
      )}
      
      <div className="flex items-center gap-4 mt-2">
        <Button 
          onClick={onStart}
          disabled={disabled}
          className="h-12 px-8 text-base font-semibold rounded-md bg-action text-action-foreground hover:bg-action/90"
        >
          {buttonText || "Start"}
        </Button>
        <div className="hidden sm:flex items-center text-sm text-muted-foreground">
          press <strong className="font-semibold mx-1">Enter ↵</strong>
        </div>
      </div>
    </div>
  );
}
