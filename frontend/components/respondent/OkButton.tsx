"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface OkButtonProps {
  onClick: () => void
  text?: string
  showHint?: boolean
  disabled?: boolean
  className?: string
}

export function OkButton({
  onClick,
  text = "OK",
  showHint = true,
  disabled = false,
  className,
}: OkButtonProps) {
  return (
    <div className={cn("mt-6 flex items-center gap-4", className)}>
      <Button
        onClick={onClick}
        disabled={disabled}
        className="bg-action text-action-foreground hover:bg-action/90 h-12 rounded-md px-6 text-base font-medium"
      >
        {text}
        {text === "OK" && <Check className="ml-2 h-5 w-5" />}
      </Button>

      {showHint && (
        <div className="hidden items-center text-xs text-muted-foreground sm:flex">
          press <strong className="mx-1 font-semibold">Enter ↵</strong>
        </div>
      )}
    </div>
  )
}
