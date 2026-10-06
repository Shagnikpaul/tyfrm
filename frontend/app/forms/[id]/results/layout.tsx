"use client";

import { useForm } from "@/lib/api/hooks/useForm";
import { useParams, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BuilderShell } from "@/components/builder/BuilderShell";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params.id as string;
  const pathname = usePathname();
  const { data: form, isLoading, error } = useForm(id);

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background text-destructive">
        Failed to load form.
      </div>
    );
  }

  const isResponses = pathname.endsWith("/responses");

  return (
    <BuilderShell form={form}>
      <div className="flex flex-col h-full w-full bg-surface">
        <div className="flex items-center gap-6 px-8 h-12 border-b border-border bg-background shrink-0">
          <Link 
            href={`/forms/${form.id}/results`}
            className={cn(
              "text-sm font-medium h-full flex items-center border-b-2 transition-colors",
              !isResponses ? "border-action text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Summary
          </Link>
          <Link 
            href={`/forms/${form.id}/results/responses`}
            className={cn(
              "text-sm font-medium h-full flex items-center border-b-2 transition-colors",
              isResponses ? "border-action text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Responses
          </Link>
        </div>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </BuilderShell>
  );
}
