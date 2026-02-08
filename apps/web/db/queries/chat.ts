import { and, asc, desc, eq, lt } from "drizzle-orm"
import { db } from "@/db/client"
import { chat, message } from "@/db/schema"

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string
  userId: string
  title: string
}) {
  await db.insert(chat).values({ id, userId, title })
}

export async function getChatById({ id }: { id: string }) {
  const result = await db.select().from(chat).where(eq(chat.id, id))
  return result[0] ?? null
}

export async function getChatsByUserId({
  id,
  limit = 20,
  endingBefore,
}: {
  id: string
  limit?: number
  endingBefore?: string
}) {
  const conditions = [eq(chat.userId, id)]

  if (endingBefore) {
    const cursor = await getChatById({ id: endingBefore })
    if (cursor) {
      conditions.push(lt(chat.createdAt, cursor.createdAt))
    }
  }

  return db
    .select()
    .from(chat)
    .where(and(...conditions))
    .orderBy(desc(chat.createdAt))
    .limit(limit + 1)
}

export async function deleteChatById({ id }: { id: string }) {
  await db.delete(chat).where(eq(chat.id, id))
}

export async function updateChatTitle({ chatId, title }: { chatId: string; title: string }) {
  await db.update(chat).set({ title }).where(eq(chat.id, chatId))
}

export async function createStreamId({ streamId, chatId }: { streamId: string; chatId: string }) {
  await db.update(chat).set({ activeStreamId: streamId }).where(eq(chat.id, chatId))
}

export async function getActiveStreamId({ chatId }: { chatId: string }) {
  const result = await db
    .select({ activeStreamId: chat.activeStreamId })
    .from(chat)
    .where(eq(chat.id, chatId))
  return result[0]?.activeStreamId ?? null
}

export async function clearActiveStreamId({ chatId }: { chatId: string }) {
  await db.update(chat).set({ activeStreamId: null }).where(eq(chat.id, chatId))
}

export async function saveMessages({
  messages,
}: {
  messages: Array<{
    id: string
    chatId: string
    role: string
    parts: unknown
    attachments?: unknown
    createdAt: Date
  }>
}) {
  await db.insert(message).values(messages)
}

export function getMessagesByChatId({ id }: { id: string }) {
  return db.select().from(message).where(eq(message.chatId, id)).orderBy(asc(message.createdAt))
}
