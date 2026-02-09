import type { ConvertResult } from "./index"

const BVID_REGEX = /bvid=([A-Za-z0-9]+)/
const BV_URL_REGEX = /\/video\/(BV[A-Za-z0-9]+)/
const IFRAME_REGEX = /<iframe[^>]*src="([^"]*player\.bilibili\.com[^"]*)"[^>]*>/i
const TITLE_REGEX = /<title[^>]*>([^<]+)<\/title>/i
const META_TITLE_REGEX = /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i
const BILIBILI_SUFFIX_REGEX = /_哔哩哔哩.*$/
const FALLBACK_BVID_REGEX = /BV[A-Za-z0-9]{10}/

function extractBvid(html: string, url: string): string | null {
  const urlMatch = url.match(BV_URL_REGEX)
  if (urlMatch) {
    return urlMatch[1]
  }

  const iframeMatch = html.match(IFRAME_REGEX)
  if (iframeMatch) {
    const bvidMatch = iframeMatch[1].match(BVID_REGEX)
    if (bvidMatch) {
      return bvidMatch[1]
    }
  }

  const htmlBvidMatch = html.match(FALLBACK_BVID_REGEX)
  return htmlBvidMatch ? htmlBvidMatch[0] : null
}

function extractTitle(html: string): string | null {
  const ogTitle = html.match(META_TITLE_REGEX)
  if (ogTitle) {
    return ogTitle[1].replace(BILIBILI_SUFFIX_REGEX, "").trim()
  }

  const title = html.match(TITLE_REGEX)
  if (title) {
    return title[1].replace(BILIBILI_SUFFIX_REGEX, "").trim()
  }

  return null
}

export function convertBilibili(html: string, url: string): ConvertResult | null {
  const bvid = extractBvid(html, url)
  if (!bvid) {
    return null
  }

  const title = extractTitle(html)
  const videoUrl = `https://www.bilibili.com/video/${bvid}`
  const iframeSrc = `//player.bilibili.com/player.html?isOutside=true&bvid=${bvid}`

  const markdown = [
    title ? `# ${title}` : "# B站视频",
    "",
    `**视频链接**：${videoUrl}`,
    "",
    `<iframe src="${iframeSrc}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`,
  ].join("\n")

  return { title, markdown }
}
