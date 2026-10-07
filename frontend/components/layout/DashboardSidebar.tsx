"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, LayoutTemplate, Users, Puzzle, Plus, Search } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useCreateForm } from "@/lib/api/hooks/dashboard"
import { CreateFormModal } from "@/components/dashboard/CreateFormModal"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DashboardSidebarProps {
  onStatusChange: (status: string | undefined) => void
}

export function DashboardSidebar({ onStatusChange }: DashboardSidebarProps) {
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get("status") || "all"

  const navItems = [
    { id: "all", label: "All forms", value: undefined },
    { id: "draft", label: "Drafts", value: "draft" },
    { id: "published", label: "Published", value: "published" },
  ]

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const createForm = useCreateForm()
  const router = useRouter()

  const handleCreateScratch = () => {
    createForm.mutate(undefined, {
      onSuccess: (newForm) => {
        router.push(`/forms/${newForm.id}/edit`)
      },
      onError: () => toast.error("Couldn't create form"),
    })
  }

  const currentSearch = searchParams.get("search") || ""
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchInput.trim()) {
        params.set("search", searchInput.trim())
      } else {
        params.delete("search")
      }
      if (params.toString() !== searchParams.toString()) {
        router.push(`/forms?${params.toString()}`)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, router, searchParams])

  return (
    <div className="bg-surface flex h-full w-64 flex-col border-r border-border">
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <Link
          href="/forms"
          className="flex items-center gap-1 text-lg font-semibold"
        >
          <div className="flex items-center justify-center rounded-md bg-foreground">
            <span className="text-sm font-bold text-background p-2">Ty</span>
          </div>
          Frm.
        </Link>
      </div>

      <div className="mt-4 px-3">
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="w-full"
          disabled={createForm.isPending}
          variant="default"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create form
        </Button>
        <div className="relative mt-4">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search forms..."
            className="bg-surface/50 border-border pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        <div className="mb-2 px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Forms
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onStatusChange(item.value)}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
              currentStatus === item.id ||
                (item.id === "all" && !searchParams.has("status"))
                ? "bg-foreground/5 font-medium text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <FileText className="mr-3 h-4 w-4" />
            {item.label}
          </button>
        ))}



        <div className="mt-8 mb-2">
          <div className="flex items-center justify-between px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Coming soon
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger>
            <div className="flex cursor-not-allowed items-center px-3 py-2 text-sm text-muted-foreground/60">
              <LayoutTemplate className="mr-3 h-4 w-4" />
              Templates
            </div>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <div className="flex cursor-not-allowed items-center px-3 py-2 text-sm text-muted-foreground/60">
              <Users className="mr-3 h-4 w-4" />
              Team
            </div>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <div className="flex cursor-not-allowed items-center px-3 py-2 text-sm text-muted-foreground/60">
              <Puzzle className="mr-3 h-4 w-4" />
              Integrations
            </div>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </div>

      <CreateFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateScratch={handleCreateScratch}
      />
    </div>
  )
}
