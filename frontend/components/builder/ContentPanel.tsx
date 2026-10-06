"use client";

import { Form, QuestionType } from "@/types/api";
import { useBuilderStore } from "@/store/builderStore";
import { SortableQuestionItem } from "./SortableQuestionItem";
import { QuestionTypePicker } from "./QuestionTypePicker";
import { useCreateQuestion, useReorderQuestions } from "@/lib/api/hooks/builder";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/keys";
import { toast } from "sonner";
import { FileDown, FileUp } from "lucide-react";

interface ContentPanelProps {
  form: Form;
}

export function ContentPanel({ form }: ContentPanelProps) {
  const { selectedItem, setSelectedItem } = useBuilderStore();
  const createQuestion = useCreateQuestion(form.id);
  const reorderQuestions = useReorderQuestions(form.id);
  const queryClient = useQueryClient();
  
  const [pickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = form.questions.findIndex((q) => q.id === active.id);
      const newIndex = form.questions.findIndex((q) => q.id === over.id);
      
      const newQuestions = arrayMove(form.questions, oldIndex, newIndex);
      
      // Optimistic update
      queryClient.setQueryData(queryKeys.form(form.id), {
        ...form,
        questions: newQuestions.map((q, i) => ({ ...q, position: i })),
      });
      
      reorderQuestions.mutate(newQuestions.map(q => q.id), {
        onError: () => {
          toast.error("Failed to reorder questions");
          queryClient.invalidateQueries({ queryKey: queryKeys.form(form.id) });
        }
      });
    }
  };

  const handleAddQuestion = (type: QuestionType) => {
    createQuestion.mutate({
      type,
      title: "New question",
      required: false,
      settings: type === "multiple_choice" || type === "dropdown" ? { options: [{ id: crypto.randomUUID(), label: "Option 1" }] } : {}
    }, {
      onSuccess: (newQ) => {
        setSelectedItem({ kind: "question", id: newQ.id });
      }
    });
  };

  return (
    <div className="w-64 border-r border-border bg-muted/20 flex flex-col h-full shrink-0">
      <div className="p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Build</h3>
          
          <div
            onClick={() => setSelectedItem({ kind: "welcome" })}
            className={cn(
              "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border border-transparent",
              selectedItem?.kind === "welcome" ? "bg-action/10 border-action/20 text-action" : "hover:bg-muted"
            )}
          >
            <div className="p-1.5 rounded bg-muted shrink-0 text-muted-foreground">
              <FileDown className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Welcome screen</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={form.questions.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {form.questions.map((q, i) => (
              <SortableQuestionItem key={q.id} question={q} index={i} />
            ))}
          </SortableContext>
        </DndContext>

        <div className="mt-4">
          <QuestionTypePicker 
            open={pickerOpen} 
            onOpenChange={setPickerOpen} 
            onSelect={handleAddQuestion} 
          />
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div
          onClick={() => setSelectedItem({ kind: "ending" })}
          className={cn(
            "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border border-transparent",
            selectedItem?.kind === "ending" ? "bg-action/10 border-action/20 text-action" : "hover:bg-muted"
          )}
        >
          <div className="p-1.5 rounded bg-muted shrink-0 text-muted-foreground">
            <FileUp className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Endings</span>
        </div>
      </div>
    </div>
  );
}
