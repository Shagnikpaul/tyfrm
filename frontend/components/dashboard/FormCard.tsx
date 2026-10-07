"use client"

import Link from "next/link"
import { FormSummaryItem } from "@/types/api"
import {
  MoreHorizontal,
  Edit2,
  BarChart2,
  LinkIcon,
  Copy,
  Trash2,
  Edit,
  BadgeCheck,
  MessageSquare,
  Calendar,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
      <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-muted-foreground/30 hover:shadow-md min-h-[170px] justify-center">
        <div className="relative flex flex-col gap-2 bg-card p-5">
          <Link href={`/forms/${form.id}/edit`} className="block w-full">
            <h3 className="line-clamp-1 pr-8 text-lg font-semibold text-foreground hover:underline">
              {form.title}
            </h3>
          </Link>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.status === "published" ? (
              <Badge variant="secondary">
                <BadgeCheck data-icon="inline-start" />
                Published
              </Badge>
            ) : (
              <Badge variant="outline">
                <Edit2 data-icon="inline-start" />
                Draft
              </Badge>
            )}
            <Badge variant="secondary">
              <MessageSquare data-icon="inline-start" />
              {form.response_count} responses
            </Badge>
            <Badge variant="outline">
              <Calendar data-icon="inline-start" />
              {new Date(form.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Badge>
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
