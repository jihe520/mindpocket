import {
  parseSearchMode,
  type SearchMatchReason,
  type SearchMode,
  type SearchScope,
} from "@repo/types"
import { and, cosineDistance, desc, eq, gt, ilike, inArray, or, type SQL, sql } from "drizzle-orm"
import { db } from "@/db/client"
import { getDefaultProvider } from "@/db/queries/ai-provider"
import { bookmark } from "@/db/schema/bookmark"
import { embedding } from "@/db/schema/embedding"
import { folder } from "@/db/schema/folder"
import { bookmarkTag, tag } from "@/db/schema/tag"
import { generateEmbedding } from "@/lib/ai/embedding"
import { getEmbeddingModel } from "@/lib/ai/provider"

const MAX_INTERNAL_CANDIDATES = 50
const MIN_SEMANTIC_QUERY_LENGTH = 2
const RRF_K = 60

interface SearchHit {
  bookmarkId: string
  score: number
  matchReasons: SearchMatchReason[]
}

interface BookmarkLookupRow {
  id: string
  type: string
  title: string
  description: string | null
  url: string | null
  coverImage: string | null
  isFavorite: boolean
  createdAt: Date
  folderId: string | null
  folderName: string | null
  folderEmoji: string | null
  platform: string | null
}

export interface SearchResultItem {
  id: string
  type: string
  title: string
  description: string | null
  url: string | null
  coverImage: string | null
  isFavorite: boolean
  createdAt: Date
  folderId: string | null
  folderName: string | null
  folderEmoji: string | null
  platform: string | null
  score: number
  matchReasons: SearchMatchReason[]
}

export async function searchBookmarks({
  userId,
  q,
  mode,
  scope: _scope,
  limit = 20,
  offset = 0,
  folderId,
  type,
  platform,
}: {
  userId: string
  q: string
  mode?: string | null
  scope?: SearchScope
  limit?: number
  offset?: number
  folderId?: string
  type?: string
  platform?: string
}): Promise<{
  items: SearchResultItem[]
  modeUsed: SearchMode
  fallbackReason?: string
  total: number
  hasMore: boolean
}> {
  const query = q.trim()
  if (!query) {
    const modeUsed = parseSearchMode(mode, "hybrid")
    return { items: [], modeUsed, total: 0, hasMore: false }
  }

  const requestedMode = parseSearchMode(mode, "hybrid")
  const internalLimit = Math.max(limit + offset, limit, 20)
  const candidateLimit = Math.min(MAX_INTERNAL_CANDIDATES, internalLimit)

  let modeUsed = requestedMode
  let fallbackReason: string | undefined

  if (
    query.length < MIN_SEMANTIC_QUERY_LENGTH &&
    (requestedMode === "semantic" || requestedMode === "hybrid")
  ) {
    modeUsed = "keyword"
    fallbackReason = "query_too_short_for_semantic"
  }

  let hits: SearchHit[] = []

  if (modeUsed === "keyword") {
    hits = await keywordSearch({
      userId,
      q: query,
      folderId,
      type,
      platform,
      limit: candidateLimit,
    })
  }

  if (modeUsed === "semantic") {
    try {
      hits = await semanticSearch({
        userId,
        q: query,
        folderId,
        type,
        platform,
        limit: candidateLimit,
      })
    } catch {
      modeUsed = "keyword"
      fallbackReason = "semantic_failed_fallback_to_keyword"
      hits = await keywordSearch({
        userId,
        q: query,
        folderId,
        type,
        platform,
        limit: candidateLimit,
      })
    }
  }

  if (modeUsed === "hybrid") {
    try {
      const [keywordHits, semanticHits] = await Promise.all([
        keywordSearch({ userId, q: query, folderId, type, platform, limit: candidateLimit }),
        semanticSearch({ userId, q: query, folderId, type, platform, limit: candidateLimit }),
      ])
      hits = fuseRrf([keywordHits, semanticHits], candidateLimit)
    } catch {
      modeUsed = "keyword"
      fallbackReason = "semantic_failed_fallback_to_keyword"
      hits = await keywordSearch({
        userId,
        q: query,
        folderId,
        type,
        platform,
        limit: candidateLimit,
      })
    }
  }

  const total = hits.length
  const slicedHits = hits.slice(offset, offset + limit)
  const details = await getBookmarkDetailsByIds({
    bookmarkIds: slicedHits.map((hit) => hit.bookmarkId),
    userId,
  })

  const itemMap = new Map(details.map((item) => [item.id, item]))
  const items = slicedHits
    .map((hit) => {
      const detail = itemMap.get(hit.bookmarkId)
      if (!detail) {
        return null
      }
      return {
        ...detail,
        score: hit.score,
        matchReasons: hit.matchReasons,
      }
    })
    .filter((item): item is SearchResultItem => item !== null)

  return {
    items,
    modeUsed,
    fallbackReason,
    total,
    hasMore: offset + limit < total,
  }
}

