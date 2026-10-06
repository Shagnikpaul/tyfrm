import { useQuery } from "@tanstack/react-query";
import { request } from "../client";
import { queryKeys } from "../keys";
import { Form } from "../../../types/api";

export function useForm(id: string) {
  return useQuery({
    queryKey: queryKeys.form(id),
    queryFn: () => request<Form>(`/forms/${id}`),
    staleTime: 0, // PRD says 0 for builder form while editing
  });
}
