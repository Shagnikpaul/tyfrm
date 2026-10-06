"use client"

import { useEffect, useRef } from "react"
import { Question } from "@/types/api"

interface ShortTextProps {
  question: Question
  value: any
  onChange: (val: string) => void
  onEnter: () => void
  disabled?: boolean
  autoFocus?: boolean
}

export function ShortText({
  question,
  value,
  onChange,
  onEnter,
  disabled,
  autoFocus,
}: ShortTextProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const settings = question.settings as {
    placeholder?: string
    max_length?: number
  }

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to allow enter animation to finish
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [autoFocus])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onEnter()
    }
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="text"
        className="focus:border-action w-full border-0 border-b border-border/50 bg-transparent py-2 text-xl text-foreground transition-colors outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 md:text-2xl"
        placeholder={settings.placeholder || "Type your answer here..."}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={settings.max_length}
        disabled={disabled}
      />
    </div>
  )
}
