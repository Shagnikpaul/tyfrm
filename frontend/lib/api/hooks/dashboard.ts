import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../client";
import { queryKeys } from "../keys";
import { Form } from "../../../types/api";

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<Form>("/forms", { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Form> }) =>
      request<Form>(`/forms/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.setQueryData(queryKeys.form(data.id), data);
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/forms/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useDuplicateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<Form>(`/forms/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
