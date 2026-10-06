"use client";

import Link from "next/link";
import { FormSummaryItem } from "@/types/api";
import { FormThumbnail } from "./FormThumbnail";
import { MoreHorizontal, Edit2, BarChart2, LinkIcon, Copy, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { RenameFormDialog } from "./RenameFormDialog";

interface FormCardProps {
  form: FormSummaryItem;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function FormCard({ form, onDelete, onDuplicate, onRename }: FormCardProps) {
  const [renameOpen, setRenameOpen] = useState(false);

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(form.share_url);
    toast.success("Link copied");
  };

  return (
    <>
      <div className="group relative flex flex-col bg-card border border-border rounded-lg overflow-hidden transition-all hover:shadow-md hover:border-muted-foreground/30">
        <Link href={`/forms/${form.id}/edit`} className="block w-full">
          <FormThumbnail slug={form.slug} title={form.title} />
        </Link>
        
        <div className="p-4 flex flex-col gap-1 relative bg-card">
          <Link href={`/forms/${form.id}/edit`} className="block w-full">
            <h3 className="font-medium text-foreground line-clamp-1 pr-8">{form.title}</h3>
          </Link>
          <div className="flex items-center text-xs text-muted-foreground gap-3 mt-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${form.status === 'published' ? 'bg-success' : 'bg-muted-foreground'}`}></span>
              {form.status === 'published' ? 'Published' : 'Draft'}
            </span>
            <span>{form.response_count} responses</span>
          </div>

          <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link href={`/forms/${form.id}/edit`} className="cursor-pointer w-full flex items-center">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/forms/${form.id}/results`} className="cursor-pointer w-full flex items-center">
                    <BarChart2 className="mr-2 h-4 w-4" />
                    View results
                  </Link>
                </DropdownMenuItem>
                {form.status === "published" && (
                  <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copy link
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRenameOpen(true)} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(form.id)} className="cursor-pointer">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(form.id)} className="text-destructive focus:text-destructive cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <RenameFormDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentTitle={form.title}
        onRename={(newTitle) => onRename(form.id, newTitle)}
      />
    </>
  );
}
