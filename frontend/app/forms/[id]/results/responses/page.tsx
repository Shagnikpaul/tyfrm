"use client"

import { useForm } from "@/lib/api/hooks/useForm"
import { useFormResponses } from "@/lib/api/hooks/results"
import { useParams } from "next/navigation"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function ResponsesPage() {
  const params = useParams()
  const id = params.id as string

  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data: form } = useForm(id)
  const {
    data: responses,
    isLoading,
    error,
    isFetching,
  } = useFormResponses(id, page, pageSize)

  if (!form || (isLoading && !responses)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
      </div>
    )
  }

  if (error || !responses) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Failed to load responses.
      </div>
    )
  }

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return ""
    if (Array.isArray(val)) return val.join(", ")
    if (typeof val === "boolean") return val ? "Yes" : "No"
    return String(val)
  }

  const totalPages = Math.ceil(responses.total / pageSize)

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b bg-background p-4">
        <div className="text-sm font-medium">
          {responses.total} {responses.total === 1 ? "Response" : "Responses"}
        </div>

        <div className="flex items-center gap-4">
          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[60px] text-center text-sm text-muted-foreground">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/20">
        {responses.items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl">
              📭
            </div>
            <p>No responses yet.</p>
          </div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse divide-y divide-border">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky top-0 z-10 min-w-[200px] border-b border-border bg-background px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase shadow-sm"
                  >
                    Submitted At
                  </th>
                  {form.questions.map((q) => (
                    <th
                      key={q.id}
                      scope="col"
                      className="sticky top-0 z-10 max-w-[400px] min-w-[250px] truncate border-b border-border bg-background px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase shadow-sm"
                    >
                      {q.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {responses.items.map((response) => (
                  <tr
                    key={response.id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-foreground">
                      {new Date(response.created_at).toLocaleString()}
                    </td>
                    {form.questions.map((q) => {
                      const answer = response.answers.find(
                        (a) => a.question_id === q.id
                      )
                      return (
                        <td
                          key={q.id}
                          className="max-w-[400px] truncate px-4 py-4 text-sm text-foreground"
                        >
                          {formatValue(answer?.value)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
