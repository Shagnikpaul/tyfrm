"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string;
  onRename: (title: string) => void;
}

export function RenameFormDialog({ open, onOpenChange, currentTitle, onRename }: RenameFormDialogProps) {
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    if (open) setTitle(currentTitle);
  }, [open, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onRename(title.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename form</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Form title"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || title === currentTitle}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
