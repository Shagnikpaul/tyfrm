"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OkButtonProps {
  onClick: () => void;
  text?: string;
  showHint?: boolean;
  disabled?: boolean;
  className?: string;
}

export function OkButton({ onClick, text = "OK", showHint = true, disabled = false, className }: OkButtonProps) {
  return (
    <div className={cn("flex items-center gap-4 mt-6", className)}>
      <Button 
        onClick={onClick} 
        disabled={disabled}
        className="h-12 px-6 text-base font-medium rounded-md bg-action text-action-foreground hover:bg-action/90"
      >
        {text}
        {text === "OK" && <Check className="ml-2 h-5 w-5" />}
      </Button>
      
      {showHint && (
        <div className="hidden sm:flex items-center text-xs text-muted-foreground">
          press <strong className="font-semibold mx-1">Enter ↵</strong>
        </div>
      )}
    </div>
  );
}
