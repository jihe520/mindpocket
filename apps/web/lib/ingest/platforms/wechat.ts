import { convertHtml } from "../converter"
import type { ConvertResult } from "./index"

const WX_IMG_DATA_SRC_REGEX = /<img[^>]+data-src="([^"]+)"[^>]*>/gi
const WX_IMG_SRC_REGEX = /<img[^>]+src="(https?:\/\/mmbiz[^"]+)"[^>]*>/gi
const MD_IMG_REGEX = /!\[[^\]]*\]\([^)]+\)/g
const MD_IMG_URL_REGEX = /\(([^)]+)\)/

function extractWechatImages(html: string): string[] {
  const images: string[] = []
  const seen = new Set<string>()

  for (const regex of [WX_IMG_DATA_SRC_REGEX, WX_IMG_SRC_REGEX]) {
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

export async function convertWechat(html: string, url: string): Promise<ConvertResult | null> {
  const result = await convertHtml(html, url)
  if (!result?.markdown) {
    return null
  }

  const images = extractWechatImages(html)
  if (images.length === 0) {
    return result
  }

  const existingImages = result.markdown.match(MD_IMG_REGEX) ?? []
  const existingUrls = new Set(
    existingImages.map((img) => {
      const urlMatch = img.match(MD_IMG_URL_REGEX)
      return urlMatch ? urlMatch[1] : ""
    })
  )

  const missingImages = images.filter((img) => !existingUrls.has(img))
  if (missingImages.length === 0) {
    return result
  }

  const imageMarkdown = missingImages.map((img) => `![](${img})`).join("\n\n")
  const markdown = `${result.markdown}\n\n${imageMarkdown}`

  return { title: result.title, markdown }
}
