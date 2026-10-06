"use client"

import { useForm } from "@/lib/api/hooks/useForm"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { BuilderShell } from "@/components/builder/BuilderShell"
import { ContentPanel } from "@/components/builder/ContentPanel"
import { SettingsPanel } from "@/components/builder/SettingsPanel"
import { QuestionCanvas } from "@/components/builder/QuestionCanvas"
import { WelcomeCanvas } from "@/components/builder/WelcomeCanvas"
import { EndingCanvas } from "@/components/builder/EndingCanvas"
import { useBuilderStore } from "@/store/builderStore"
import { useEffect } from "react"

export default function BuilderPage() {
  const params = useParams()
  const id = params.id as string
  const { data: form, isLoading, error } = useForm(id)
  const selectedItem = useBuilderStore((s) => s.selectedItem)
  const setSelectedItem = useBuilderStore((s) => s.setSelectedItem)

  // Auto-select welcome screen or first question on load if nothing selected
  useEffect(() => {
    if (form && !selectedItem) {
      if (form.welcome.enabled) {
        setSelectedItem({ kind: "welcome" })
      } else if (form.questions.length > 0) {
        setSelectedItem({ kind: "question", id: form.questions[0].id })
      } else {
        setSelectedItem({ kind: "welcome" }) // fallback
      }
    }
  }, [form, selectedItem, setSelectedItem])

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background text-destructive">
        Failed to load form.
      </div>
    )
  }

  // Determine what to show in the center canvas
  let canvas = null
  if (selectedItem?.kind === "welcome") {
    canvas = <WelcomeCanvas form={form} />
  } else if (selectedItem?.kind === "ending") {
    canvas = <EndingCanvas form={form} />
  } else if (selectedItem?.kind === "question") {
    const question = form.questions.find((q) => q.id === selectedItem.id)
    if (question) {
      canvas = <QuestionCanvas form={form} question={question} />
    } else {
      // Question was deleted
      canvas = (
        <div className="animate-in text-center text-muted-foreground fade-in">
          Select a block to edit
        </div>
      )
    }
  }

  return (
    <BuilderShell form={form}>
      <div className="bg-surface flex h-full w-full">
        <ContentPanel form={form} />

        <div className="relative flex flex-1 flex-col overflow-y-auto bg-background">
          <div className="flex min-h-[500px] flex-1 flex-col items-center justify-center p-8">
            {canvas}
          </div>
        </div>

        <SettingsPanel form={form} />
      </div>
    </BuilderShell>
  )
}
