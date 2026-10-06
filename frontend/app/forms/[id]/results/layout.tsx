"use client"

import { useForm } from "@/lib/api/hooks/useForm"
import { useParams, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { BuilderShell } from "@/components/builder/BuilderShell"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const id = params.id as string
  const pathname = usePathname()
  const { data: form, isLoading, error } = useForm(id)

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

  const isResponses = pathname.endsWith("/responses")

  return (
    <BuilderShell form={form}>
      <div className="bg-surface flex h-full w-full flex-col">
        <div className="flex h-12 shrink-0 items-center gap-6 border-b border-border bg-background px-8">
          <Link
            href={`/forms/${form.id}/results`}
            className={cn(
              "flex h-full items-center border-b-2 text-sm font-medium transition-colors",
              !isResponses
                ? "border-action text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Summary
          </Link>
          <Link
            href={`/forms/${form.id}/results/responses`}
            className={cn(
              "flex h-full items-center border-b-2 text-sm font-medium transition-colors",
              isResponses
                ? "border-action text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Responses
          </Link>
        </div>

        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </BuilderShell>
  )
}
