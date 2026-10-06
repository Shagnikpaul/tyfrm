import { Question } from "../../types/api";

export function validateAnswer(question: Question, value: any): string | null {
  const isUnanswered =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (question.required && isUnanswered) {
    return "This question is required";
  }

  // If not required and unanswered, it's valid
  if (isUnanswered) {
    return null;
  }

  const { type, settings } = question;

  switch (type) {
    case "short_text":
    case "long_text": {
      const text = typeof value === "string" ? value.trim() : "";
      if (!text && question.required) return "This question is required";
      const max = (settings as any).max_length;
      if (max && text.length > max) return `Maximum ${max} characters`;
      return null;
    }

    case "email": {
      const email = typeof value === "string" ? value.trim() : "";
      // Very basic email validation, real Typeform uses a regex
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Enter a valid email address";
      }
      return null;
    }

    case "number": {
      if (typeof value !== "number" || !isFinite(value)) {
        return "Enter a valid number";
      }
      const min = (settings as any).min;
      const max = (settings as any).max;
      if (min !== null && min !== undefined && value < min) return `Must be at least ${min}`;
      if (max !== null && max !== undefined && value > max) return `Must be at most ${max}`;
      return null;
    }

    case "yes_no": {
      if (value !== true && value !== false) {
        return "Choose Yes or No";
      }
      return null;
    }

    case "rating": {
      const steps = (settings as any).steps || 5;
      if (typeof value !== "number" || value < 1 || value > steps) {
        return `Choose a rating between 1 and ${steps}`;
      }
      return null;
    }

    case "multiple_choice": {
      const isMulti = (settings as any).allow_multiple;
      if (isMulti) {
        if (!Array.isArray(value) || value.length === 0) {
          if (question.required) return "Choose from the available options";
        }
      } else {
        if (typeof value !== "string" || !value) {
          return "Choose one of the available options";
        }
      }
      return null;
    }

    case "dropdown": {
      if (typeof value !== "string" || !value) {
        return "Choose one of the available options";
      }
      return null;
    }

    default:
      return null;
  }
}
