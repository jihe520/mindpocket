import { z } from "zod"
import { createProvider, getProvidersByUserId } from "@/db/queries/ai-provider"
import { requireApiSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["chat", "embedding"]),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  modelId: z.string().min(1),
  isDefault: z.boolean().optional(),
})

export async function GET() {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }
  const userId = result.session.user.id

  const providers = await getProvidersByUserId(userId)
  return Response.json(providers)
}

export async function POST(req: Request) {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }
  const userId = result.session.user.id

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { id } = await createProvider({
    userId,
    ...parsed.data,
  })

  return Response.json({ id }, { status: 201 })
}
