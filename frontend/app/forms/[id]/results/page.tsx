"use client";

import { useForm } from "@/lib/api/hooks/useForm";
import { useFormSummary } from "@/lib/api/hooks/results";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SummaryPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: form } = useForm(id);
  const { data: summary, isLoading, error } = useFormSummary(id);

  if (isLoading || !form) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="h-full flex items-center justify-center text-destructive">
        Failed to load summary.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="text-3xl font-bold mb-1">{summary.views}</div>
          <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Views</div>
        </div>
        <div className="bg-card border rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="text-3xl font-bold mb-1">{summary.total_responses}</div>
          <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Responses</div>
        </div>
        <div className="bg-card border rounded-lg p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="text-3xl font-bold mb-1">
            {summary.completion_rate !== null ? `${Math.round(summary.completion_rate * 100)}%` : "0%"}
          </div>
          <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Completion rate</div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Question Breakdown</h2>
        {summary.questions.map((qSummary, i) => {
          const stats = qSummary.stats;
          const totalAnswers = qSummary.answered_count;

          return (
            <div key={qSummary.question_id} className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted text-sm font-semibold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0 mt-1">
                  <h3 className="text-lg font-medium leading-snug">{qSummary.title}</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    {qSummary.answered_count} answered • {qSummary.skipped_count} skipped
                  </div>
                </div>
              </div>

              {/* Chart rendering based on type */}
              {(qSummary.type === "multiple_choice" || qSummary.type === "dropdown") && stats.options && (
                <div className="flex flex-col gap-3">
                  {stats.options.map((opt) => {
                    const pct = totalAnswers > 0 ? opt.count / totalAnswers : 0;
                    return (
                      <div key={opt.label} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="truncate pr-4">{opt.label} {opt.is_orphan && "(Deleted option)"}</span>
                          <span className="font-medium shrink-0">{opt.count} ({Math.round(pct * 100)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-action" 
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {qSummary.type === "yes_no" && (
                <div className="flex flex-col gap-3">
                  {["yes", "no"].map((val) => {
                    const count = val === "yes" ? (stats.yes || 0) : (stats.no || 0);
                    const pct = totalAnswers > 0 ? count / totalAnswers : 0;
                    return (
                      <div key={val} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="truncate pr-4 capitalize">{val}</span>
                          <span className="font-medium shrink-0">{count} ({Math.round(pct * 100)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-action" 
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {qSummary.type === "rating" && stats.average !== undefined && (
                <div className="flex flex-col gap-4">
                  <div className="text-4xl font-bold text-amber-500">
                    {stats.average.toFixed(1)} <span className="text-lg text-muted-foreground font-normal">average</span>
                  </div>
                  {stats.distribution && (
                     <div className="flex flex-col gap-2 mt-2">
                       {stats.distribution.map((dist) => {
                         const pct = totalAnswers > 0 ? dist.count / totalAnswers : 0;
                         return (
                           <div key={dist.value} className="flex items-center gap-3">
                             <div className="text-xs w-4 shrink-0 text-right">{dist.value}⭐</div>
                             <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                               <div className="h-full bg-amber-400" style={{ width: `${pct * 100}%` }} />
                             </div>
                             <div className="text-xs text-muted-foreground w-12">{dist.count}</div>
                           </div>
                         );
                       })}
                     </div>
                  )}
                </div>
              )}
              
              {qSummary.type === "number" && stats.average !== undefined && (
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Average</span>
                    <span className="text-2xl font-bold">{stats.average.toFixed(2)}</span>
                  </div>
                  {stats.min !== undefined && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Min</span>
                      <span className="text-2xl font-bold">{stats.min}</span>
                    </div>
                  )}
                  {stats.max !== undefined && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Max</span>
                      <span className="text-2xl font-bold">{stats.max}</span>
                    </div>
                  )}
                </div>
              )}

              {(qSummary.type === "short_text" || qSummary.type === "long_text" || qSummary.type === "email") && stats.recent && (
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium mb-1">Recent responses:</div>
                  {stats.recent.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">No responses yet.</div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {stats.recent.map((ans, idx) => (
                        <li key={idx} className="bg-muted/50 p-3 rounded-md text-sm truncate">
                          {ans}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
