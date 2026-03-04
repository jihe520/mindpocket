import type { BilibiliCredentials } from "@repo/types"
import type { ConvertResult } from "./index"

const BV_URL_REGEX = /\/video\/(BV[A-Za-z0-9]+)/
const BILIBILI_SUFFIX_REGEX = /_哔哩哔哩.*$/

interface SubtitleItem {
  from: number
  to: number
  content: string
}

interface SubtitleData {
  body: SubtitleItem[]
}

interface SubtitleInfo {
  lan: string
  lan_doc: string
  subtitle_url: string
}

function extractBvidFromUrl(url: string): string | null {
  const match = url.match(BV_URL_REGEX)
  return match ? match[1] : null
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

async function fetchTitle(bvid: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    const json = await res.json()
    if (json?.data?.title) {
      return json.data.title.replace(BILIBILI_SUFFIX_REGEX, "").trim()
    }
  } catch (error) {
    console.error("[bilibili] Failed to fetch title from API:", error)
  }
  return null
}

async function fetchVideoInfo(bvid: string): Promise<{ aid: number; cid: number } | null> {
  try {
    const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    })
    const json = await res.json()
    if (json?.data?.aid && json?.data?.cid) {
      return { aid: json.data.aid, cid: json.data.cid }
    }
  } catch (error) {
    console.error("[bilibili] Failed to fetch video info:", error)
  }
  return null
}

async function fetchSubtitles(
  aid: number,
  cid: number,
  credentials: BilibiliCredentials
): Promise<SubtitleInfo[] | null> {
  try {
    const cookieHeader = `SESSDATA=${credentials.sessdata}; bili_jct=${credentials.biliJct}; buvid3=${credentials.buvid3}`
    const res = await fetch(`https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`, {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.bilibili.com",
      },
    })
    const json = await res.json()
    if (json?.data?.subtitle?.subtitles) {
      return json.data.subtitle.subtitles
    }
  } catch (error) {
    console.error("[bilibili] Failed to fetch subtitles:", error)
  }
  return null
}

async function downloadSubtitle(subtitleUrl: string): Promise<SubtitleData | null> {
  try {
    const url = subtitleUrl.startsWith("//") ? `https:${subtitleUrl}` : subtitleUrl
    const res = await fetch(url)
    const data = await res.json()
    return data
  } catch (error) {
    console.error("[bilibili] Failed to download subtitle:", error)
  }
  return null
}

function formatSubtitleToMarkdown(subtitleData: SubtitleData): string {
  const lines = ["## 视频字幕", ""]
  for (const item of subtitleData.body) {
    lines.push(`[${formatTime(item.from)}] ${item.content}`)
  }
  return lines.join("\n")
}

export async function convertBilibili(
  url: string,
  credentials?: BilibiliCredentials | null
): Promise<ConvertResult | null> {
  const bvid = extractBvidFromUrl(url)
  if (!bvid) {
    return null
  }

  const title = await fetchTitle(bvid)
  const videoUrl = `https://www.bilibili.com/video/${bvid}`
  const iframeSrc = `//player.bilibili.com/player.html?isOutside=true&bvid=${bvid}`

  const markdownParts = [
    title ? `# ${title}` : "# B站视频",
    "",
    `**视频链接**：${videoUrl}`,
    "",
    `<iframe src="${iframeSrc}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`,
  ]

  // Try to fetch subtitles if credentials are provided
  if (credentials) {
    const videoInfo = await fetchVideoInfo(bvid)
    if (videoInfo) {
      const subtitles = await fetchSubtitles(videoInfo.aid, videoInfo.cid, credentials)
      if (subtitles && subtitles.length > 0) {
        // Prefer Chinese subtitles, fallback to first available
        const subtitle = subtitles.find((s) => s.lan.includes("zh")) || subtitles[0]
        const subtitleData = await downloadSubtitle(subtitle.subtitle_url)
        if (subtitleData) {
          markdownParts.push("", formatSubtitleToMarkdown(subtitleData))
        }
      }
    }
  }

  const markdown = markdownParts.join("\n")

  return { title, markdown }
}
