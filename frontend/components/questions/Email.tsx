"use client"

import { useEffect, useRef } from "react"
import { Question } from "@/types/api"

interface EmailProps {
  question: Question
  value: any
  onChange: (val: string) => void
  onEnter: () => void
  disabled?: boolean
  autoFocus?: boolean
}

export function Email({
  value,
  onChange,
  onEnter,
  disabled,
  autoFocus,
}: EmailProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
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
        type="email"
        className="focus:border-action w-full border-0 border-b border-border/50 bg-transparent py-2 text-xl text-foreground transition-colors outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 md:text-2xl"
        placeholder="name@example.com"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
    </div>
  )
}
