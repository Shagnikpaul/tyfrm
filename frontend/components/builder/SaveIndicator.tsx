"use client";

import { Check, Cloud, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") {
    return (
      <div className="flex items-center text-xs text-muted-foreground/50">
        <Cloud className="w-3.5 h-3.5 mr-1.5" />
        Saved
      </div>
    );
  }

  if (status === "saving") {
    return (
      <div className="flex items-center text-xs text-muted-foreground animate-pulse">
        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        Saving...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center text-xs text-destructive">
        <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
        Failed to save
      </div>
    );
  }

  // saved state
  return (
    <div className="flex items-center text-xs text-success animate-in fade-in duration-300">
      <Check className="w-3.5 h-3.5 mr-1.5" />
      Saved
    </div>
  );
}
