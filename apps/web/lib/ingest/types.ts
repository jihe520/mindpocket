/**
 * 类型定义模块
 * 导入并扩展 @repo/types 中的共享类型，添加 Web 端特定的验证 Schema
 */

import type { BookmarkType } from "@repo/types"
import { CLIENT_SOURCES, inferPlatform as inferPlatformBase } from "@repo/types"
import { z } from "zod"

// 重新导出公共类型
export type {
  BookmarkType,
  ClientSource,
  IngestResult,
  IngestStatus,
  SourceType,
} from "@repo/types"

// 重新导出公共常量
// biome-ignore lint/performance/noBarrelFile: This module intentionally centralizes ingest-related shared exports.
export {
  BOOKMARK_TYPES,
  CLIENT_SOURCES,
  INGEST_STATUSES,
  PLATFORM_PATTERNS,
  SOURCE_TYPES,
  URL_TYPE_PATTERNS,
} from "@repo/types"

// ==================== Web 端特定的 Schema ====================

/** URL 导入的请求验证 Schema */
export const ingestUrlSchema = z.object({
  url: z.url(),
  folderId: z.string().trim().min(1).optional(),
  title: z.string().optional(),
  clientSource: z.enum(CLIENT_SOURCES),
})

/** 浏览器扩展导入的请求验证 Schema */
export const ingestExtensionSchema = z.object({
  url: z.url(),
  html: z.string().min(1).optional(),
  title: z.string().optional(),
  folderId: z.string().trim().min(1).optional(),
  clientSource: z.enum(CLIENT_SOURCES),
})

// ==================== 文件类型映射 ====================

/** 文件扩展名到书签类型的映射 */
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

/** 允许上传并进入 ingest 流程的文件扩展名列表 */
export const ALLOWED_INGEST_FILE_EXTENSIONS = Object.keys(EXTENSION_TYPE_MAP)

// 重新导出 inferPlatform
export const inferPlatform = inferPlatformBase
