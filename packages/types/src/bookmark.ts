/**
 * Bookmark type definitions
 */

export const BOOKMARK_TYPES = [
  "link",
  "article",
  "video",
  "image",
  "document",
  "audio",
  "spreadsheet",
  "other",
] as const

export type BookmarkType = (typeof BOOKMARK_TYPES)[number]

/**
 * Source type for bookmarks
 */
export const SOURCE_TYPES = ["url", "file", "extension"] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

/**
 * Client source for bookmarks
 */
export const CLIENT_SOURCES = ["web", "mobile", "extension"] as const
export type ClientSource = (typeof CLIENT_SOURCES)[number]

/**
 * Ingest status for bookmarks
 */
export const INGEST_STATUSES = ["pending", "processing", "completed", "failed"] as const
export type IngestStatus = (typeof INGEST_STATUSES)[number]

/**
 * Bookmark item interface - used across web, native, extension
 */
export interface BookmarkItem {
  id: string
  type: string
  title: string
  description: string | null
  url: string | null
  coverImage: string | null
  isFavorite: boolean
  createdAt: string
  folderId: string | null
  folderName: string | null
  folderEmoji: string | null
  platform: string | null
}

/**
 * Bookmark item within a folder (simplified)
 */
export interface BookmarkItemInFolder {
  id: string
  title: string
}

/**
 * Bookmark filters for queries
 */
export interface BookmarkFilters {
  type: string
  platform: string
  folderId?: string
}

/**
 * Bookmark pagination state
 */
export interface BookmarkPagination {
  offset: number
  limit: number
  hasMore: boolean
  total: number
}

/**
 * Fetch bookmarks parameters
 */
export interface FetchBookmarksParams {
  type?: string
  platform?: string
  limit?: number
  offset?: number
}

/**
 * Fetch bookmarks result
 */
export interface FetchBookmarksResult {
  bookmarks: BookmarkItem[]
  total: number
  hasMore: boolean
}