/**
 * Ingest type definitions
 */

import type { BookmarkType, IngestStatus } from "./bookmark"

export interface IngestResult {
  bookmarkId: string
  title: string
  markdown: string | null
  type: BookmarkType
  status: IngestStatus
  error?: string
}
