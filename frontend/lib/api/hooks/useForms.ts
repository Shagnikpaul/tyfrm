import { useQuery } from "@tanstack/react-query"
import { request } from "../client"
import { queryKeys } from "../keys"
import { Paginated, FormSummaryItem } from "../../../types/api"

export function useForms(search?: string, status?: string, sort?: string) {
  return useQuery({
    queryKey: queryKeys.forms(search, status, sort),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (status) params.append("status", status)
      if (sort) params.append("sort", sort)
      const q = params.toString()
      return request<Paginated<FormSummaryItem>>(`/forms${q ? `?${q}` : ""}`)
    },
  })
}
