"use client"

import { useEffect, useRef } from "react"
import { Question } from "@/types/api"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { Kbd } from "../common/Kbd"

interface MultipleChoiceProps {
  question: Question
  value: any
  onChange: (val: any) => void
  onEnter: () => void
  disabled?: boolean
}

export function MultipleChoice({
  question,
  value,
  onChange,
  onEnter,
  disabled,
}: MultipleChoiceProps) {
  const settings = question.settings as {
    options?: { id: string; label: string }[]
    allow_multiple?: boolean
  }
  const options = settings.options || []
  const isMulti = settings.allow_multiple || false

  const selectedValues: string[] = isMulti
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === "string"
      ? [value]
      : []

  // Letters A-Z
  const getLetter = (index: number) => String.fromCharCode(65 + index)

  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      const key = e.key.toUpperCase()
      const optionIndex = key.charCodeAt(0) - 65

      if (optionIndex >= 0 && optionIndex < options.length) {
        handleSelect(options[optionIndex].label)
      } else if (e.key === "Enter") {
        if (isMulti || selectedValues.length > 0) {
          onEnter()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [options, selectedValues, isMulti, onEnter, disabled])

  const handleSelect = (label: string) => {
    if (disabled) return

    if (isMulti) {
      if (selectedValues.includes(label)) {
        onChange(selectedValues.filter((v) => v !== label))
      } else {
        onChange([...selectedValues, label])
      }
    } else {
      onChange(label)
      setTimeout(onEnter, 350)
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      {isMulti && (
        <div className="mb-1 text-sm text-muted-foreground">
          Choose as many as you like
        </div>
      )}
      {options.map((opt, i) => {
        const isSelected = selectedValues.includes(opt.label)
        const letter = getLetter(i)

        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(opt.label)}
            className={cn(
              "flex w-full items-center rounded-lg border-2 p-3 text-left transition-all outline-none",
              isSelected
                ? "border-action bg-action/5 shadow-sm"
                : "hover:border-action/50 hover:bg-surface/50 border-border/60 bg-background/50"
            )}
          >
            <div
              className={cn(
                "mr-4 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border font-mono text-xs font-bold transition-colors",
                isSelected
                  ? "bg-action border-action text-action-foreground"
                  : "bg-surface border-border text-muted-foreground"
              )}
            >
              {letter}
            </div>
            <span className="flex-1 text-lg">{opt.label}</span>
            {isMulti && (
              <div
                className={cn(
                  "ml-4 flex h-5 w-5 items-center justify-center rounded-sm border transition-colors",
                  isSelected
                    ? "bg-action border-action text-action-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
