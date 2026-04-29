import { z } from "zod"
import { deleteProvider, updateProvider } from "@/db/queries/ai-provider"
import { requireApiSession } from "@/lib/api-auth"

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }
  const userId = result.session.user.id

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await updateProvider(id, userId, parsed.data)
  return Response.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireApiSession()
  if (!result.ok) {
    return result.response
  }
  const userId = result.session.user.id

  const { id } = await params
  await deleteProvider(id, userId)
  return Response.json({ ok: true })
}
