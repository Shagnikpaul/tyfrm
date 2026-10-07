"use client"

import { useForm } from "@/lib/api/hooks/useForm"
import { useFormResponses } from "@/lib/api/hooks/results"
import { useParams } from "next/navigation"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      let safeDateString = dateString
      // Trim microsecond precision to millisecond to support all JS engines (e.g. Safari)
      if (/\.\d{4,}/.test(safeDateString)) {
        safeDateString = safeDateString.replace(/(\.\d{3})\d+/, "$1")
      }
      // Add Z if timezone is not specified
      if (!safeDateString.endsWith("Z") && !safeDateString.includes("+")) {
        safeDateString += "Z"
      }
      const d = new Date(safeDateString)
      return isNaN(d.getTime()) ? dateString : d.toLocaleString()
    } catch (e) {
      return dateString
    }
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
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <Table>
              <TableHeader className="bg-surface/50">
                <TableRow>
                  <TableHead className="min-w-[200px] h-11 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Submitted At
                  </TableHead>
                  {form.questions.map((q) => (
                    <TableHead
                      key={q.id}
                      className="max-w-[400px] min-w-[250px] truncate h-11 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      {q.title}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.items.map((response) => (
                  <TableRow
                    key={response.id}
                    className="hover:bg-surface/50"
                  >
                    <TableCell className="py-3 text-sm whitespace-nowrap text-foreground">
                      {formatDate(response.submitted_at || response.created_at)}
                    </TableCell>
                    {form.questions.map((q) => {
                      const answer = response.answers.find(
                        (a) => a.question_id === q.id
                      )
                      return (
                        <TableCell
                          key={q.id}
                          className="max-w-[400px] truncate py-3 text-sm text-foreground"
                        >
                          {formatValue(answer?.value)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
