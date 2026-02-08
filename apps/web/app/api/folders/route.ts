import { eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { headers } from "next/headers"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { folder } from "@/db/schema/folder"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const folders = await db
    .select({
      id: folder.id,
      name: folder.name,
      emoji: folder.emoji,
      sortOrder: folder.sortOrder,
    })
    .from(folder)
    .where(eq(folder.userId, session.user.id))
    .orderBy(folder.sortOrder)

  // 获取每个文件夹下的书签（最多显示 5 条）
  const foldersWithBookmarks = await Promise.all(
    folders.map(async (f) => {
      const bookmarks = await db
        .select({ id: bookmark.id, title: bookmark.title })
        .from(bookmark)
        .where(eq(bookmark.folderId, f.id))
        .limit(5)

      return { ...f, items: bookmarks }
    })
  )

  return Response.json({ folders: foldersWithBookmarks })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) {
    return Response.json({ error: "名称不能为空" }, { status: 400 })
  }

  const emoji = typeof body.emoji === "string" ? body.emoji : "📁"

  // 获取当前最大 sortOrder
  const [max] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${folder.sortOrder}), -1)` })
    .from(folder)
    .where(eq(folder.userId, session.user.id))

  const newFolder = await db
    .insert(folder)
    .values({
      id: nanoid(),
      userId: session.user.id,
      name,
      emoji,
      sortOrder: (max?.maxOrder ?? -1) + 1,
    })
    .returning({
      id: folder.id,
      name: folder.name,
      emoji: folder.emoji,
      sortOrder: folder.sortOrder,
    })

  return Response.json({ folder: { ...newFolder[0], items: [] } }, { status: 201 })
}
