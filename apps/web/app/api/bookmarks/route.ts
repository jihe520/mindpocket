import { parseSearchMode, parseSearchScope } from "@repo/types"
import { headers } from "next/headers"
import { getBookmarksByUserId } from "@/db/queries/bookmark"
import { searchBookmarks } from "@/db/queries/search"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || undefined
  const platform = searchParams.get("platform") || undefined
  const folderId = searchParams.get("folderId") || undefined
  const search = searchParams.get("search") || undefined
  const searchMode = parseSearchMode(searchParams.get("searchMode"), "keyword")
  const searchScope = parseSearchScope(searchParams.get("searchScope"))
  const limit = Number(searchParams.get("limit")) || 20
  const offset = Number(searchParams.get("offset")) || 0

  if (search) {
    const result = await searchBookmarks({
      userId: session.user.id,
      q: search,
      mode: searchMode,
      scope: searchScope,
      folderId,
      type,
      platform,
      limit,
      offset,
    })

    return Response.json({
      bookmarks: result.items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        url: item.url,
        coverImage: item.coverImage,
        isFavorite: item.isFavorite,
        createdAt: item.createdAt,
        folderId: item.folderId,
        folderName: item.folderName,
        folderEmoji: item.folderEmoji,
        platform: item.platform,
      })),
      total: result.total,
      hasMore: result.hasMore,
      modeUsed: result.modeUsed,
      fallbackReason: result.fallbackReason,
    })
  }

  const result = await getBookmarksByUserId({
    userId: session.user.id,
    type,
    platform,
    folderId,
    search,
    limit,
    offset,
  })

  return Response.json(result)
}
