import { NextResponse } from "next/server"
import { requireApiSession } from "@/lib/api-auth"

export async function POST(request: Request) {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }

  try {
    const body = await request.json()
    const { sessdata, biliJct, buvid3 } = body

    if (!(sessdata && biliJct && buvid3)) {
      return NextResponse.json(
        { error: "Missing required fields: sessdata, biliJct, buvid3" },
        { status: 400 }
      )
    }

    // Test with a known video that has subtitles
    const testBvid = "BV1uT4y1P7CX"
    const videoInfoRes = await fetch(
      `https://api.bilibili.com/x/web-interface/view?bvid=${testBvid}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    )
    const videoInfo = await videoInfoRes.json()

    if (!(videoInfo?.data?.aid && videoInfo?.data?.cid)) {
      return NextResponse.json({ error: "Failed to fetch test video info" }, { status: 500 })
    }

    const { aid, cid } = videoInfo.data
    const cookieHeader = `SESSDATA=${sessdata}; bili_jct=${biliJct}; buvid3=${buvid3}`

    const playerRes = await fetch(
      `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`,
      {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://www.bilibili.com",
        },
      }
    )

    const playerData = await playerRes.json()

    if (playerData.code !== 0) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid credentials or API error",
          details: playerData.message,
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: true,
      message: "Credentials are valid",
    })
  } catch (error) {
    console.error("Failed to test Bilibili credentials:", error)
    return NextResponse.json({ error: "Failed to test credentials" }, { status: 500 })
  }
}
