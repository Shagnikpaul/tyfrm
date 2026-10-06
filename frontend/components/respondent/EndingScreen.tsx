"use client"

import { CheckCircle2 } from "lucide-react"

interface EndingScreenProps {
  title: string
  message: string | null
}

export function EndingScreen({ title, message }: EndingScreenProps) {
  return (
    <div className="flex w-full animate-in flex-col items-center justify-center text-center duration-700 ease-out fade-in slide-in-from-bottom-8">
      <div className="text-success mb-6 animate-in delay-150 duration-500 fill-mode-both zoom-in">
        <CheckCircle2 className="h-16 w-16" />
      </div>

      <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>

      {message && (
        <p className="max-w-2xl text-lg whitespace-pre-wrap text-muted-foreground md:text-xl">
          {message}
        </p>
      )}
    </div>
  )
}
