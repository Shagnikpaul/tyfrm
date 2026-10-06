"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Question } from "@/types/api";
import { questionTypeMeta } from "../questions/questionTypeMeta";
import { cn } from "@/lib/utils";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";

interface SortableQuestionItemProps {
  question: Question;
  index: number;
}

export function SortableQuestionItem({ question, index }: SortableQuestionItemProps) {
  const { selectedItem, setSelectedItem } = useBuilderStore();
  const isSelected = selectedItem?.kind === "question" && selectedItem.id === question.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = questionTypeMeta[question.type];
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setSelectedItem({ kind: "question", id: question.id })}
      className={cn(
        "group flex items-center justify-between p-2 my-1 rounded-md cursor-pointer transition-colors border border-transparent",
        isSelected ? "bg-action/10 border-action/20" : "hover:bg-muted",
        isDragging && "opacity-50 border-dashed border-border"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div 
          className="text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing p-1 -ml-1 rounded"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex items-center justify-center w-5 h-5 rounded-sm bg-muted text-muted-foreground text-[10px] font-bold shrink-0">
          {index + 1}
        </div>
        
        <div className={cn("p-1.5 rounded bg-muted shrink-0", meta.colorClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        
        <div className="text-sm font-medium truncate">
          {question.title || "Untitled question"}
        </div>
      </div>
    </div>
  );
}
