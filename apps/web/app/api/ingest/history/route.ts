import { INGEST_STATUSES } from "@repo/types"
import { and, desc, eq, inArray, lt, type SQL } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { auth } from "@/lib/auth"

const STALE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Auto-fail stale pending/processing bookmarks older than 5 minutes
  const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS)
  await db
    .update(bookmark)
    .set({ ingestStatus: "failed", ingestError: "Ingest timed out" })
    .where(
      and(
        eq(bookmark.userId, session.user.id),
        inArray(bookmark.ingestStatus, ["pending", "processing"]),
        lt(bookmark.createdAt, staleThreshold)
      )
    )

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100)
  const offset = Number(searchParams.get("offset")) || 0

  const conditions: SQL[] = [eq(bookmark.userId, session.user.id)]

  if (status && INGEST_STATUSES.includes(status as (typeof INGEST_STATUSES)[number])) {
    conditions.push(eq(bookmark.ingestStatus, status))
  }

  const items = await db
    .select({
      id: bookmark.id,
      title: bookmark.title,
      type: bookmark.type,
      sourceType: bookmark.sourceType,
      clientSource: bookmark.clientSource,
      ingestStatus: bookmark.ingestStatus,
      ingestError: bookmark.ingestError,
      url: bookmark.url,
      platform: bookmark.platform,
      createdAt: bookmark.createdAt,
    })
    .from(bookmark)
    .where(and(...conditions))
    .orderBy(desc(bookmark.createdAt))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({ items })
}
