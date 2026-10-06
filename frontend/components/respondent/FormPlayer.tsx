"use client"

import { useState, useRef, useEffect } from "react"
import { PublicForm, Question } from "@/types/api"
import { WelcomeScreen } from "./WelcomeScreen"
import { EndingScreen } from "./EndingScreen"
import { QuestionRenderer } from "../questions/QuestionRenderer"
import { validateAnswer } from "@/lib/validation/answerValidation"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface FormPlayerProps {
  form: PublicForm
  mode?: "play" | "preview"
  onSubmit?: (answers: { question_id: string; value: any }[]) => Promise<void>
}

type ScreenType = "welcome" | "question" | "ending"

export function FormPlayer({ form, mode = "play", onSubmit }: FormPlayerProps) {
  const hasWelcome = form.welcome.enabled
  const questions = [...form.questions].sort((a, b) => a.position - b.position)

  const [screenType, setScreenType] = useState<ScreenType>(
    hasWelcome ? "welcome" : questions.length > 0 ? "question" : "ending"
  )
  const [questionIndex, setQuestionIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const answersRef = useRef<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Keyboard navigation for Prev/Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return
      if (screenType !== "question") return

      if (e.key === "ArrowUp") {
        e.preventDefault()
        handlePrev()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        // Just move down to next without strict validation, or maybe validate?
        // PRD 9.5: "ArrowUp/ArrowDown navigate between questions only when the focus is not in a text input..."
        // Typically, we want to allow skipping around if they use arrows, but let's enforce validation on next.
        handleNext()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [screenType, questionIndex])

  const handleStart = () => {
    setDirection(1)
    setScreenType(questions.length > 0 ? "question" : "ending")
  }

  const handleNext = async () => {
    if (screenType !== "question") return

    const question = questions[questionIndex] as Question
    const value = answersRef.current[question.id]
    const error = validateAnswer(question, value)

    if (error) {
      setErrors((prev) => ({ ...prev, [question.id]: error }))
      return
    }

    // Clear error if valid
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[question.id]
      return newErrors
    })

    if (questionIndex < questions.length - 1) {
      setDirection(1)
      setQuestionIndex(questionIndex + 1)
    } else {
      // Last question - Submit
      submitForm()
    }
  }

  const handlePrev = () => {
    if (screenType === "question" && questionIndex > 0) {
      setDirection(-1)
      setQuestionIndex(questionIndex - 1)
    } else if (screenType === "question" && questionIndex === 0 && hasWelcome) {
      setDirection(-1)
      setScreenType("welcome")
    }
  }

  const submitForm = async () => {
    if (mode === "preview") {
      // Validate current first
      const question = questions[questionIndex] as Question
      const error = validateAnswer(question, answersRef.current[question.id])
      if (error) {
        setErrors((prev) => ({ ...prev, [question.id]: error }))
        return
      }
      toast("Preview only. This response wasn't saved.")
      setDirection(1)
      setScreenType("ending")
      return
    }

    if (!onSubmit) return

    setIsSubmitting(true)
    try {
      // Filter out unanswered optional questions
      const finalAnswers = Object.entries(answersRef.current)
        .filter(([_, val]) => {
          if (val === undefined || val === null || val === "") return false
          if (Array.isArray(val) && val.length === 0) return false
          return true
        })
        .map(([id, val]) => ({ question_id: id, value: val }))

      await onSubmit(finalAnswers)
      setDirection(1)
      setScreenType("ending")
    } catch (err: any) {
      if (err.status === 422 && err.details?.length > 0) {
        const firstError = err.details[0]
        if (firstError.question_id) {
          const idx = questions.findIndex(
            (q) => q.id === firstError.question_id
          )
          if (idx !== -1) {
            setDirection(idx < questionIndex ? -1 : 1)
            setQuestionIndex(idx)
            setErrors((prev) => ({
              ...prev,
              [firstError.question_id]: firstError.message,
            }))
          }
        } else {
          toast.error(firstError.message || "Validation failed")
        }
      } else {
        toast.error("Couldn't submit. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const pct = Math.round((questionIndex / Math.max(1, questions.length)) * 100)

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 32 : -32,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      y: direction < 0 ? 32 : -32,
      opacity: 0,
    }),
  }

  return (
    <div
      className={`relative flex h-[100dvh] w-full flex-col overflow-hidden ${form.theme?.mode === "dark" ? "dark bg-background" : "bg-background"}`}
    >
      {mode === "preview" && (
        <div className="absolute top-0 right-0 left-0 z-50 flex h-10 items-center justify-between border-b border-border bg-muted/80 px-4 backdrop-blur">
          <span className="text-sm font-medium text-muted-foreground">
            Preview mode
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            Exit preview
          </Button>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pt-12 pb-20 md:px-8">
        <AnimatePresence mode="wait" custom={direction}>
          {screenType === "welcome" && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex w-full"
            >
              <WelcomeScreen
                title={form.welcome.title}
                description={form.welcome.description}
                buttonText={form.welcome.button_text}
                onStart={handleStart}
                disabled={isSubmitting}
              />
            </motion.div>
          )}

          {screenType === "question" && questions[questionIndex] && (
            <motion.div
              key={questions[questionIndex].id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex w-full"
            >
              <QuestionRenderer
                mode={mode}
                question={questions[questionIndex] as Question}
                index={questionIndex}
                value={answers[questions[questionIndex].id]}
                onChange={(val) => {
                  setAnswers((prev) => {
                    const next = { ...prev, [questions[questionIndex].id]: val }
                    answersRef.current = next
                    return next
                  })
                  setErrors((prev) => {
                    const newErrs = { ...prev }
                    delete newErrs[questions[questionIndex].id]
                    return newErrs
                  })
                }}
                onSubmit={handleNext}
                error={errors[questions[questionIndex].id]}
              />
            </motion.div>
          )}

          {screenType === "ending" && (
            <motion.div
              key="ending"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex w-full"
            >
              <EndingScreen
                title={form.thank_you.title}
                message={form.thank_you.message}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress and Nav */}
      {screenType !== "ending" && (
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex items-end justify-between p-4 md:p-6">
          <div className="w-48 max-w-[30%]">
            {screenType === "question" && (
              <div className="flex flex-col gap-2 opacity-100 transition-opacity">
                <div className="text-xs font-semibold text-muted-foreground">
                  {pct}% completed
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-action h-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-action pointer-events-auto flex overflow-hidden rounded-md shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="text-action-foreground hover:bg-action/80 hover:text-action-foreground border-action-foreground/10 h-10 w-12 rounded-none border-r disabled:opacity-30"
              onClick={handlePrev}
              disabled={
                isSubmitting ||
                screenType === "welcome" ||
                (screenType === "question" &&
                  questionIndex === 0 &&
                  !hasWelcome)
              }
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-action-foreground hover:bg-action/80 hover:text-action-foreground h-10 w-12 rounded-none disabled:opacity-30"
              onClick={handleNext}
              disabled={isSubmitting || screenType !== "question"}
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
