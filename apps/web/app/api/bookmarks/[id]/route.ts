import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { getBookmarkById, getBookmarkTags } from "@/db/queries/bookmark"
import { bookmark } from "@/db/schema/bookmark"
import { folder } from "@/db/schema/folder"
import { requireApiSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }

  const userId = result.session.user.id

  const { id } = await params
  const item = await getBookmarkById({ id, userId })
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const tags = await getBookmarkTags(id)

  return NextResponse.json({ ...item, tags })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }

  const userId = result.session.user.id

  const { id } = await params
  const existing = await getBookmarkById({ id, userId })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await request.json()
  const { title, content, description, folderId } = body

  const updates: Record<string, unknown> = {}
  if (title !== undefined) {
    updates.title = title
  }
  if (content !== undefined) {
    updates.content = content
  }
  if (description !== undefined) {
    updates.description = description
  }
  if (folderId !== undefined) {
    if (folderId === null) {
      updates.folderId = null
    } else if (typeof folderId === "string" && folderId.trim()) {
      const [targetFolder] = await db
        .select({ id: folder.id })
        .from(folder)
        .where(and(eq(folder.id, folderId.trim()), eq(folder.userId, userId)))
        .limit(1)

      if (!targetFolder) {
        return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
      }

      updates.folderId = folderId.trim()
    } else {
      return NextResponse.json({ error: "Invalid folderId" }, { status: 400 })
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  await db.update(bookmark).set(updates).where(eq(bookmark.id, id))

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }

  const userId = result.session.user.id

  const { id } = await params
  const existing = await getBookmarkById({ id, userId })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.delete(bookmark).where(eq(bookmark.id, id))

  return NextResponse.json({ success: true })
}
