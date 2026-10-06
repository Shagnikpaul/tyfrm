"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, ExternalLink, Globe } from "lucide-react"
import { Form } from "@/types/api"
import { toast } from "sonner"

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
  onUnpublish: () => void
}

export function ShareModal({
  open,
  onOpenChange,
  form,
  onUnpublish,
}: ShareModalProps) {
  const url = form.share_url

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your form</DialogTitle>
          <DialogDescription>
            Your form is published and ready to collect responses.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Public link</span>
            </div>

            <div className="flex items-center gap-2">
              <Input readOnly value={url} className="flex-1 bg-muted/50" />
              <Button
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
                title="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={-1}
              >
                <Button size="icon" variant="outline" title="Open in new tab">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Unpublish form</span>
              <span className="text-xs text-muted-foreground">
                People will no longer be able to submit responses.
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onUnpublish()
                onOpenChange(false)
              }}
            >
              Unpublish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
