"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Question } from "@/types/api"
import { questionTypeMeta } from "../questions/questionTypeMeta"
import { cn } from "@/lib/utils"
import { GripVertical, MoreHorizontal } from "lucide-react"
import { useBuilderStore } from "@/store/builderStore"

interface SortableQuestionItemProps {
  question: Question
  index: number
}

export function SortableQuestionItem({
  question,
  index,
}: SortableQuestionItemProps) {
  const { selectedItem, setSelectedItem } = useBuilderStore()
  const isSelected =
    selectedItem?.kind === "question" && selectedItem.id === question.id

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const meta = questionTypeMeta[question.type]
  const Icon = meta.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setSelectedItem({ kind: "question", id: question.id })}
      className={cn(
        "group my-1 flex cursor-pointer items-center justify-between rounded-md border border-transparent p-2 transition-colors",
        isSelected ? "bg-action/10 border-action/20" : "hover:bg-muted",
        isDragging && "border-dashed border-border opacity-50"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className="-ml-1 cursor-grab rounded p-1 text-muted-foreground/50 hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[10px] font-bold text-muted-foreground">
          {index + 1}
        </div>

        <div className={cn("shrink-0 rounded bg-muted p-1.5", meta.colorClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="truncate text-sm font-medium">
          {question.title || "Untitled question"}
        </div>
      </div>
    </div>
  )
}
