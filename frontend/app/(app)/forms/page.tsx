"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForms } from "@/lib/api/hooks/useForms";
import { useCreateForm, useDeleteForm, useDuplicateForm, useUpdateForm } from "@/lib/api/hooks/dashboard";
import { FormGrid } from "@/components/dashboard/FormGrid";
import { CreateFormModal } from "@/components/dashboard/CreateFormModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FormsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || undefined;
  const currentSort = searchParams.get("sort") || "updated_desc";

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<{id: string, count: number} | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) {
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }
      if (params.toString() !== searchParams.toString()) {
        router.push(`/forms?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, router, searchParams]);

  const { data, isLoading } = useForms(
    currentSearch || undefined, 
    currentStatus, 
    currentSort
  );
  
  const createForm = useCreateForm();
  const deleteForm = useDeleteForm();
  const duplicateForm = useDuplicateForm();
  const updateForm = useUpdateForm();

  const handleSortChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/forms?${params.toString()}`);
  };

  const handleDeleteClick = (id: string) => {
    const form = data?.items.find(f => f.id === id);
    if (form) {
      setFormToDelete({ id, count: form.response_count });
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDelete = () => {
    if (formToDelete) {
      deleteForm.mutate(formToDelete.id, {
        onSuccess: () => {
          toast.success("Form deleted");
          setDeleteConfirmOpen(false);
          setFormToDelete(null);
        },
        onError: () => toast.error("Couldn't delete form")
      });
    }
  };
  
  const handleDuplicate = (id: string) => {
    duplicateForm.mutate(id, {
      onSuccess: () => toast.success("Form duplicated"),
      onError: () => toast.error("Couldn't duplicate form")
    });
  };
  
  const handleRename = (id: string, title: string) => {
    updateForm.mutate({ id, data: { title } }, {
      onSuccess: () => toast.success("Form renamed"),
      onError: () => toast.error("Couldn't rename form")
    });
  };

  const handleCreateScratch = () => {
    createForm.mutate(undefined, {
      onSuccess: (newForm) => {
        router.push(`/forms/${newForm.id}/edit`);
      },
      onError: () => toast.error("Couldn't create form")
    });
  };

  const forms = data?.items || [];
  const isEmpty = forms.length === 0 && !currentSearch && !currentStatus;
  const isSearchEmpty = forms.length === 0 && (!!currentSearch || !!currentStatus);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Forms</h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search forms..."
              className="pl-9 bg-surface/50 border-border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px] bg-surface/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Last updated</SelectItem>
              <SelectItem value="created_desc">Date created</SelectItem>
              <SelectItem value="title_asc">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateModalOpen(true)} className="flex-shrink-0" disabled={createForm.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Create form
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 pb-8">
        <FormGrid
          forms={forms}
          isLoading={isLoading}
          isEmpty={isEmpty}
          isSearchEmpty={isSearchEmpty}
          onCreateClick={() => setCreateModalOpen(true)}
          onDelete={handleDeleteClick}
          onDuplicate={handleDuplicate}
          onRename={handleRename}
        />
      </div>

      <CreateFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateScratch={handleCreateScratch}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the form and its {formToDelete?.count || 0} responses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
