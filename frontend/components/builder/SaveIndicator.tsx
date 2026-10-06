"use client"

import { Check, Cloud, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function SaveIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error"
}) {
  if (status === "idle") {
    return (
      <div className="flex items-center text-xs text-muted-foreground/50">
        <Cloud className="mr-1.5 h-3.5 w-3.5" />
        Saved
      </div>
    )
  }

  if (status === "saving") {
    return (
      <div className="flex animate-pulse items-center text-xs text-muted-foreground">
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        Saving...
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex items-center text-xs text-destructive">
        <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
        Failed to save
      </div>
    )
  }

  // saved state
  return (
    <div className="text-success flex animate-in items-center text-xs duration-300 fade-in">
      <Check className="mr-1.5 h-3.5 w-3.5" />
      Saved
    </div>
  )
}
