import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { cosineDistance, desc, gt, sql } from "drizzle-orm"
import { embed, embedMany } from "ai"
import { nanoid } from "nanoid"
import { db } from "@/db/client"
import { embedding } from "@/db/schema/embedding"

const aliyun = createOpenAICompatible({
  name: "aliyun",
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
})

const embeddingModel = aliyun.embeddingModel("text-embedding-v4")

export function generateChunks(input: string): string[] {
  return input
    .trim()
    .split(/[。.!\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export async function generateEmbedding(value: string): Promise<number[]> {
  const { embedding: vector } = await embed({
    model: embeddingModel,
    value,
  })
  return vector
}

export async function generateEmbeddings(
  bookmarkId: string,
  content: string
): Promise<Array<{ id: string; bookmarkId: string; content: string; embedding: number[] }>> {
  const chunks = generateChunks(content)
  if (chunks.length === 0) return []

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  })

  return embeddings.map((vector, i) => ({
    id: nanoid(),
    bookmarkId,
    content: chunks[i]!,
    embedding: vector,
  }))
}

export async function findRelevantContent(userQuery: string) {
  const userQueryEmbedded = await generateEmbedding(userQuery)

  const similarity = sql<number>`1 - (${cosineDistance(embedding.embedding, userQueryEmbedded)})`

  const results = await db
    .select({
      content: embedding.content,
      bookmarkId: embedding.bookmarkId,
      similarity,
    })
    .from(embedding)
    .where(gt(similarity, 0.3))
    .orderBy((t) => desc(t.similarity))
    .limit(6)

  return results
}
