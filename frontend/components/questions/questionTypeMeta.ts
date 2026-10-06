import { QuestionType } from "@/types/api"
import {
  Type,
  AlignLeft,
  ListChecks,
  ChevronDown,
  AtSign,
  Hash,
  ThumbsUp,
  Star,
} from "lucide-react"

export const questionTypeMeta: Record<
  QuestionType,
  { name: string; icon: any; colorClass: string }
> = {
  short_text: { name: "Short text", icon: Type, colorClass: "text-blue-500" },
  long_text: {
    name: "Long text",
    icon: AlignLeft,
    colorClass: "text-indigo-500",
  },
  multiple_choice: {
    name: "Multiple choice",
    icon: ListChecks,
    colorClass: "text-orange-500",
  },
  dropdown: {
    name: "Dropdown",
    icon: ChevronDown,
    colorClass: "text-pink-500",
  },
  email: { name: "Email", icon: AtSign, colorClass: "text-teal-500" },
  number: { name: "Number", icon: Hash, colorClass: "text-purple-500" },
  yes_no: { name: "Yes/No", icon: ThumbsUp, colorClass: "text-green-500" },
  rating: { name: "Rating", icon: Star, colorClass: "text-amber-500" },
}
