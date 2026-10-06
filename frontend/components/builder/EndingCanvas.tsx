"use client"

import { useState, useEffect } from "react"
import { Form } from "@/types/api"
import { useUpdateForm } from "@/lib/api/hooks/dashboard"
import { useBuilderStore } from "@/store/builderStore"
import { CheckCircle2 } from "lucide-react"

interface EndingCanvasProps {
  form: Form
}

export function EndingCanvas({ form }: EndingCanvasProps) {
  const updateForm = useUpdateForm()
  const setSaveStatus = useBuilderStore((s) => s.setSaveStatus)

  const [title, setTitle] = useState(form.thank_you.title || "")
  const [message, setMessage] = useState(form.thank_you.message || "")

  useEffect(() => {
    setTitle(form.thank_you.title || "")
    setMessage(form.thank_you.message || "")
  }, [form.thank_you])

  const handleBlur = () => {
    setSaveStatus("saving")
    updateForm.mutate(
      {
        id: form.id,
        data: {
          thank_you: {
            title: title || "Thank you!",
            message: message || null,
          },
        },
      },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error"),
      }
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl animate-in flex-col items-center justify-center text-center duration-300 fade-in">
      <div className="text-success mb-6">
        <CheckCircle2 className="h-16 w-16" />
      </div>

      <input
        type="text"
        className="border-action mb-4 w-full border-0 bg-transparent py-1 text-center text-3xl leading-tight font-bold tracking-tight placeholder:text-muted-foreground/30 focus:border-b focus:ring-0 focus:outline-none md:text-4xl"
        placeholder="Ending title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
      />

      <textarea
        className="border-action h-32 w-full max-w-2xl resize-none border-0 bg-transparent py-1 text-center text-lg text-muted-foreground placeholder:text-muted-foreground/30 focus:border-b focus:ring-0 focus:outline-none md:text-xl"
        placeholder="Ending message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  )
}
