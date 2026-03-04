import type { SearchMode, SearchResponse } from "@repo/types"
import { requestJson } from "./api-client"

// Re-export for backward compatibility
export type { SearchMode, SearchResponse, SearchResultItem } from "@repo/types"

export function searchBookmarks(params: {
  q: string
  mode?: SearchMode
  limit?: number
  signal?: AbortSignal
}): Promise<SearchResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set("q", params.q)
  searchParams.set("mode", params.mode || "hybrid")
  searchParams.set("limit", String(params.limit || 20))

  return requestJson<SearchResponse>(`/api/search?${searchParams}`, {
    signal: params.signal,
  })
}
