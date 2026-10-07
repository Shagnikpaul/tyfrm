"use client"

import { useState } from "react"
import Link from "next/link"
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "./data-table-features"
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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { RenameFormDialog } from "@/components/dashboard/RenameFormDialog"
import { toast } from "sonner"

const columnHelper = createColumnHelper<DataTableFeatures, FormSummaryItem>()

interface ActionsProps {
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRename: (id: string, newTitle: string) => void
}

const colors = [
  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
]

const getBadgeColor = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export const getColumns = ({ onDelete, onDuplicate, onRename }: ActionsProps) => {
  return columnHelper.columns([
    columnHelper.accessor("title", {
      header: "Form Name",
      cell: ({ row, getValue }) => {
        const id = row.original.id
        const title = getValue() as string
        const firstLetter = title ? title.charAt(0).toUpperCase() : "?"
        return (
          <Link
            href={`/forms/${id}/edit`}
            className="flex items-center gap-3 font-medium text-foreground hover:underline"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-medium ${getBadgeColor(id)}`}>
              {firstLetter}
            </div>
            <span className="truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">{title}</span>
          </Link>
        )
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue()
        if (status === "published") {
          return (
            <Badge variant="secondary">
              <BadgeCheck data-icon="inline-start" className="mr-1 h-3 w-3" />
              Published
            </Badge>
          )
        }
        return (
          <Badge variant="outline">
            <Edit2 data-icon="inline-start" className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        )
      },
    }),
    columnHelper.accessor("response_count", {
      header: "Responses",
      cell: ({ row, getValue }) => {
        const id = row.original.id
        return (
          <Link 
            href={`/forms/${id}/results/responses`}
            className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            {getValue()}
          </Link>
        )
      },
    }),
    columnHelper.accessor("updated_at", {
      header: "Last Updated",
      cell: ({ getValue }) => {
        return (
          <div className="text-muted-foreground">
            {new Date(getValue()).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: function ActionsCell({ row }) {
        const form = row.original
        const [renameOpen, setRenameOpen] = useState(false)

        const copyLink = (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          navigator.clipboard.writeText(form.share_url)
          toast.success("Link copied")
        }

        return (
          <>
            <div className="flex justify-end pr-4">
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
            
            <RenameFormDialog
              open={renameOpen}
              onOpenChange={setRenameOpen}
              currentTitle={form.title}
              onRename={(newTitle) => onRename(form.id, newTitle)}
            />
          </>
        )
      },
    }),
  ])
}
