import { NextResponse } from "next/server"
import {
  deleteBilibiliCredentials,
  hasBilibiliCredentials,
  saveBilibiliCredentials,
} from "@/db/queries/bilibili-credentials"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  })
  const userId = session!.user!.id

  const hasCredentials = await hasBilibiliCredentials(userId)
  return NextResponse.json({ hasCredentials })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  })
  const userId = session!.user!.id

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
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  })
  const userId = session!.user!.id

  try {
    await deleteBilibiliCredentials(userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete Bilibili credentials:", error)
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 })
  }
}
