/**
 * Platform detection patterns and utilities
 */

import type { BookmarkType } from "./bookmark"

/**
 * Platform patterns for URL detection
 */
export const PLATFORM_PATTERNS: Array<{ pattern: RegExp; platform: string }> = [
  { pattern: /mp\.weixin\.qq\.com/, platform: "wechat" },
  { pattern: /youtube\.com|youtu\.be/, platform: "youtube" },
  { pattern: /github\.com/, platform: "github" },
  { pattern: /zhihu\.com/, platform: "zhihu" },
  { pattern: /bilibili\.com/, platform: "bilibili" },
  { pattern: /xiaohongshu\.com|xhslink\.com/, platform: "xiaohongshu" },
  { pattern: /twitter\.com|x\.com/, platform: "twitter" },
  { pattern: /medium\.com/, platform: "medium" },
  { pattern: /reddit\.com/, platform: "reddit" },
  { pattern: /stackoverflow\.com/, platform: "stackoverflow" },
  { pattern: /juejin\.cn/, platform: "juejin" },
  { pattern: /jianshu\.com/, platform: "jianshu" },
  { pattern: /notion\.so/, platform: "notion" },
  { pattern: /arxiv\.org/, platform: "arxiv" },
]

/**
 * Infer platform from URL
 */
export function inferPlatform(url: string): string | null {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) {
      return platform
    }
  }
  return null
}

/**
 * URL type patterns for bookmark type detection
 */
export const URL_TYPE_PATTERNS: Array<{ pattern: RegExp; type: BookmarkType }> = [
  { pattern: /youtube\.com|youtu\.be/, type: "video" },
  { pattern: /bilibili\.com/, type: "video" },
  { pattern: /mp\.weixin\.qq\.com/, type: "article" },
  { pattern: /\.(pdf)$/i, type: "document" },
  { pattern: /\.(mp3|wav)$/i, type: "audio" },
  { pattern: /\.(jpg|jpeg|png|gif|webp)$/i, type: "image" },
]

/**
 * Infer bookmark type from URL
 */
export function inferBookmarkType(url: string): BookmarkType | null {
  for (const { pattern, type } of URL_TYPE_PATTERNS) {
    if (pattern.test(url)) {
      return type
    }
  }
  return null
}