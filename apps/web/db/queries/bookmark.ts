import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { folder } from "@/db/schema/folder"
import { bookmarkTag, tag } from "@/db/schema/tag"

export async function getBookmarksByUserId({
  userId,
  type,
  folderId,
  search,
  limit = 20,
  offset = 0,
}: {
  userId: string
  type?: string
  folderId?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const conditions = [eq(bookmark.userId, userId), eq(bookmark.isArchived, false)]

  if (type && type !== "all") {
    conditions.push(eq(bookmark.type, type))
  }

  if (folderId) {
    conditions.push(eq(bookmark.folderId, folderId))
  }

  if (search) {
    conditions.push(
      or(ilike(bookmark.title, `%${search}%`), ilike(bookmark.description, `%${search}%`))!
    )
  }

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: bookmark.id,
        type: bookmark.type,
        title: bookmark.title,
        description: bookmark.description,
        url: bookmark.url,
        coverImage: bookmark.coverImage,
        isFavorite: bookmark.isFavorite,
        createdAt: bookmark.createdAt,
        folderId: bookmark.folderId,
        folderName: folder.name,
        folderEmoji: folder.emoji,
      })
      .from(bookmark)
      .leftJoin(folder, eq(bookmark.folderId, folder.id))
      .where(and(...conditions))
      .orderBy(desc(bookmark.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(bookmark)
      .where(and(...conditions)),
  ])

  return {
    bookmarks: items,
    total: Number(countResult[0]?.count ?? 0),
    hasMore: offset + limit < Number(countResult[0]?.count ?? 0),
  }
}

export async function getBookmarkTags(bookmarkId: string) {
  return db
    .select({ id: tag.id, name: tag.name, color: tag.color })
    .from(bookmarkTag)
    .innerJoin(tag, eq(bookmarkTag.tagId, tag.id))
    .where(eq(bookmarkTag.bookmarkId, bookmarkId))
}
