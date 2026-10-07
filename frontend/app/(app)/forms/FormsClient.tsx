"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForms } from "@/lib/api/hooks/useForms"
import {
  useCreateForm,
  useDeleteForm,
  useDuplicateForm,
  useUpdateForm,
} from "@/lib/api/hooks/dashboard"
import { DataTable } from "@/components/dashboard/forms-data-table/data-table"
import { getColumns } from "@/components/dashboard/forms-data-table/columns"
import { FormGrid } from "@/components/dashboard/FormGrid"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function FormsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") || ""
  const currentStatus = searchParams.get("status") || undefined
  const currentSort = searchParams.get("sort") || "updated_desc"
  
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [formToDelete, setFormToDelete] = useState<{
    id: string
    count: number
  } | null>(null)

  const { data, isLoading } = useForms(
    currentSearch || undefined,
    currentStatus,
    currentSort
  )

  const createForm = useCreateForm()
  const deleteForm = useDeleteForm()
  const duplicateForm = useDuplicateForm()
  const updateForm = useUpdateForm()

  const handleSortChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    router.push(`/forms?${params.toString()}`)
  }

  const handleDeleteClick = (id: string) => {
    const form = data?.items.find((f) => f.id === id)
    if (form) {
      setFormToDelete({ id, count: form.response_count })
      setDeleteConfirmOpen(true)
    }
  }

  const confirmDelete = () => {
    if (formToDelete) {
      deleteForm.mutate(formToDelete.id, {
        onSuccess: () => {
          toast.success("Form deleted")
          setDeleteConfirmOpen(false)
          setFormToDelete(null)
        },
        onError: () => toast.error("Couldn't delete form"),
      })
    }
  }

  const handleDuplicate = (id: string) => {
    duplicateForm.mutate(id, {
      onSuccess: () => toast.success("Form duplicated"),
      onError: () => toast.error("Couldn't duplicate form"),
    })
  }

  const handleRename = (id: string, title: string) => {
    updateForm.mutate(
      { id, data: { title } },
      {
        onSuccess: () => toast.success("Form renamed"),
        onError: () => toast.error("Couldn't rename form"),
      }
    )
  }

  const forms = data?.items || []
  const isEmpty = forms.length === 0 && !currentSearch && !currentStatus

  const columns = getColumns({
    onDelete: handleDeleteClick,
    onDuplicate: handleDuplicate,
    onRename: handleRename,
  })

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col p-4 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Forms</h1>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="bg-surface/50 w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Last updated</SelectItem>
              <SelectItem value="created_desc">Date created</SelectItem>
              <SelectItem value="title_asc">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-md border border-border p-1 bg-surface/50">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 pb-8">
        {viewMode === "list" ? (
          <DataTable
            columns={columns}
            data={forms}
            isLoading={isLoading}
            isEmpty={isEmpty}
          />
        ) : (
          <FormGrid
            forms={forms}
            isLoading={isLoading}
            isEmpty={isEmpty}
            isSearchEmpty={false}
            onCreateClick={() => {}}
            onDelete={handleDeleteClick}
            onDuplicate={handleDuplicate}
            onRename={handleRename}
          />
        )}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form and its{" "}
              {formToDelete?.count || 0} responses. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
