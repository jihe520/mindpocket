import { NextResponse } from "next/server"
import {
  deleteBilibiliCredentials,
  hasBilibiliCredentials,
  saveBilibiliCredentials,
} from "@/db/queries/bilibili-credentials"
import { requireApiSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }
  const userId = result.session.user.id

  const hasCredentials = await hasBilibiliCredentials(userId)
  return NextResponse.json({ hasCredentials })
}

export async function POST(request: Request) {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }
  const userId = result.session.user.id

  try {
    const body = await request.json()
    const { sessdata, biliJct, buvid3 } = body

    if (!(sessdata && biliJct && buvid3)) {
      return NextResponse.json(
        { error: "Missing required fields: sessdata, biliJct, buvid3" },
        { status: 400 }
      )
    }

    await saveBilibiliCredentials(userId, {
      sessdata,
      biliJct,
      buvid3,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save Bilibili credentials:", error)
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 })
  }
}

export async function DELETE() {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }
  const userId = result.session.user.id

  try {
    await deleteBilibiliCredentials(userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete Bilibili credentials:", error)
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 })
  }
}
