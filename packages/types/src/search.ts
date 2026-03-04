/**
 * Search type definitions
 */

/**
 * Search mode
 */
export const SEARCH_MODES = ["keyword", "semantic", "hybrid"] as const
export type SearchMode = (typeof SEARCH_MODES)[number]

/**
 * Search scope
 */
export type SearchScope = "compact" | "full"

/**
 * Search match reason
 */
export type SearchMatchReason =
  | "title"
  | "description"
  | "content"
  | "url"
  | "tag"
  | "semantic"

/**
 * Search result item
 */
export interface SearchResultItem {
  id: string
  title: string
  description: string | null
  url: string | null
  type: string
  folderName: string | null
  folderEmoji: string | null
  createdAt: string
  score: number
  matchReasons: SearchMatchReason[]
  platform?: string | null
}

/**
 * Search response
 */
export interface SearchResponse {
  items: SearchResultItem[]
  modeUsed: SearchMode
  fallbackReason?: string
}

/**
 * Search parameters
 */
export interface SearchParams {
  q: string
  mode?: SearchMode
  limit?: number
}

/**
 * Parse search mode from string
 */
export function parseSearchMode(
  input?: string | null,
  fallback: SearchMode = "keyword"
): SearchMode {
  if (input === "keyword" || input === "semantic" || input === "hybrid") {
    return input
  }
  return fallback
}

/**
 * Parse search scope from string
 */
export function parseSearchScope(input?: string | null): SearchScope {
  return input === "compact" ? "compact" : "full"
}
