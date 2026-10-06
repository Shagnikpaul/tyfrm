"use client"

import { useState, useEffect } from "react"
import { Form } from "@/types/api"
import { useUpdateForm } from "@/lib/api/hooks/dashboard"
import { useBuilderStore } from "@/store/builderStore"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface WelcomeCanvasProps {
  form: Form
}

export function WelcomeCanvas({ form }: WelcomeCanvasProps) {
  const updateForm = useUpdateForm()
  const setSaveStatus = useBuilderStore((s) => s.setSaveStatus)

  const [title, setTitle] = useState(form.welcome.title || "")
  const [description, setDescription] = useState(form.welcome.description || "")
  const [buttonText, setButtonText] = useState(
    form.welcome.button_text || "Start"
  )

  useEffect(() => {
    setTitle(form.welcome.title || "")
    setDescription(form.welcome.description || "")
    setButtonText(form.welcome.button_text || "Start")
  }, [form.welcome])

  const handleSave = () => {
    setSaveStatus("saving")
    updateForm.mutate(
      {
        id: form.id,
        data: {
          welcome: {
            enabled: form.welcome.enabled,
            title: title || null,
            description: description || null,
            button_text: buttonText || "Start",
          },
        },
      },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error"),
      }
    )
  }

  const handleBlur = () => {
    handleSave()
  }

  return (
    <div className="flex w-full max-w-4xl animate-in flex-col duration-300 fade-in">
      <input
        type="text"
        className="border-action mb-4 w-full border-0 bg-transparent py-1 text-3xl leading-tight font-bold tracking-tight placeholder:text-muted-foreground/30 focus:border-b focus:ring-0 focus:outline-none md:text-4xl"
        placeholder="Welcome screen title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
        }}
      />

      <textarea
        className="border-action mb-10 h-32 w-full resize-none border-0 bg-transparent py-1 text-lg text-muted-foreground placeholder:text-muted-foreground/30 focus:border-b focus:ring-0 focus:outline-none md:text-xl"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleBlur}
      />

      <div className="mt-2 flex items-center gap-4">
        <div className="relative">
          <Button className="bg-action text-action-foreground pointer-events-none h-12 rounded-md px-8 text-base font-semibold">
            {/* We overlay an input on the button text so it can be edited */}
            <span className="opacity-0">{buttonText || "Start"}</span>
          </Button>
          <input
            type="text"
            className="text-action-foreground placeholder:text-action-foreground/50 absolute inset-0 bg-transparent text-center font-semibold focus:outline-none"
            placeholder="Button text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
            }}
          />
        </div>
        <div className="hidden items-center text-sm text-muted-foreground sm:flex">
          press <strong className="mx-1 font-semibold">Enter ↵</strong>
        </div>
      </div>

      {!form.welcome.enabled && (
        <div className="mt-8 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          Welcome screen is currently disabled. You can enable it in the right
          sidebar.
        </div>
      )}
    </div>
  )
}
