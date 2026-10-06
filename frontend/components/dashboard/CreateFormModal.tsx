"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, LayoutTemplate } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CreateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateScratch: () => void
}

export function CreateFormModal({
  open,
  onOpenChange,
  onCreateScratch,
}: CreateFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a new form</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-6 md:grid-cols-2">
          <button
            onClick={() => {
              onCreateScratch()
              onOpenChange(false)
            }}
            className="group flex h-48 flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-6 transition-colors hover:border-foreground"
          >
            <div className="bg-surface mb-4 flex h-12 w-12 items-center justify-center rounded-full transition-colors group-hover:bg-foreground group-hover:text-background">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium text-foreground">
              Start from scratch
            </span>
            <span className="mt-2 text-center text-sm text-muted-foreground">
              A blank canvas for your form
            </span>
          </button>

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  disabled
                  className="flex h-48 cursor-not-allowed flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-6 opacity-60"
                />
              }
            >
              <div className="bg-surface mb-4 flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <span className="font-medium text-foreground">
                Choose a template
              </span>
              <span className="mt-2 text-center text-sm text-muted-foreground">
                Start with a pre-built design
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming soon</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </DialogContent>
    </Dialog>
  )
}
