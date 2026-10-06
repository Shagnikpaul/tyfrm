"use client"

import { FormSummaryItem } from "@/types/api"
import { FormCard } from "./FormCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface FormGridProps {
  forms: FormSummaryItem[]
  isLoading: boolean
  isEmpty: boolean
  isSearchEmpty: boolean
  onCreateClick: () => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRename: (id: string, newTitle: string) => void
}

export function FormGrid({
  forms,
  isLoading,
  isEmpty,
  isSearchEmpty,
  onCreateClick,
  onDelete,
  onDuplicate,
  onRename,
}: FormGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="h-32 w-full rounded-t-lg md:h-40" />
            <div className="px-2 pb-2">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold">
          You don&apos;t have any forms yet
        </h2>
        <p className="mb-6 max-w-sm text-muted-foreground">
          Create your first form to start collecting responses and engaging with
          your audience.
        </p>
        <Button onClick={onCreateClick} size="lg">
          Create form
        </Button>
      </div>
    )
  }

  if (isSearchEmpty) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <h2 className="text-lg font-medium text-muted-foreground">
          No forms match your search
        </h2>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {forms.map((form) => (
        <FormCard
          key={form.id}
          form={form}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRename={onRename}
        />
      ))}
    </div>
  )
}
