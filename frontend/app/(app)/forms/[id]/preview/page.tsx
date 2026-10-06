"use client";

import { useParams } from "next/navigation";
import { useForm } from "@/lib/api/hooks/useForm";
import { FormPlayer } from "@/components/respondent/FormPlayer";
import { Loader2 } from "lucide-react";

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: form, isLoading, error } = useForm(id);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-destructive">
        Failed to load form preview.
      </div>
    );
  }

  // Cast Form to PublicForm for the player
  const publicForm = {
    ...form,
    questions: form.questions.map(q => ({
      id: q.id,
      position: q.position,
      type: q.type,
      title: q.title,
      description: q.description,
      required: q.required,
      settings: q.settings
    }))
  };

  return <FormPlayer form={publicForm} mode="preview" />;
}
