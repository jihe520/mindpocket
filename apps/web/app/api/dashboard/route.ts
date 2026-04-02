import { and, count, eq, gte, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { chat } from "@/db/schema/chat"
import { embedding } from "@/db/schema/embedding"
import { folder } from "@/db/schema/folder"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user!.id
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get("days") || "30")

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [stats, typeDistribution, folderRanking, growthTrend] = await Promise.all([
    getStats(userId, weekAgo),
    getTypeDistribution(userId),
    getFolderRanking(userId),
    getGrowthTrend(userId, startDate),
  ])

  return Response.json({ ...stats, typeDistribution, folderRanking, growthTrend })
}

async function getStats(userId: string, weekAgo: Date) {
  const [totalResult] = await db
    .select({ count: count() })
    .from(bookmark)
    .where(eq(bookmark.userId, userId))

  const [weekResult] = await db
    .select({ count: count() })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), gte(bookmark.createdAt, weekAgo)))

  const [chatResult] = await db.select({ count: count() }).from(chat).where(eq(chat.userId, userId))

  const [embeddedResult] = await db
    .select({ count: count() })
    .from(embedding)
    .innerJoin(bookmark, eq(embedding.bookmarkId, bookmark.id))
    .where(eq(bookmark.userId, userId))

  const totalBookmarks = totalResult?.count ?? 0
  const weekBookmarks = weekResult?.count ?? 0
  const totalChats = chatResult?.count ?? 0
  const totalEmbeddings = embeddedResult?.count ?? 0
  const embeddingRate =
    totalBookmarks > 0 ? Math.round((totalEmbeddings / totalBookmarks) * 100) : 0

  return { totalBookmarks, weekBookmarks, totalChats, embeddingRate }
}

async function getTypeDistribution(userId: string) {
  const result = await db
    .select({
      type: bookmark.type,
      count: count(),
    })
    .from(bookmark)
    .where(eq(bookmark.userId, userId))
    .groupBy(bookmark.type)

  return result
}

async function getFolderRanking(userId: string) {
  const result = await db
    .select({
      name: folder.name,
      emoji: folder.emoji,
      count: count(bookmark.id),
    })
    .from(folder)
    .leftJoin(bookmark, eq(folder.id, bookmark.folderId))
    .where(eq(folder.userId, userId))
    .groupBy(folder.id, folder.name, folder.emoji)
    .orderBy(sql`count(${bookmark.id}) desc`)
    .limit(10)

  return result
}

async function getGrowthTrend(userId: string, startDate: Date) {
  const result = await db
    .select({
      date: sql<string>`to_char(${bookmark.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(bookmark)
    .where(and(eq(bookmark.userId, userId), gte(bookmark.createdAt, startDate)))
    .groupBy(sql`to_char(${bookmark.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${bookmark.createdAt}, 'YYYY-MM-DD')`)

  const dateMap = new Map(result.map((r) => [r.date, r.count]))
  const trend: Array<{ date: string; count: number }> = []
  const current = new Date(startDate)
  const today = new Date()

  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0]!
    trend.push({ date: dateStr, count: dateMap.get(dateStr) ?? 0 })
    current.setDate(current.getDate() + 1)
  }

  return trend
}
