"use client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { QuestionType } from "@/types/api"
import { questionTypeMeta } from "../questions/questionTypeMeta"
import { cn } from "@/lib/utils"

interface QuestionTypePickerProps {
  onSelect: (type: QuestionType) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
}

export function QuestionTypePicker({
  onSelect,
  open,
  onOpenChange,
  trigger,
}: QuestionTypePickerProps) {
  const groups: { label: string; types: QuestionType[] }[] = [
    { label: "Text", types: ["short_text", "long_text", "email", "number"] },
    { label: "Choice", types: ["multiple_choice", "dropdown", "yes_no"] },
    { label: "Rating", types: ["rating"] },
  ]

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={true}>
      <PopoverTrigger
        render={
          trigger ? (
            <div />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          )
        }
      >
        {trigger}
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-0 shadow-xl"
        align="start"
        side="bottom"
      >
        <div className="flex max-h-[400px] flex-col overflow-y-auto">
          {groups.map((group, i) => (
            <div
              key={group.label}
              className={cn("flex flex-col p-2", i > 0 && "border-t")}
            >
              <div className="px-2 py-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </div>
              {group.types.map((type) => {
                const meta = questionTypeMeta[type]
                const Icon = meta.icon
                return (
                  <button
                    key={type}
                    onClick={() => {
                      onSelect(type)
                      onOpenChange(false)
                    }}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60"
                  >
                    <div
                      className={cn(
                        "rounded-md bg-muted/50 p-1.5",
                        meta.colorClass
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {meta.name}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
