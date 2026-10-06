"use client"

import Link from "next/link"
import { FormSummaryItem } from "@/types/api"
import { FormThumbnail } from "./FormThumbnail"
import {
  MoreHorizontal,
  Edit2,
  BarChart2,
  LinkIcon,
  Copy,
  Trash2,
  Edit,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"
import { RenameFormDialog } from "./RenameFormDialog"

interface FormCardProps {
  form: FormSummaryItem
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRename: (id: string, newTitle: string) => void
}

export function FormCard({
  form,
  onDelete,
  onDuplicate,
  onRename,
}: FormCardProps) {
  const [renameOpen, setRenameOpen] = useState(false)

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(form.share_url)
    toast.success("Link copied")
  }

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-muted-foreground/30 hover:shadow-md">
        <Link href={`/forms/${form.id}/edit`} className="block w-full">
          <FormThumbnail slug={form.slug} title={form.title} />
        </Link>

        <div className="relative flex flex-col gap-1 bg-card p-4">
          <Link href={`/forms/${form.id}/edit`} className="block w-full">
            <h3 className="line-clamp-1 pr-8 font-medium text-foreground">
              {form.title}
            </h3>
          </Link>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${form.status === "published" ? "bg-success" : "bg-muted-foreground"}`}
              ></span>
              {form.status === "published" ? "Published" : "Draft"}
            </span>
            <span>{form.response_count} responses</span>
          </div>

          <div className="absolute top-3 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                  />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link
                    href={`/forms/${form.id}/edit`}
                    className="flex w-full cursor-pointer items-center"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/forms/${form.id}/results`}
                    className="flex w-full cursor-pointer items-center"
                  >
                    <BarChart2 className="mr-2 h-4 w-4" />
                    View results
                  </Link>
                </DropdownMenuItem>
                {form.status === "published" && (
                  <DropdownMenuItem
                    onClick={copyLink}
                    className="cursor-pointer"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copy link
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setRenameOpen(true)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDuplicate(form.id)}
                  className="cursor-pointer"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(form.id)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <RenameFormDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentTitle={form.title}
        onRename={(newTitle) => onRename(form.id, newTitle)}
      />
    </>
  )
}
