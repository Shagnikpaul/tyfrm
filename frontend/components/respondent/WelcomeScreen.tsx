"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface WelcomeScreenProps {
  title: string | null
  description: string | null
  buttonText: string
  onStart: () => void
  disabled?: boolean
}

export function WelcomeScreen({
  title,
  description,
  buttonText,
  onStart,
  disabled,
}: WelcomeScreenProps) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onStart()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onStart, disabled])

  return (
    <div className="flex w-full animate-in flex-col duration-500 ease-out fade-in slide-in-from-bottom-8">
      {title && (
        <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
      )}

      {description && (
        <p className="mb-10 text-lg whitespace-pre-wrap text-muted-foreground md:text-xl">
          {description}
        </p>
      )}

      <div className="mt-2 flex items-center gap-4">
        <Button
          onClick={onStart}
          disabled={disabled}
          className="bg-foreground text-background hover:bg-foreground/90 h-12 rounded-md px-8 text-base font-semibold"
        >
          {buttonText || "Start"}
        </Button>
        <div className="hidden items-center text-sm text-muted-foreground sm:flex">
          press <strong className="mx-1 font-semibold">Enter ↵</strong>
        </div>
      </div>
    </div>
  )
}
