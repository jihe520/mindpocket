/**
 * Ingest type definitions
 * Re-exports common types from @repo/types and adds web-specific types
 */

import type { BookmarkType } from "@repo/types"
import { CLIENT_SOURCES, inferPlatform as inferPlatformBase } from "@repo/types"
import { z } from "zod"

export type {
  BookmarkType,
  ClientSource,
  IngestResult,
  IngestStatus,
  SourceType,
} from "@repo/types"

// Re-export from @repo/types
// biome-ignore lint/performance/noBarrelFile: This module intentionally centralizes ingest-related shared exports.
export {
  BOOKMARK_TYPES,
  CLIENT_SOURCES,
  INGEST_STATUSES,
  PLATFORM_PATTERNS,
  SOURCE_TYPES,
  URL_TYPE_PATTERNS,
} from "@repo/types"

// Zod schemas (web-specific validation)
export const ingestUrlSchema = z.object({
  url: z.string().url(),
  folderId: z.string().trim().min(1).optional(),
  title: z.string().optional(),
  clientSource: z.enum(CLIENT_SOURCES),
})

export const ingestExtensionSchema = z.object({
  url: z.string().url(),
  html: z.string().min(1).optional(),
  title: z.string().optional(),
  folderId: z.string().trim().min(1).optional(),
  clientSource: z.enum(CLIENT_SOURCES),
})

// File extension to bookmark type mapping (web-specific)
export const EXTENSION_TYPE_MAP: Record<string, BookmarkType> = {
  ".pdf": "document",
  ".docx": "document",
  ".doc": "document",
  ".md": "document",
  ".markdown": "document",
  ".xlsx": "spreadsheet",
  ".xls": "spreadsheet",
  ".csv": "spreadsheet",
  ".mp3": "audio",
  ".wav": "audio",
  ".mp4": "video",
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".gif": "image",
  ".webp": "image",
  ".html": "article",
  ".htm": "article",
  ".xml": "article",
  ".ipynb": "document",
  ".zip": "other",
}

// Re-export inferPlatform from @repo/types
export const inferPlatform = inferPlatformBase
