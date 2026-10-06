"use client";

import Link from "next/link";
import { ArrowLeft, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/types/api";
import { useUpdateForm } from "@/lib/api/hooks/dashboard";
import { usePublishForm, useUnpublishForm } from "@/lib/api/hooks/builder";
import { useState, useEffect } from "react";
import { useBuilderStore } from "@/store/builderStore";
import { ThemeToggle } from "../layout/ThemeToggle";
import { toast } from "sonner";
import { ShareModal } from "./ShareModal";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SaveIndicator } from "./SaveIndicator";

interface BuilderShellProps {
  form: Form;
  children: React.ReactNode;
}

export function BuilderShell({ form, children }: BuilderShellProps) {
  const pathname = usePathname();
  const activeTab = pathname.endsWith("/results") ? "results" : pathname.endsWith("/connect") ? "connect" : "create";
  
  const updateForm = useUpdateForm();
  const publishForm = usePublishForm(form.id);
  const unpublishForm = useUnpublishForm(form.id);
  const saveStatus = useBuilderStore(s => s.saveStatus);
  const setSaveStatus = useBuilderStore(s => s.setSaveStatus);
  
  const [title, setTitle] = useState(form.title);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setTitle(form.title);
  }, [form.title]);

  const handleTitleBlur = () => {
    if (!title.trim()) {
      setTitle(form.title); // revert on empty
      toast.error("Form title can't be empty");
      return;
    }
    if (title !== form.title) {
      setSaveStatus("saving");
      updateForm.mutate({ id: form.id, data: { title: title.trim() } }, {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error")
      });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setTitle(form.title);
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const handlePublish = () => {
    if (form.questions.length === 0) {
      toast.error("Add at least one question before publishing.");
      return;
    }
    setSaveStatus("saving");
    publishForm.mutate(undefined, {
      onSuccess: () => {
        setSaveStatus("saved");
        toast.success("Form published");
        setShareOpen(true);
      },
      onError: () => {
        setSaveStatus("error");
        toast.error("Failed to publish form");
      }
    });
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background overflow-hidden">
      <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 bg-background z-10">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <Link href="/forms" tabIndex={-1}>
            <Button variant="ghost" size="icon" className="shrink-0 mr-1 md:mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <input
            type="text"
            className="text-base md:text-lg font-medium bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-b-2 focus:border-action w-32 md:w-64 truncate transition-all"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
          />
          
          <div className="hidden md:flex items-center gap-3 ml-2">
            <div className={cn(
              "text-xs px-2 py-0.5 rounded-full border",
              form.status === "published" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"
            )}>
              {form.status === "published" ? "Published" : "Draft"}
            </div>
            <SaveIndicator status={saveStatus} />
          </div>
        </div>
        
        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="flex bg-muted/50 p-1 rounded-md">
            <Link href={`/forms/${form.id}/edit`} className={cn("px-4 py-1.5 text-sm font-medium rounded-sm transition-colors", activeTab === "create" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              Create
            </Link>
            <Link href={`/forms/${form.id}/connect`} className={cn("px-4 py-1.5 text-sm font-medium rounded-sm transition-colors", activeTab === "connect" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              Connect
            </Link>
            <Link href={`/forms/${form.id}/results`} className={cn("px-4 py-1.5 text-sm font-medium rounded-sm transition-colors", activeTab === "results" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              Results
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 md:gap-3 flex-1">
          <ThemeToggle />
          <Link href={`/forms/${form.id}/preview`} className="hidden sm:flex" tabIndex={-1}>
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>
          
          {form.status === "draft" ? (
            <Button size="sm" onClick={handlePublish} disabled={publishForm.isPending}>
              Publish
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShareOpen(true)}>
              Share
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 relative">
        {children}
      </main>

      <ShareModal 
        open={shareOpen} 
        onOpenChange={setShareOpen} 
        form={form} 
        onUnpublish={() => {
          unpublishForm.mutate(undefined, {
            onSuccess: () => toast.success("Form unpublished")
          });
        }}
      />
    </div>
  );
}
