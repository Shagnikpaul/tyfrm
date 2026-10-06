export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating"

export interface Option {
  id: string
  label: string
}

export type QuestionSettings =
  | { max_length: number; placeholder: string } // short_text, long_text
  | { options: Option[]; allow_multiple?: boolean } // multiple_choice (allow_multiple), dropdown
  | { min: number | null; max: number | null } // number
  | { steps: number } // rating
  | Record<string, never> // email, yes_no

export interface Question {
  id: string
  form_id: string
  position: number
  type: QuestionType
  title: string
  description: string | null
  required: boolean
  settings: QuestionSettings
  created_at: string
  updated_at: string
}

export interface FormSummaryItem {
  id: string
  title: string
  slug: string
  status: "draft" | "published"
  question_count: number
  response_count: number
  view_count: number
  share_url: string
  created_at: string
  updated_at: string
}

export interface Form {
  id: string
  title: string
  slug: string
  status: "draft" | "published"
  share_url: string
  welcome: {
    enabled: boolean
    title: string | null
    description: string | null
    button_text: string
  }
  thank_you: { title: string; message: string | null }
  theme: { mode?: "light" | "dark" } & Record<string, unknown>
  view_count: number
  response_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  questions: Question[]
}

export interface PublicForm {
  slug: string
  title: string
  welcome: Form["welcome"]
  thank_you: Form["thank_you"]
  theme: Form["theme"]
  questions: Pick<
    Question,
    | "id"
    | "position"
    | "type"
    | "title"
    | "description"
    | "required"
    | "settings"
  >[]
}

export interface ResponseItem {
  id: string
  form_id: string
  answers: { question_id: string; value: any }[]
  created_at: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface SummaryQuestionStats {
  question_id: string
  type: string
  title: string
  answered_count: number
  skipped_count: number
  stats: {
    recent?: any[]
    average?: number
    distribution?: { value: number; count: number }[]
    yes?: number
    no?: number
    min?: number
    max?: number
    options?: { label: string; count: number; is_orphan: boolean }[]
  }
}

export interface Summary {
  form_id: string
  total_responses: number
  views: number
  completion_rate: number | null
  questions: SummaryQuestionStats[]
}
