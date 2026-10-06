import { useQuery } from "@tanstack/react-query"
import { request } from "../client"
import { queryKeys } from "../keys"
import { Paginated, ResponseItem, Summary } from "../../../types/api"

export function useFormSummary(id: string) {
  return useQuery({
    queryKey: queryKeys.summary(id),
    queryFn: () => request<Summary>(`/forms/${id}/summary`),
  })
}

export function useFormResponses(id: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: queryKeys.responses(id, page),
    queryFn: () =>
      request<Paginated<ResponseItem>>(
        `/forms/${id}/responses?page=${page}&page_size=${pageSize}`
      ),
  })
}
