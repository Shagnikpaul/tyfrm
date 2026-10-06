"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { QuestionType } from "@/types/api";
import { questionTypeMeta } from "../questions/questionTypeMeta";
import { cn } from "@/lib/utils";

interface QuestionTypePickerProps {
  onSelect: (type: QuestionType) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function QuestionTypePicker({ onSelect, open, onOpenChange, trigger }: QuestionTypePickerProps) {
  const groups: { label: string; types: QuestionType[] }[] = [
    { label: "Text", types: ["short_text", "long_text", "email", "number"] },
    { label: "Choice", types: ["multiple_choice", "dropdown", "yes_no"] },
    { label: "Rating", types: ["rating"] },
  ];

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={true}>
      <PopoverTrigger render={trigger ? <div /> : <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground"><Plus className="h-4 w-4 mr-2" /> Add Question</Button>}>
        {trigger}
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-0 shadow-xl" align="start" side="bottom">
        <div className="flex flex-col max-h-[400px] overflow-y-auto">
          {groups.map((group, i) => (
            <div key={group.label} className={cn("flex flex-col p-2", i > 0 && "border-t")}>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </div>
              {group.types.map(type => {
                const meta = questionTypeMeta[type];
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      onSelect(type);
                      onOpenChange(false);
                    }}
                    className="flex items-center gap-3 px-2 py-1.5 text-sm rounded-md hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className={cn("p-1.5 rounded-md bg-muted/50", meta.colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {meta.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
