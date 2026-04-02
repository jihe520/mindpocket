import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { folder } from "@/db/schema/folder"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { id } = await params

  const [item] = await db
    .select({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      emoji: folder.emoji,
      sortOrder: folder.sortOrder,
    })
    .from(folder)
    .where(and(eq(folder.id, id), eq(folder.userId, userId)))
    .limit(1)

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const items = await db
    .select({ id: bookmark.id, title: bookmark.title })
    .from(bookmark)
    .where(eq(bookmark.folderId, id))
    .limit(5)

  return NextResponse.json({
    folder: {
      ...item,
      items,
    },
  })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const { id } = await params
  const body = await request.json()
  const { emoji, name, description } = body

  const updates: Record<string, unknown> = {}
  if (typeof emoji === "string") {
    updates.emoji = emoji
  }
  if (typeof name === "string" && name.trim()) {
    updates.name = name.trim()
  }
  if (description === null) {
    updates.description = null
  } else if (typeof description === "string") {
    updates.description = description.trim().slice(0, 200) || null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const result = await db
    .update(folder)
    .set(updates)
    .where(and(eq(folder.id, id), eq(folder.userId, userId)))
    .returning({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      emoji: folder.emoji,
    })

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(result[0])
}
