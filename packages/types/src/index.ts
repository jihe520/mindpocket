/**
 * @repo/types - Shared type definitions for MindPocket monorepo
 *
 * This package provides common TypeScript types used across:
 * - apps/web (Next.js)
 * - apps/native (Expo React Native)
 * - apps/extension (WXT browser extension)
 */

// AI provider types
// biome-ignore lint/performance/noBarrelFile: This package entrypoint intentionally defines the public API surface.
export {
  AI_PROVIDER_TYPES,
  type AiProvider,
  type AiProviderType,
  type ChatModel,
} from "./ai-provider"
// Bookmark types
export {
  BOOKMARK_TYPES,
  type BookmarkFilters,
  type BookmarkItem,
  type BookmarkItemInFolder,
  type BookmarkPagination,
  type BookmarkType,
  CLIENT_SOURCES,
  type ClientSource,
  type FetchBookmarksParams,
  type FetchBookmarksResult,
  INGEST_STATUSES,
  type IngestStatus,
  SOURCE_TYPES,
  type SourceType,
} from "./bookmark"
// Cache types
export type { CacheEntry, CacheMap } from "./cache"
// Chat types
export type {
  ChatDetail,
  ChatItem,
  MessageAttachment,
  MessageItem,
  MessagePart,
  MessageRole,
} from "./chat"
// Folder types
export type { FolderItem } from "./folder"
// Ingest types
export type { IngestResult } from "./ingest"
// Integration types
export type { BilibiliCredentials } from "./integration"
// Platform detection
export {
  inferBookmarkType,
  inferPlatform,
  PLATFORM_PATTERNS,
  URL_TYPE_PATTERNS,
} from "./platform"
// Search types
export {
  parseSearchMode,
  parseSearchScope,
  SEARCH_MODES,
  type SearchMatchReason,
  type SearchMode,
  type SearchParams,
  type SearchResponse,
  type SearchResultItem,
  type SearchScope,
} from "./search"
// UI types
export type { SearchDialogState, ViewMode } from "./ui"
// User types
export type { UserInfo } from "./user"
