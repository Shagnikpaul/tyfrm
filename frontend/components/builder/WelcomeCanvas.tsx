"use client";

import { useState, useEffect } from "react";
import { Form } from "@/types/api";
import { useUpdateForm } from "@/lib/api/hooks/dashboard";
import { useBuilderStore } from "@/store/builderStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WelcomeCanvasProps {
  form: Form;
}

export function WelcomeCanvas({ form }: WelcomeCanvasProps) {
  const updateForm = useUpdateForm();
  const setSaveStatus = useBuilderStore(s => s.setSaveStatus);
  
  const [title, setTitle] = useState(form.welcome.title || "");
  const [description, setDescription] = useState(form.welcome.description || "");
  const [buttonText, setButtonText] = useState(form.welcome.button_text || "Start");

  useEffect(() => {
    setTitle(form.welcome.title || "");
    setDescription(form.welcome.description || "");
    setButtonText(form.welcome.button_text || "Start");
  }, [form.welcome]);

  const handleSave = () => {
    setSaveStatus("saving");
    updateForm.mutate({
      id: form.id,
      data: {
        welcome: {
          enabled: form.welcome.enabled,
          title: title || null,
          description: description || null,
          button_text: buttonText || "Start"
        }
      }
    }, {
      onSuccess: () => setSaveStatus("saved"),
      onError: () => setSaveStatus("error")
    });
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <div className="flex flex-col w-full max-w-4xl animate-in fade-in duration-300">
      <input
        type="text"
        className="text-3xl md:text-4xl font-bold tracking-tight leading-tight bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-b border-action w-full placeholder:text-muted-foreground/30 py-1 mb-4"
        placeholder="Welcome screen title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      />
      
      <textarea
        className="text-lg md:text-xl text-muted-foreground bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-b border-action w-full placeholder:text-muted-foreground/30 py-1 mb-10 resize-none h-32"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleBlur}
      />
      
      <div className="flex items-center gap-4 mt-2">
        <div className="relative">
          <Button 
            className="h-12 px-8 text-base font-semibold rounded-md bg-action text-action-foreground pointer-events-none"
          >
            {/* We overlay an input on the button text so it can be edited */}
            <span className="opacity-0">{buttonText || "Start"}</span>
          </Button>
          <input
            type="text"
            className="absolute inset-0 bg-transparent text-center font-semibold text-action-foreground focus:outline-none placeholder:text-action-foreground/50"
            placeholder="Button text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
          />
        </div>
        <div className="hidden sm:flex items-center text-sm text-muted-foreground">
          press <strong className="font-semibold mx-1">Enter ↵</strong>
        </div>
      </div>
      
      {!form.welcome.enabled && (
        <div className="mt-8 p-4 bg-muted/50 rounded-md border text-sm text-muted-foreground">
          Welcome screen is currently disabled. You can enable it in the right sidebar.
        </div>
      )}
    </div>
  );
}
