"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, LayoutTemplate } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CreateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateScratch: () => void;
}

export function CreateFormModal({ open, onOpenChange, onCreateScratch }: CreateFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Create a new form</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          <button
            onClick={() => {
              onCreateScratch();
              onOpenChange(false);
            }}
            className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-xl hover:border-foreground transition-colors group h-48 bg-card"
          >
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="font-medium text-foreground">Start from scratch</span>
            <span className="text-sm text-muted-foreground mt-2 text-center">A blank canvas for your form</span>
          </button>

          <Tooltip>
            <TooltipTrigger render={<button disabled className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-xl opacity-60 cursor-not-allowed h-48 bg-card" />}>
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4 text-muted-foreground">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <span className="font-medium text-foreground">Choose a template</span>
              <span className="text-sm text-muted-foreground mt-2 text-center">Start with a pre-built design</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming soon</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </DialogContent>
    </Dialog>
  );
}
