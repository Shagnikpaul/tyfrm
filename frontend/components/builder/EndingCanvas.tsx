"use client";

import { useState, useEffect } from "react";
import { Form } from "@/types/api";
import { useUpdateForm } from "@/lib/api/hooks/dashboard";
import { useBuilderStore } from "@/store/builderStore";
import { CheckCircle2 } from "lucide-react";

interface EndingCanvasProps {
  form: Form;
}

export function EndingCanvas({ form }: EndingCanvasProps) {
  const updateForm = useUpdateForm();
  const setSaveStatus = useBuilderStore(s => s.setSaveStatus);
  
  const [title, setTitle] = useState(form.thank_you.title || "");
  const [message, setMessage] = useState(form.thank_you.message || "");

  useEffect(() => {
    setTitle(form.thank_you.title || "");
    setMessage(form.thank_you.message || "");
  }, [form.thank_you]);

  const handleBlur = () => {
    setSaveStatus("saving");
    updateForm.mutate({
      id: form.id,
      data: {
        thank_you: {
          title: title || "Thank you!",
          message: message || null,
        }
      }
    }, {
      onSuccess: () => setSaveStatus("saved"),
      onError: () => setSaveStatus("error")
    });
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl animate-in fade-in duration-300 mx-auto">
      <div className="mb-6 text-success">
        <CheckCircle2 className="w-16 h-16" />
      </div>
      
      <input
        type="text"
        className="text-3xl md:text-4xl font-bold tracking-tight leading-tight bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-b border-action w-full placeholder:text-muted-foreground/30 py-1 mb-4 text-center"
        placeholder="Ending title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      />
      
      <textarea
        className="text-lg md:text-xl text-muted-foreground max-w-2xl bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-b border-action w-full placeholder:text-muted-foreground/30 py-1 resize-none text-center h-32"
        placeholder="Ending message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
}
