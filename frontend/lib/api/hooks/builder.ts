import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../client";
import { queryKeys } from "../keys";
import { Form, Question, QuestionSettings, QuestionType } from "../../../types/api";

export function usePublishForm(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<Form>(`/forms/${id}/publish`, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.setQueryData(queryKeys.form(id), data);
    },
  });
}

export function useUnpublishForm(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<Form>(`/forms/${id}/unpublish`, { method: "POST" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.setQueryData(queryKeys.form(id), data);
    },
  });
}

export function useCreateQuestion(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: QuestionType; title: string; required: boolean; settings: QuestionSettings; position?: number }) =>
      request<Question>(`/forms/${formId}/questions`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (newQ) => {
      // Optimistically we could do it, but let's just refetch or update cache
      const prev = queryClient.getQueryData<Form>(queryKeys.form(formId));
      if (prev) {
        queryClient.setQueryData(queryKeys.form(formId), {
          ...prev,
          questions: [...prev.questions, newQ].sort((a, b) => a.position - b.position),
        });
      }
    },
  });
}

export function useUpdateQuestion(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, data, confirm }: { qid: string; data: Partial<Question>; confirm?: boolean }) => {
      const url = `/forms/${formId}/questions/${qid}${confirm ? "?confirm=true" : ""}`;
      return request<Question>(url, { method: "PATCH", body: JSON.stringify(data) });
    },
    onSuccess: (updatedQ) => {
      const prev = queryClient.getQueryData<Form>(queryKeys.form(formId));
      if (prev) {
        queryClient.setQueryData(queryKeys.form(formId), {
          ...prev,
          questions: prev.questions.map((q) => (q.id === updatedQ.id ? updatedQ : q)).sort((a, b) => a.position - b.position),
        });
      }
    },
  });
}

export function useDeleteQuestion(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, confirm }: { qid: string; confirm?: boolean }) => {
      const url = `/forms/${formId}/questions/${qid}${confirm ? "?confirm=true" : ""}`;
      return request(url, { method: "DELETE" });
    },
    onSuccess: (_, variables) => {
      const prev = queryClient.getQueryData<Form>(queryKeys.form(formId));
      if (prev) {
        queryClient.setQueryData(queryKeys.form(formId), {
          ...prev,
          questions: prev.questions.filter((q) => q.id !== variables.qid),
        });
      }
    },
  });
}

export function useReorderQuestions(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (question_ids: string[]) =>
      request(`/forms/${formId}/questions/order`, { method: "PUT", body: JSON.stringify({ question_ids }) }),
    // Optimistic update should happen in the component before calling this
  });
}
