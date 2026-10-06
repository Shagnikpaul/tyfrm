"use client"

import { useForm } from "@/lib/api/hooks/useForm"
import { useFormSummary } from "@/lib/api/hooks/results"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SummaryPage() {
  const params = useParams()
  const id = params.id as string

  const { data: form } = useForm(id)
  const { data: summary, isLoading, error } = useFormSummary(id)

  if (isLoading || !form) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Failed to load summary.
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-4 md:p-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-center shadow-sm">
          <div className="mb-1 text-3xl font-bold">{summary.views}</div>
          <div className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
            Views
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-center shadow-sm">
          <div className="mb-1 text-3xl font-bold">
            {summary.total_responses}
          </div>
          <div className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
            Responses
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-center shadow-sm">
          <div className="mb-1 text-3xl font-bold">
            {summary.completion_rate !== null
              ? `${Math.round(summary.completion_rate * 100)}%`
              : "0%"}
          </div>
          <div className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
            Completion rate
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Question Breakdown</h2>
        {summary.questions.map((qSummary, i) => {
          const stats = qSummary.stats
          const totalAnswers = qSummary.answered_count

          return (
            <div
              key={qSummary.question_id}
              className="rounded-lg border bg-card p-6 shadow-sm"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                  {i + 1}
                </div>
                <div className="mt-1 min-w-0 flex-1">
                  <h3 className="text-lg leading-snug font-medium">
                    {qSummary.title}
                  </h3>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {qSummary.answered_count} answered •{" "}
                    {qSummary.skipped_count} skipped
                  </div>
                </div>
              </div>

              {/* Chart rendering based on type */}
              {(qSummary.type === "multiple_choice" ||
                qSummary.type === "dropdown") &&
                stats.options && (
                  <div className="flex flex-col gap-3">
                    {stats.options.map((opt) => {
                      const pct =
                        totalAnswers > 0 ? opt.count / totalAnswers : 0
                      return (
                        <div key={opt.label} className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="truncate pr-4">
                              {opt.label} {opt.is_orphan && "(Deleted option)"}
                            </span>
                            <span className="shrink-0 font-medium">
                              {opt.count} ({Math.round(pct * 100)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="bg-action h-full"
                              style={{ width: `${pct * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

              {qSummary.type === "yes_no" && (
                <div className="flex flex-col gap-3">
                  {["yes", "no"].map((val) => {
                    const count = val === "yes" ? stats.yes || 0 : stats.no || 0
                    const pct = totalAnswers > 0 ? count / totalAnswers : 0
                    return (
                      <div key={val} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="truncate pr-4 capitalize">
                            {val}
                          </span>
                          <span className="shrink-0 font-medium">
                            {count} ({Math.round(pct * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="bg-action h-full"
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {qSummary.type === "rating" && stats.average !== undefined && (
                <div className="flex flex-col gap-4">
                  <div className="text-4xl font-bold text-amber-500">
                    {stats.average.toFixed(1)}{" "}
                    <span className="text-lg font-normal text-muted-foreground">
                      average
                    </span>
                  </div>
                  {stats.distribution && (
                    <div className="mt-2 flex flex-col gap-2">
                      {stats.distribution.map((dist) => {
                        const pct =
                          totalAnswers > 0 ? dist.count / totalAnswers : 0
                        return (
                          <div
                            key={dist.value}
                            className="flex items-center gap-3"
                          >
                            <div className="w-4 shrink-0 text-right text-xs">
                              {dist.value}⭐
                            </div>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${pct * 100}%` }}
                              />
                            </div>
                            <div className="w-12 text-xs text-muted-foreground">
                              {dist.count}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {qSummary.type === "number" && stats.average !== undefined && (
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                      Average
                    </span>
                    <span className="text-2xl font-bold">
                      {stats.average.toFixed(2)}
                    </span>
                  </div>
                  {stats.min !== undefined && (
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                        Min
                      </span>
                      <span className="text-2xl font-bold">{stats.min}</span>
                    </div>
                  )}
                  {stats.max !== undefined && (
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                        Max
                      </span>
                      <span className="text-2xl font-bold">{stats.max}</span>
                    </div>
                  )}
                </div>
              )}

              {(qSummary.type === "short_text" ||
                qSummary.type === "long_text" ||
                qSummary.type === "email") &&
                stats.recent && (
                  <div className="flex flex-col gap-2">
                    <div className="mb-1 text-sm font-medium">
                      Recent responses:
                    </div>
                    {stats.recent.length === 0 ? (
                      <div className="text-sm text-muted-foreground italic">
                        No responses yet.
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {stats.recent.map((ans, idx) => (
                          <li
                            key={idx}
                            className="truncate rounded-md bg-muted/50 p-3 text-sm"
                          >
                            {ans}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
