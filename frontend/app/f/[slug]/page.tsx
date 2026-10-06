"use client"

import { useEffect, useRef } from "react"
import {
  usePublicForm,
  recordView,
  useSubmitResponse,
} from "@/lib/api/hooks/respondent"
import { FormPlayer } from "@/components/respondent/FormPlayer"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ApiError } from "@/lib/api/client"

export default function PublicFormPage() {
  const params = useParams()
  const slug = params.slug as string

  const { data: form, isLoading, error } = usePublicForm(slug)
  const submitResponse = useSubmitResponse(slug)

  const viewRecorded = useRef(false)

  useEffect(() => {
    if (form && !viewRecorded.current) {
      viewRecorded.current = true
      recordView(slug)
    }
  }, [form, slug])

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="animate-in duration-1000 fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
        </div>
      </div>
    )
  }

  if (error) {
    const apiError = error as ApiError
    if (apiError.code === "FORM_NOT_AVAILABLE" || apiError.status === 404) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-4 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl">👀</span>
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            This form is not available
          </h1>
          <p className="text-muted-foreground">
            It might have been unpublished or deleted by the creator.
          </p>
        </div>
      )
    }

    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="text-muted-foreground">{apiError.message}</p>
      </div>
    )
  }

  if (!form) return null

  return (
    <FormPlayer
      form={form}
      mode="play"
      onSubmit={async (answers) => {
        await submitResponse.mutateAsync(answers)
      }}
    />
  )
}
