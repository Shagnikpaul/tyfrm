"use client";

import { useState, useEffect } from "react";
import { Form, Question } from "@/types/api";
import { useUpdateQuestion } from "@/lib/api/hooks/builder";
import { useBuilderStore } from "@/store/builderStore";
import { ArrowRight } from "lucide-react";
import { ShortText } from "../questions/ShortText";
import { LongText } from "../questions/LongText";
import { MultipleChoice } from "../questions/MultipleChoice";
import { Dropdown } from "../questions/Dropdown";
import { Email } from "../questions/Email";
import { NumberInput } from "../questions/NumberInput";
import { YesNo } from "../questions/YesNo";
import { Rating } from "../questions/Rating";
import { OkButton } from "../respondent/OkButton";

interface QuestionCanvasProps {
  form: Form;
  question: Question;
}

export function QuestionCanvas({ form, question }: QuestionCanvasProps) {
  const updateQuestion = useUpdateQuestion(form.id);
  const setSaveStatus = useBuilderStore(s => s.setSaveStatus);
  
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description || "");

  useEffect(() => {
    setTitle(question.title);
    setDescription(question.description || "");
  }, [question.id, question.title, question.description]);

  const handleTitleBlur = () => {
    if (title !== question.title) {
      setSaveStatus("saving");
      updateQuestion.mutate({ qid: question.id, data: { title } }, {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error")
      });
    }
  };

  const handleDescBlur = () => {
    if (description !== (question.description || "")) {
      setSaveStatus("saving");
      updateQuestion.mutate({ qid: question.id, data: { description: description || null } }, {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error")
      });
    }
  };

  const InputComponent = {
    short_text: ShortText,
    long_text: LongText,
    multiple_choice: MultipleChoice,
    dropdown: Dropdown,
    email: Email,
    number: NumberInput,
    yes_no: YesNo,
    rating: Rating,
  }[question.type];

  const isAutoAdvance = ["yes_no", "rating", "multiple_choice"].includes(question.type) && 
    (question.type !== "multiple_choice" || !(question.settings as any).allow_multiple);

  return (
    <div className="flex flex-col w-full max-w-4xl animate-in fade-in duration-300">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex items-center text-action font-semibold text-sm md:text-base shrink-0 mt-2">
          {question.position + 1}
          <ArrowRight className="ml-1 w-4 h-4" />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <input
            type="text"
            className="text-2xl md:text-3xl font-medium tracking-tight leading-tight bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-b border-action w-full placeholder:text-muted-foreground/30 py-1"
            placeholder="Your question here..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
          />
          
          <input
            type="text"
            className="md:text-lg text-muted-foreground bg-transparent border-0 focus:ring-0 focus:outline-none focus:border-b border-action w-full placeholder:text-muted-foreground/30 py-1"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
          />
        </div>
      </div>
      
      <div className="mt-8 ml-8">
        <InputComponent
          question={question}
          value={undefined}
          onChange={() => {}}
          onEnter={() => {}}
          disabled={true} // Disabled in builder
        />
        
        {!isAutoAdvance && (
          <OkButton 
            onClick={() => {}} 
            disabled={true}
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
}