async function keywordSearch({
  userId,
  q,
  folderId,
  type,
  platform,
  limit,
}: {
  userId: string
  q: string
  folderId?: string
  type?: string
  platform?: string
  limit: number
}): Promise<SearchHit[]> {
  const likePattern = `%${q}%`
  const queryLower = q.toLowerCase()

  const fieldConditions = or(
    ilike(bookmark.title, likePattern),
    ilike(bookmark.description, likePattern),
    ilike(bookmark.content, likePattern),
    ilike(bookmark.url, likePattern)
  )

  const baseConditions = buildBookmarkFilters({ userId, folderId, type, platform })

  const contentRows = await db
    .select({
      id: bookmark.id,
      title: bookmark.title,
      description: bookmark.description,
      content: bookmark.content,
      url: bookmark.url,
      createdAt: bookmark.createdAt,
    })
    .from(bookmark)
    .where(and(...baseConditions, fieldConditions!))
    .orderBy(desc(bookmark.createdAt))
    .limit(limit)

  const tagRows = await db
    .select({
      id: bookmark.id,
      tagName: tag.name,
      createdAt: bookmark.createdAt,
    })
    .from(bookmark)
    .innerJoin(bookmarkTag, eq(bookmark.id, bookmarkTag.bookmarkId))
    .innerJoin(tag, eq(bookmarkTag.tagId, tag.id))
    .where(and(...baseConditions, ilike(tag.name, likePattern)))
    .orderBy(desc(bookmark.createdAt))
    .limit(limit)

  const hitMap = new Map<
    string,
    { score: number; reasons: Set<SearchMatchReason>; createdAt: number }
  >()

  for (const row of contentRows) {
    const reasons = inferKeywordReasons(row, queryLower)
    if (reasons.length === 0) {
      continue
    }

    const score = computeKeywordScore(reasons)
    hitMap.set(row.id, {
      score,
      reasons: new Set<SearchMatchReason>(reasons),
      createdAt: row.createdAt.getTime(),
    })
  }

  for (const row of tagRows) {
    const prev = hitMap.get(row.id)
    if (prev) {
      prev.reasons.add("tag")
      prev.score = computeKeywordScore(Array.from(prev.reasons))
      continue
    }
    hitMap.set(row.id, {
      score: computeKeywordScore(["tag"]),
      reasons: new Set<SearchMatchReason>(["tag"]),
      createdAt: row.createdAt.getTime(),
    })
  }

  return Array.from(hitMap.entries())
    .sort((a, b) => {
      const scoreDiff = b[1].score - a[1].score
      if (scoreDiff !== 0) {
        return scoreDiff
      }
      return b[1].createdAt - a[1].createdAt
    })
    .slice(0, limit)
    .map(([bookmarkId, value]) => ({
      bookmarkId,
      score: value.score,
      matchReasons: Array.from(value.reasons),
    }))
}

