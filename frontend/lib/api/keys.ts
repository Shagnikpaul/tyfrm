export const queryKeys = {
  forms: (search?: string, status?: string, sort?: string) => ["forms", { search, status, sort }] as const,
  form: (id: string) => ["form", id] as const,
  responses: (id: string, page?: number, sort?: string) => ["responses", id, { page, sort }] as const,
  response: (id: string, responseId: string) => ["response", id, responseId] as const,
  summary: (id: string) => ["summary", id] as const,
  publicForm: (slug: string) => ["publicForm", slug] as const,
};
