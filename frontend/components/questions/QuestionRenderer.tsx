"use client"

import { Question } from "@/types/api"
import { ShortText } from "./ShortText"
import { LongText } from "./LongText"
import { MultipleChoice } from "./MultipleChoice"
import { Dropdown } from "./Dropdown"
import { Email } from "./Email"
import { NumberInput } from "./NumberInput"
import { YesNo } from "./YesNo"
import { Rating } from "./Rating"
import { OkButton } from "../respondent/OkButton"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestionRendererProps {
  mode: "play" | "preview" | "edit"
  question: Question
  value?: any
  onChange?: (val: any) => void
  onSubmit?: () => void
  error?: string | null
  index: number
}

export function QuestionRenderer({
  mode,
  question,
  value,
  onChange,
  onSubmit,
  error,
  index,
}: QuestionRendererProps) {
  const isEdit = mode === "edit"
  const disabled = mode === "edit"

  // Note: For 'edit' mode, the PRD says the title/description are editable inline.
  // To keep things simple and unified for now, we'll just render them as text if not in edit mode,
  // and if in edit mode, the parent builder can override this or we can add it here.
  // The PRD 7.4 says: "It reuses the same QuestionRenderer components as the real player, in mode="edit"".
  // I will just make it a dumb renderer for the player for now. The edit mode logic will be handled later
  // by passing an editable wrapper or by extending this component in the builder phase.
  // Wait, for F2 we only need `play` and `preview`. Let's support rendering the content cleanly.

  const InputComponent = {
    short_text: ShortText,
    long_text: LongText,
    multiple_choice: MultipleChoice,
    dropdown: Dropdown,
    email: Email,
    number: NumberInput,
    yes_no: YesNo,
    rating: Rating,
  }[question.type]

  const handleEnter = () => {
    if (onSubmit && !disabled) onSubmit()
  }

  const handleChange = (val: any) => {
    if (onChange && !disabled) onChange(val)
  }

  const isAutoAdvance =
    ["yes_no", "rating", "multiple_choice"].includes(question.type) &&
    (question.type !== "multiple_choice" ||
      !(question.settings as any).allow_multiple)

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex items-start gap-4">
        <div className="bg-action/15 text-action mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm md:h-10 md:w-10 md:text-base md:rounded-2xl">
          {index + 1}
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl leading-tight font-medium tracking-tight md:text-3xl">
            {question.title}
            {question.required && (
              <span className="ml-2 text-xl text-destructive">*</span>
            )}
          </h2>

          {question.description && (
            <p className="text-muted-foreground md:text-lg">
              {question.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 ml-8">
        <InputComponent
          question={question}
          value={value}
          onChange={handleChange}
          onEnter={handleEnter}
          disabled={disabled}
          autoFocus={mode === "play"}
        />

        {/* Error presentation */}
        {error && (
          <div className="mt-3 inline-block animate-in rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive duration-150 fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* OK Button - shown for text/input types, or multi-select */}
        {!isAutoAdvance && (
          <OkButton
            onClick={handleEnter}
            disabled={disabled}
            className="mt-8"
          />
        )}
      </div>
    </div>
  )
}