async function semanticSearch({
  userId,
  q,
  folderId,
  type,
  platform,
  limit,
}: {
  userId: string
  q: string
  folderId?: string
  type?: string
  platform?: string
  limit: number
}): Promise<SearchHit[]> {
  const embeddingConfig = await getDefaultProvider(userId, "embedding")
  if (!embeddingConfig) {
    return []
  }
  const model = getEmbeddingModel(embeddingConfig)
  const queryEmbedding = await generateEmbedding(q, model)
  const similarity = sql<number>`1 - (${cosineDistance(embedding.embedding, queryEmbedding)})`
  const scoreExpr = sql<number>`max(${similarity})`

  const filters: SQL[] = [
    ...buildBookmarkFilters({ userId, folderId, type, platform }),
    gt(similarity, 0.3),
  ]

  const rows = await db
    .select({
      bookmarkId: embedding.bookmarkId,
      score: scoreExpr,
    })
    .from(embedding)
    .innerJoin(bookmark, eq(embedding.bookmarkId, bookmark.id))
    .where(and(...filters))
    .groupBy(embedding.bookmarkId)
    .orderBy(desc(scoreExpr))
    .limit(limit)

  return rows.map((row) => ({
    bookmarkId: row.bookmarkId,
    score: Number(row.score),
    matchReasons: ["semantic"],
  }))
}

function fuseRrf(hitLists: SearchHit[][], limit: number): SearchHit[] {
  const map = new Map<string, { score: number; reasons: Set<SearchMatchReason> }>()

  for (const hits of hitLists) {
    for (const [index, hit] of hits.entries()) {
      const rank = index + 1
      const rrfScore = 1 / (RRF_K + rank)
      const prev = map.get(hit.bookmarkId)
      if (prev) {
        prev.score += rrfScore
        for (const reason of hit.matchReasons) {
          prev.reasons.add(reason)
        }
        continue
      }
      map.set(hit.bookmarkId, {
        score: rrfScore,
        reasons: new Set<SearchMatchReason>(hit.matchReasons),
      })
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([bookmarkId, value]) => ({
      bookmarkId,
      score: value.score,
      matchReasons: Array.from(value.reasons),
    }))
}

function buildBookmarkFilters({
  userId,
  folderId,
  type,
  platform,
}: {
  userId: string
  folderId?: string
  type?: string
  platform?: string
}): SQL[] {
  const filters: SQL[] = [eq(bookmark.userId, userId), eq(bookmark.isArchived, false)]

  if (folderId) {
    filters.push(eq(bookmark.folderId, folderId))
  }

  if (type && type !== "all") {
    filters.push(eq(bookmark.type, type))
  }

  if (platform && platform !== "all") {
    filters.push(eq(bookmark.platform, platform))
  }

  return filters
}

async function getBookmarkDetailsByIds({
  bookmarkIds,
  userId,
}: {
  bookmarkIds: string[]
  userId: string
}): Promise<BookmarkLookupRow[]> {
  if (bookmarkIds.length === 0) {
    return []
  }

  const rows = await db
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
      platform: bookmark.platform,
    })
    .from(bookmark)
    .leftJoin(folder, eq(bookmark.folderId, folder.id))
    .where(
      and(
        eq(bookmark.userId, userId),
        eq(bookmark.isArchived, false),
        inArray(bookmark.id, bookmarkIds)
      )
    )

  return rows
}

function inferKeywordReasons(
  row: { title: string; description: string | null; content: string | null; url: string | null },
  queryLower: string
): SearchMatchReason[] {
  const reasons: SearchMatchReason[] = []

  if (row.title.toLowerCase().includes(queryLower)) {
    reasons.push("title")
  }
  if (row.description?.toLowerCase().includes(queryLower)) {
    reasons.push("description")
  }
  if (row.content?.toLowerCase().includes(queryLower)) {
    reasons.push("content")
  }
  if (row.url?.toLowerCase().includes(queryLower)) {
    reasons.push("url")
  }

  return reasons
}

function computeKeywordScore(reasons: SearchMatchReason[]): number {
  let score = 0

  if (reasons.includes("title")) {
    score += 5
  }
  if (reasons.includes("description")) {
    score += 3
  }
  if (reasons.includes("content")) {
    score += 2
  }
  if (reasons.includes("url")) {
    score += 1
  }
  if (reasons.includes("tag")) {
    score += 4
  }

  return score
}
