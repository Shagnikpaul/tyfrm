"use client"

import { useState } from "react"
import { Question } from "@/types/api"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DropdownProps {
  question: Question
  value: any
  onChange: (val: string) => void
  onEnter: () => void
  disabled?: boolean
}

export function Dropdown({
  question,
  value,
  onChange,
  onEnter,
  disabled,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const settings = question.settings as {
    options?: { id: string; label: string }[]
  }
  const options = settings.options || []

  const handleSelect = (currentValue: string) => {
    // CommandItem passes the lowercased value by default unless specified
    // So we find the original label to store
    const selected = options.find(
      (opt) => opt.label.toLowerCase() === currentValue.toLowerCase()
    )
    if (selected) {
      onChange(selected.label)
      setOpen(false)
      // Don't auto-advance on dropdown to let user verify, or auto-advance if preferred
      // PRD says: "Enter selects the highlighted option, not advance"
      // Wait, PRD 8.2 says: "Escape closes. Arrow keys move, Enter picks".
      // Let's not auto-advance, they can press Enter again.
    }
  }

  return (
    <div className="w-full max-w-md">
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              role="combobox"
              aria-expanded={open}
              className="hover:border-action/50 hover:bg-surface/50 flex w-full items-center justify-between rounded-lg border-2 border-border/60 bg-background/50 p-4 text-left transition-all outline-none"
            />
          }
        >
          <span className={cn("text-lg", !value && "text-muted-foreground/60")}>
            {value || "Select an option..."}
          </span>
          <ChevronDown className="h-5 w-5 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.label} // This is what handleSelect receives
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.label ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
