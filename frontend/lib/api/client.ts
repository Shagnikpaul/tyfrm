export class ApiError extends Error {
  status: number
  code: string
  details?: any

  constructor(status: number, code: string, message: string, details?: any) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    })
  } catch (error) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Couldn't reach the server. Try again."
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  let data
  try {
    data = await response.json()
  } catch (e) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        "UNKNOWN_ERROR",
        "An unknown error occurred."
      )
    }
    return undefined as T // e.g., 200 OK with empty body
  }

  if (!response.ok) {
    if (data?.error) {
      throw new ApiError(
        response.status,
        data.error.code || "UNKNOWN_ERROR",
        data.error.message || "An API error occurred",
        data.error.details
      )
    }
    throw new ApiError(
      response.status,
      "UNKNOWN_ERROR",
      "An API error occurred"
    )
  }

  return data as T
}
