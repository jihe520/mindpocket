import { getChatsByUserId } from "@/db/queries/chat"
import { requireApiSession } from "@/lib/api-auth"
import { corsPreflight, withCors } from "@/lib/cors"

export const dynamic = "force-dynamic"

export function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function GET(req: Request) {
  const authResult = await requireApiSession()
  if (!authResult.ok) {
    return withCors(req, authResult.response)
  }
  const userId = authResult.session.user.id

  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get("limit") || "20")
  const endingBefore = searchParams.get("ending_before") || undefined

  const chats = await getChatsByUserId({
    id: userId,
    limit,
    endingBefore,
  })

  const hasMore = chats.length > limit
  const result = hasMore ? chats.slice(0, limit) : chats

  return withCors(req, Response.json({ chats: result, hasMore }))
}
