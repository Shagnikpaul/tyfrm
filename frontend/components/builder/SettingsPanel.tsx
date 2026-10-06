"use client"

import { Form, QuestionType, Question } from "@/types/api"
import { useBuilderStore } from "@/store/builderStore"
import { useUpdateForm } from "@/lib/api/hooks/dashboard"
import { useUpdateQuestion, useDeleteQuestion } from "@/lib/api/hooks/builder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Copy, Plus, X } from "lucide-react"
import { useState } from "react"
import { DestructiveConfirmDialog } from "./DestructiveConfirmDialog"
import { toast } from "sonner"
import { useCreateQuestion } from "@/lib/api/hooks/builder"

interface SettingsPanelProps {
  form: Form
}

export function SettingsPanel({ form }: SettingsPanelProps) {
  const { selectedItem, rightPanelTab, setRightPanelTab, setSelectedItem } =
    useBuilderStore()
  const updateForm = useUpdateForm()
  const updateQuestion = useUpdateQuestion(form.id)
  const deleteQuestion = useDeleteQuestion(form.id)
  const createQuestion = useCreateQuestion(form.id)
  const setSaveStatus = useBuilderStore((s) => s.setSaveStatus)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)

  if (!selectedItem) {
    return (
      <div className="flex h-full w-80 shrink-0 flex-col items-center justify-center border-l border-border bg-background p-6 text-center text-muted-foreground">
        Select a block in the left panel to configure it here.
      </div>
    )
  }

  const renderWelcomeSettings = () => {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="welcome-enabled"
            className="text-sm leading-none font-medium"
          >
            Enable Welcome Screen
          </label>
          <Switch
            id="welcome-enabled"
            checked={form.welcome.enabled}
            onCheckedChange={(checked) => {
              setSaveStatus("saving")
              updateForm.mutate(
                {
                  id: form.id,
                  data: { welcome: { ...form.welcome, enabled: checked } },
                },
                {
                  onSuccess: () => setSaveStatus("saved"),
                  onError: () => setSaveStatus("error"),
                }
              )
            }}
          />
        </div>
      </div>
    )
  }

  const renderEndingSettings = () => {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="text-sm text-muted-foreground">
          Ending screen is always shown. Configure the text on the canvas.
        </div>
      </div>
    )
  }

  const renderQuestionSettings = (qId: string) => {
    const question = form.questions.find((q) => q.id === qId)
    if (!question) return null

    const handleUpdate = (data: Partial<Question>) => {
      setSaveStatus("saving")
      updateQuestion.mutate(
        { qid: question.id, data },
        {
          onSuccess: () => setSaveStatus("saved"),
          onError: () => setSaveStatus("error"),
        }
      )
    }

    const handleDuplicate = () => {
      createQuestion.mutate(
        {
          type: question.type,
          title: question.title + " (copy)",
          required: question.required,
          settings: question.settings,
          position: question.position + 1,
        },
        {
          onSuccess: (newQ) => {
            setSelectedItem({ kind: "question", id: newQ.id })
            toast.success("Question duplicated")
          },
        }
      )
    }

    const handleDelete = () => {
      setQuestionToDelete(question.id)
      setDeleteOpen(true)
    }

    const confirmDelete = () => {
      if (!questionToDelete) return
      deleteQuestion.mutate(
        { qid: questionToDelete },
        {
          onSuccess: () => {
            toast.success("Question deleted")
            setSelectedItem(null)
            setDeleteOpen(false)
            setQuestionToDelete(null)
          },
          onError: (err: any) => {
            if (err.status === 409) {
              setDeleteOpen(false) // We'll need a way to force delete. PRD says use confirm=true.
              // For now, let's just do it directly with a prompt or add confirm: true.
              // Simplified: we just force delete if they click yes in a new dialog, but let's just add it to the standard dialog in the actual app.
              if (
                window.confirm(
                  "This question has logic rules attached. Deleting it will remove those rules. Are you sure?"
                )
              ) {
                deleteQuestion.mutate(
                  { qid: questionToDelete, confirm: true },
                  {
                    onSuccess: () => {
                      toast.success("Question deleted")
                      setSelectedItem(null)
                      setQuestionToDelete(null)
                    },
                  }
                )
              }
            } else {
              toast.error("Failed to delete question")
            }
          },
        }
      )
    }

    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="required"
              className="text-sm leading-none font-medium"
            >
              Required
            </label>
            <Switch
              id="required"
              checked={question.required}
              onCheckedChange={(checked) => handleUpdate({ required: checked })}
            />
          </div>

          {(question.type === "short_text" ||
            question.type === "long_text") && (
            <div className="flex flex-col gap-3">
              <label
                htmlFor="max_length"
                className="text-sm leading-none font-medium"
              >
                Max Characters
              </label>
              <Input
                id="max_length"
                type="number"
                placeholder="No limit"
                value={(question.settings as any).max_length || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : null
                  handleUpdate({
                    settings: { ...question.settings, max_length: val } as any,
                  })
                }}
              />
            </div>
          )}

          {(question.type === "multiple_choice" ||
            question.type === "dropdown") && (
            <div className="flex flex-col gap-4">
              <label className="text-sm leading-none font-medium">
                Options
              </label>
              <div className="flex flex-col gap-2">
                {((question.settings as any).options || []).map(
                  (opt: any, i: number) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <Input
                        value={opt.label}
                        onChange={(e) => {
                          const newOptions = [
                            ...((question.settings as any).options || []),
                          ]
                          newOptions[i].label = e.target.value
                          handleUpdate({
                            settings: {
                              ...question.settings,
                              options: newOptions,
                            },
                          })
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const newOptions = (
                            (question.settings as any).options || []
                          ).filter((_: any, idx: number) => idx !== i)
                          handleUpdate({
                            settings: {
                              ...question.settings,
                              options: newOptions,
                            },
                          })
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [
                    ...((question.settings as any).options || []),
                    { id: crypto.randomUUID(), label: "New Option" },
                  ]
                  handleUpdate({
                    settings: { ...question.settings, options: newOptions },
                  })
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Option
              </Button>

              {question.type === "multiple_choice" && (
                <div className="mt-4 flex items-center justify-between">
                  <label
                    htmlFor="allow_multiple"
                    className="text-sm leading-none font-medium"
                  >
                    Multiple selection
                  </label>
                  <Switch
                    id="allow_multiple"
                    checked={(question.settings as any).allow_multiple}
                    onCheckedChange={(checked) =>
                      handleUpdate({
                        settings: {
                          ...question.settings,
                          allow_multiple: checked,
                        } as any,
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {question.type === "number" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="min"
                  className="text-sm leading-none font-medium"
                >
                  Minimum
                </label>
                <Input
                  id="min"
                  type="number"
                  value={(question.settings as any).min ?? ""}
                  onChange={(e) => {
                    const val =
                      e.target.value !== "" ? parseFloat(e.target.value) : null
                    handleUpdate({
                      settings: { ...question.settings, min: val } as any,
                    })
                  }}
                />
              </div>
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="max"
                  className="text-sm leading-none font-medium"
                >
                  Maximum
                </label>
                <Input
                  id="max"
                  type="number"
                  value={(question.settings as any).max ?? ""}
                  onChange={(e) => {
                    const val =
                      e.target.value !== "" ? parseFloat(e.target.value) : null
                    handleUpdate({
                      settings: { ...question.settings, max: val } as any,
                    })
                  }}
                />
              </div>
            </div>
          )}

          {question.type === "rating" && (
            <div className="flex flex-col gap-3">
              <label
                htmlFor="steps"
                className="text-sm leading-none font-medium"
              >
                Steps (Stars)
              </label>
              <Input
                id="steps"
                type="number"
                min={1}
                max={10}
                value={(question.settings as any).steps || 5}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val) && val >= 1 && val <= 10) {
                    handleUpdate({
                      settings: { ...question.settings, steps: val },
                    })
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t bg-muted/20 p-4">
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>

        <DestructiveConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete Question?"
          description="Are you sure you want to delete this question? This action cannot be undone."
          onConfirm={confirmDelete}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-background">
      <Tabs
        value={rightPanelTab}
        onValueChange={(v) => setRightPanelTab(v as any)}
        className="flex h-full w-full flex-col"
      >
        <div className="border-b px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="question" className="flex-1">
              Question
            </TabsTrigger>
            <TabsTrigger value="design" className="flex-1">
              Design
            </TabsTrigger>
            <TabsTrigger value="logic" className="flex-1">
              Logic
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="question"
          className="mt-0 h-full flex-1 overflow-hidden border-none outline-none"
        >
          {selectedItem.kind === "welcome" && renderWelcomeSettings()}
          {selectedItem.kind === "ending" && renderEndingSettings()}
          {selectedItem.kind === "question" &&
            renderQuestionSettings(selectedItem.id)}
        </TabsContent>

        <TabsContent
          value="design"
          className="flex-1 p-6 text-center text-muted-foreground"
        >
          Design settings coming soon.
        </TabsContent>

        <TabsContent
          value="logic"
          className="flex-1 p-6 text-center text-muted-foreground"
        >
          Logic settings coming soon.
        </TabsContent>
      </Tabs>
    </div>
  )
}
