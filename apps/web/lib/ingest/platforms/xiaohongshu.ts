import { convertHtml } from "../converter"
import type { ConvertResult } from "./index"

const TITLE_REGEX = /<meta[^>]+name="og:title"[^>]+content="([^"]+)"/i
const TITLE_REGEX_ALT = /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i
const DESC_REGEX = /<meta[^>]+name="description"[^>]+content="([^"]+)"/i
const XHS_IMG_REGEX = /<meta[^>]+name="og:image"[^>]+content="([^"]+)"/gi
const XHS_IMG_ALT_REGEX = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/gi

function extractTitle(html: string): string | null {
  const match = html.match(TITLE_REGEX) || html.match(TITLE_REGEX_ALT)
  return match ? match[1].trim() : null
}

function extractDescription(html: string): string | null {
  const match = html.match(DESC_REGEX)
  return match ? match[1].trim() : null
}

function extractImages(html: string): string[] {
  const images: string[] = []
  const seen = new Set<string>()

  for (const regex of [XHS_IMG_REGEX, XHS_IMG_ALT_REGEX]) {
    regex.lastIndex = 0
    for (const match of html.matchAll(regex)) {
      const url = match[1]
      if (!seen.has(url)) {
        seen.add(url)
        images.push(url)
      }
    }
  }

  return images
}

export async function convertXiaohongshu(html: string, url: string): Promise<ConvertResult | null> {
  const title = extractTitle(html)
  const description = extractDescription(html)
  const images = extractImages(html)

  // 如果无法从 meta 标签提取内容，降级到通用转换
  if (!(title || description) && images.length === 0) {
    return await convertHtml(html, url)
  }

  const parts: string[] = []

  if (title) {
    parts.push(`# ${title}`)
    parts.push("")
  }

  if (description) {
    parts.push(description)
    parts.push("")
  }

  for (const img of images) {
    parts.push(`![](${img})`)
    parts.push("")
  }

  parts.push(`**来源**：${url}`)

  return { title, markdown: parts.join("\n") }
}
