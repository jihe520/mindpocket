import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getBookmarksByUserId } from "@/db/queries/bookmark"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || undefined
  const folderId = searchParams.get("folderId") || undefined
  const search = searchParams.get("search") || undefined
  const limit = Number(searchParams.get("limit")) || 20
  const offset = Number(searchParams.get("offset")) || 0

  const result = await getBookmarksByUserId({
    userId: session.user.id,
    type,
    folderId,
    search,
    limit,
    offset,
  })

  return Response.json(result)
}
