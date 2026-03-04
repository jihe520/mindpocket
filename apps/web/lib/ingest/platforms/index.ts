import type { BilibiliCredentials } from "@repo/types"
import { convertHtml } from "../converter"
import { convertBilibili } from "./bilibili"
import { convertWechat } from "./wechat"
import { convertXiaohongshu } from "./xiaohongshu"

export interface ConvertResult {
  title: string | null
  markdown: string
}

/** 不需要浏览器渲染的平台，可直接从 URL 解析 */
const BROWSER_FREE_PLATFORMS = new Set(["bilibili"])

export function needsBrowser(platform: string | null): boolean {
  if (!platform) {
    return false
  }
  return !BROWSER_FREE_PLATFORMS.has(platform)
}

/**
 * 不需要 HTML 的平台转换（直接从 URL 解析）
 */
export async function convertWithoutHtml(
  url: string,
  platform: string,
  credentials?: BilibiliCredentials | null
): Promise<ConvertResult | null> {
  switch (platform) {
    case "bilibili":
      return await convertBilibili(url, credentials)
    default:
      return null
  }
}

/**
 * 需要 HTML 的平台转换
 */
export async function convertWithPlatform(
  html: string,
  url: string,
  platform: string | null
): Promise<ConvertResult | null> {
  switch (platform) {
    case "wechat":
      return await convertWechat(html, url)
    case "xiaohongshu":
      return await convertXiaohongshu(html, url)
    default:
      return await convertHtml(html, url)
  }
}
