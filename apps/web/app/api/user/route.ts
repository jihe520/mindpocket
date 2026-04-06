import { requireApiSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }

  const { session } = result

  return Response.json({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image || "",
  })
}
