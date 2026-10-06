import { useQuery, useMutation } from "@tanstack/react-query";
import { request } from "../client";
import { queryKeys } from "../keys";
import { PublicForm } from "../../../types/api";

export function usePublicForm(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicForm(slug),
    queryFn: () => request<PublicForm>(`/public/forms/${slug}`),
    retry: false, // Don't retry on 404
  });
}

export function recordView(slug: string) {
  return request(`/public/forms/${slug}/view`, { method: "POST" }).catch(() => {});
}

export function useSubmitResponse(slug: string) {
  return useMutation({
    mutationFn: (answers: { question_id: string; value: any }[]) =>
      request(`/public/forms/${slug}/responses`, {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
  });
}
