import type { FetchBookmarksParams, FetchBookmarksResult } from "@repo/types"
import { requestJson, requestVoid } from "./api-client"

// Re-export for backward compatibility
export type { BookmarkItem, FetchBookmarksParams, FetchBookmarksResult } from "@repo/types"

export function fetchBookmarks(params: FetchBookmarksParams = {}): Promise<FetchBookmarksResult> {
  const searchParams = new URLSearchParams()
  if (params.type) {
    searchParams.set("type", params.type)
  }
  if (params.platform) {
    searchParams.set("platform", params.platform)
  }
  searchParams.set("limit", String(params.limit ?? 20))
  searchParams.set("offset", String(params.offset ?? 0))

  return requestJson<FetchBookmarksResult>(`/api/bookmarks?${searchParams}`)
}

export async function deleteBookmark(id: string): Promise<void> {
  await requestVoid(`/api/bookmarks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
