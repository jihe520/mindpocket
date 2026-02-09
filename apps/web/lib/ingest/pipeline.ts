import { put } from "@vercel/blob"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "@/db/client"
import { bookmark } from "@/db/schema/bookmark"
import { embedding as embeddingTable } from "@/db/schema/embedding"
import { generateEmbeddings } from "@/lib/ai/embedding"
import {
  convertBuffer,
  convertUrl,
  extractDescription,
  inferTypeFromExtension,
  inferTypeFromUrl,
} from "./converter"
import { convertWithPlatform } from "./platforms"
import type { IngestResult, IngestStatus } from "./types"
import { inferPlatform } from "./types"

const FILE_EXT_REGEX = /\.[^.]+$/

interface IngestUrlParams {
  userId: string
  url: string
  folderId?: string
  title?: string
}

interface IngestFileParams {
  userId: string
  file: File
  folderId?: string
  title?: string
}

interface IngestExtensionParams {
  userId: string
  url: string
  html: string
  folderId?: string
  title?: string
}

function sanitizeForDb(str: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: need to strip NULL bytes for PostgreSQL UTF-8 compatibility
  return str.replace(/\x00/g, "").slice(0, 1000)
}

async function updateBookmarkStatus(bookmarkId: string, status: IngestStatus, error?: string) {
  await db
    .update(bookmark)
    .set({ ingestStatus: status, ingestError: error ? sanitizeForDb(error) : null })
    .where(eq(bookmark.id, bookmarkId))
}

async function generateAndStoreEmbeddings(bookmarkId: string, content: string) {
  await db.delete(embeddingTable).where(eq(embeddingTable.bookmarkId, bookmarkId))
  const embeddings = await generateEmbeddings(bookmarkId, content)
  if (embeddings.length > 0) {
    await db.insert(embeddingTable).values(embeddings)
  }
}

export async function ingestFromUrl(params: IngestUrlParams): Promise<IngestResult> {
  const { userId, url, folderId, title: userTitle } = params
  const bookmarkId = nanoid()
  const type = inferTypeFromUrl(url)

  await db.insert(bookmark).values({
    id: bookmarkId,
    userId,
    folderId: folderId ?? null,
    type,
    title: userTitle || url,
    url,
    sourceType: "url",
    platform: inferPlatform(url),
    ingestStatus: "pending" as IngestStatus,
  })

  // 触发后台处理，不 await
  processIngestUrl(bookmarkId, url, userTitle).catch(console.error)

  return { bookmarkId, title: userTitle || url, markdown: null, type, status: "pending" }
}

async function processIngestUrl(bookmarkId: string, url: string, userTitle?: string) {
  await updateBookmarkStatus(bookmarkId, "processing")
  try {
    const result = await convertUrl(url)

    if (!result?.markdown) {
      await updateBookmarkStatus(bookmarkId, "failed", "Conversion returned empty result")
      return
    }

    const finalTitle = userTitle || result.title || url
    const description = extractDescription(result.markdown)

    await db
      .update(bookmark)
      .set({ title: finalTitle, description, content: result.markdown, ingestStatus: "completed" })
      .where(eq(bookmark.id, bookmarkId))

    generateAndStoreEmbeddings(bookmarkId, result.markdown).catch(console.error)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    await updateBookmarkStatus(bookmarkId, "failed", errMsg)
  }
}

export async function ingestFromFile(params: IngestFileParams): Promise<IngestResult> {
  const { userId, file, folderId, title: userTitle } = params
  const bookmarkId = nanoid()
  const fileName = file.name
  const extMatch = fileName.match(FILE_EXT_REGEX)
  const fileExtension = extMatch ? extMatch[0].toLowerCase() : ""
  const type = inferTypeFromExtension(fileExtension)

  await db.insert(bookmark).values({
    id: bookmarkId,
    userId,
    folderId: folderId ?? null,
    type,
    title: userTitle || fileName,
    sourceType: "file",
    fileExtension,
    fileSize: file.size,
    ingestStatus: "pending" as IngestStatus,
  })

  // 先读取 file 到 buffer 并上传 blob（需要在请求生命周期内完成）
  const fileBuffer = await file.arrayBuffer()
  const blobResult = await put(`ingest/${bookmarkId}/${fileName}`, fileBuffer, {
    access: "public",
  })

  await db
    .update(bookmark)
    .set({ fileUrl: blobResult.url, url: blobResult.url })
    .where(eq(bookmark.id, bookmarkId))

  // 触发后台处理，不 await
  const buffer = Buffer.from(fileBuffer)
  processIngestFile(bookmarkId, buffer, fileExtension, userTitle, fileName).catch(console.error)

  return { bookmarkId, title: userTitle || fileName, markdown: null, type, status: "pending" }
}

async function processIngestFile(
  bookmarkId: string,
  buffer: Buffer,
  fileExtension: string,
  userTitle?: string,
  fileName?: string
) {
  await updateBookmarkStatus(bookmarkId, "processing")
  try {
    const result = await convertBuffer(buffer, fileExtension)

    if (!result?.markdown) {
      await updateBookmarkStatus(bookmarkId, "failed", "Conversion returned empty result")
      return
    }

    const finalTitle = userTitle || result.title || fileName || "Untitled"
    const description = extractDescription(result.markdown)

    await db
      .update(bookmark)
      .set({ title: finalTitle, description, content: result.markdown, ingestStatus: "completed" })
      .where(eq(bookmark.id, bookmarkId))

    generateAndStoreEmbeddings(bookmarkId, result.markdown).catch(console.error)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    await updateBookmarkStatus(bookmarkId, "failed", errMsg)
  }
}

export async function ingestFromExtension(params: IngestExtensionParams): Promise<IngestResult> {
  const { userId, url, html, folderId, title: userTitle } = params
  const bookmarkId = nanoid()
  const platform = inferPlatform(url)

  await db.insert(bookmark).values({
    id: bookmarkId,
    userId,
    folderId: folderId ?? null,
    type: "article",
    title: userTitle || url,
    url,
    sourceType: "extension",
    platform,
    ingestStatus: "pending" as IngestStatus,
  })

  // 触发后台处理，不 await
  processIngestExtension(bookmarkId, html, url, platform, userTitle).catch(console.error)

  return { bookmarkId, title: userTitle || url, markdown: null, type: "article", status: "pending" }
}

async function processIngestExtension(
  bookmarkId: string,
  html: string,
  url: string,
  platform: string | null,
  userTitle?: string
) {
  await updateBookmarkStatus(bookmarkId, "processing")
  try {
    const result = await convertWithPlatform(html, url, platform)

    if (!result?.markdown) {
      await updateBookmarkStatus(bookmarkId, "failed", "HTML conversion returned empty result")
      return
    }

    const finalTitle = userTitle || result.title || url
    const description = extractDescription(result.markdown)

    await db
      .update(bookmark)
      .set({ title: finalTitle, description, content: result.markdown, ingestStatus: "completed" })
      .where(eq(bookmark.id, bookmarkId))

    generateAndStoreEmbeddings(bookmarkId, result.markdown).catch(console.error)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    await updateBookmarkStatus(bookmarkId, "failed", errMsg)
  }
}
