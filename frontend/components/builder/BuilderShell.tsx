"use client"

import Link from "next/link"
import { ArrowLeft, Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form } from "@/types/api"
import { useUpdateForm } from "@/lib/api/hooks/dashboard"
import { usePublishForm, useUnpublishForm } from "@/lib/api/hooks/builder"
import { useState, useEffect } from "react"
import { useBuilderStore } from "@/store/builderStore"
import { ThemeToggle } from "../layout/ThemeToggle"
import { toast } from "sonner"
import { ShareModal } from "./ShareModal"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SaveIndicator } from "./SaveIndicator"

interface BuilderShellProps {
  form: Form
  children: React.ReactNode
}

export function BuilderShell({ form, children }: BuilderShellProps) {
  const pathname = usePathname()
  const activeTab = pathname.endsWith("/results")
    ? "results"
    : pathname.endsWith("/connect")
      ? "connect"
      : "create"

  const updateForm = useUpdateForm()
  const publishForm = usePublishForm(form.id)
  const unpublishForm = useUnpublishForm(form.id)
  const saveStatus = useBuilderStore((s) => s.saveStatus)
  const setSaveStatus = useBuilderStore((s) => s.setSaveStatus)

  const [title, setTitle] = useState(form.title)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    setTitle(form.title)
  }, [form.title])

  const handleTitleBlur = () => {
    if (!title.trim()) {
      setTitle(form.title) // revert on empty
      toast.error("Form title can't be empty")
      return
    }
    if (title !== form.title) {
      setSaveStatus("saving")
      updateForm.mutate(
        { id: form.id, data: { title: title.trim() } },
        {
          onSuccess: () => setSaveStatus("saved"),
          onError: () => setSaveStatus("error"),
        }
      )
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      ;(e.currentTarget as HTMLInputElement).blur()
    } else if (e.key === "Escape") {
      setTitle(form.title)
      ;(e.currentTarget as HTMLInputElement).blur()
    }
  }

  const handlePublish = () => {
    if (form.questions.length === 0) {
      toast.error("Add at least one question before publishing.")
      return
    }
    setSaveStatus("saving")
    publishForm.mutate(undefined, {
      onSuccess: () => {
        setSaveStatus("saved")
        toast.success("Form published")
        setShareOpen(true)
      },
      onError: () => {
        setSaveStatus("error")
        toast.error("Failed to publish form")
      },
    })
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:h-16 md:px-6">
        <div className="flex flex-1 items-center gap-2 md:gap-4">
          <Link href="/forms" tabIndex={-1}>
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 shrink-0 md:mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <input
            type="text"
            className="focus:border-action w-32 truncate border-0 bg-transparent text-base font-medium transition-all focus:border-b-2 focus:ring-0 focus:outline-none md:w-64 md:text-lg"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
          />

          <div className="ml-2 hidden items-center gap-3 md:flex">
            <div
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs",
                form.status === "published"
                  ? "bg-success/10 text-success border-success/20"
                  : "border-border bg-muted text-muted-foreground"
              )}
            >
              {form.status === "published" ? "Published" : "Draft"}
            </div>
            <SaveIndicator status={saveStatus} />
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex rounded-md bg-muted/50 p-1">
            <Link
              href={`/forms/${form.id}/edit`}
              className={cn(
                "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
                activeTab === "create"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create
            </Link>
            <Link
              href={`/forms/${form.id}/connect`}
              className={cn(
                "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
                activeTab === "connect"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Connect
            </Link>
            <Link
              href={`/forms/${form.id}/results`}
              className={cn(
                "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
                activeTab === "results"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Results
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
          <ThemeToggle />
          <Link
            href={`/forms/${form.id}/preview`}
            className="hidden sm:flex"
            tabIndex={-1}
          >
            <Button variant="outline" size="sm">
              <Play className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </Link>

          {form.status === "draft" ? (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishForm.isPending}
            >
              Publish
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShareOpen(true)}>
              Share
            </Button>
          )}
        </div>
      </header>

      <main className="relative min-h-0 flex-1">{children}</main>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        form={form}
        onUnpublish={() => {
          unpublishForm.mutate(undefined, {
            onSuccess: () => toast.success("Form unpublished"),
          })
        }}
      />
    </div>
  )
}
