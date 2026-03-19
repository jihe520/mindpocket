// 数据摄入 API，支持 URL、扩展程序和文件上传三种导入方式
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { resolveFolderForIngest } from "@/lib/ingest/auto-folder"
import { ingestFromExtension, ingestFromFile, ingestFromUrl } from "@/lib/ingest/pipeline"
import type { ClientSource } from "@/lib/ingest/types"
import {
  ALLOWED_INGEST_FILE_EXTENSIONS,
  CLIENT_SOURCES,
  ingestExtensionSchema,
  ingestUrlSchema,
} from "@/lib/ingest/types"

const MAX_FILE_SIZE = 50 * 1024 * 1024
const FILE_EXT_REGEX = /\.[^.]+$/

function invalidRequest(details: unknown) {
  return NextResponse.json({ error: "Invalid request", details }, { status: 400 })
}

function getFileExtension(fileName: string) {
  return fileName.match(FILE_EXT_REGEX)?.[0]?.toLowerCase() ?? ""
}

function isClientSource(value: string | null): value is ClientSource {
  return value !== null && CLIENT_SOURCES.some((source) => source === value)
}

function resolveFolderIdOrAuto(params: {
  userId: string
  folderId?: string | null
  sourceType: "url" | "file" | "extension"
  url?: string
  title?: string
  fileName?: string
}) {
  const { folderId, ...rest } = params
  if (folderId) {
    return folderId
  }

  return resolveFolderForIngest(rest)
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user!.id

  const contentType = request.headers.get("content-type") ?? ""

  try {
    if (contentType.includes("multipart/form-data")) {
      return await handleFileUpload(request, userId)
    }

    return await handleJsonIngest(request, userId)
  } catch (error) {
    console.error("[ingest] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleJsonIngest(request: Request, userId: string) {
  const body = await request.json()
  console.log("[ingest] request", {
    clientSource: body?.clientSource,
    hasHtml: typeof body?.html === "string" && body.html.length > 0,
    url: body?.url,
  })

  const isExtensionClient = body?.clientSource === "extension"
  if (isExtensionClient || body.html) {
    const parsed = ingestExtensionSchema.safeParse(body)
    if (!parsed.success) {
      return invalidRequest(parsed.error.flatten())
    }

    const resolvedFolderId = await resolveFolderIdOrAuto({
      userId,
      folderId: parsed.data.folderId,
      sourceType: "extension",
      url: parsed.data.url,
      title: parsed.data.title,
    })

    const result = await ingestFromExtension({
      userId,
      url: parsed.data.url,
      html: parsed.data.html,
      folderId: resolvedFolderId ?? undefined,
      title: parsed.data.title,
      clientSource: parsed.data.clientSource,
    })
    return NextResponse.json(result, { status: 201 })
  }

  const parsed = ingestUrlSchema.safeParse(body)
  if (!parsed.success) {
    return invalidRequest(parsed.error.flatten())
  }

  const resolvedFolderId = await resolveFolderIdOrAuto({
    userId,
    folderId: parsed.data.folderId,
    sourceType: "url",
    url: parsed.data.url,
    title: parsed.data.title,
  })

  const result = await ingestFromUrl({
    userId,
    url: parsed.data.url,
    folderId: resolvedFolderId ?? undefined,
    title: parsed.data.title,
    clientSource: parsed.data.clientSource,
  })
  return NextResponse.json(result, { status: 201 })
}

async function handleFileUpload(request: Request, userId: string) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const rawFolderId = formData.get("folderId")
  const folderId =
    typeof rawFolderId === "string" && rawFolderId.trim().length > 0 ? rawFolderId.trim() : null
  const title = formData.get("title") as string | null
  const clientSource = formData.get("clientSource") as string | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!isClientSource(clientSource)) {
    return NextResponse.json({ error: "Invalid or missing clientSource" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 })
  }

  const ext = getFileExtension(file.name)
  if (!ALLOWED_INGEST_FILE_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: `Unsupported file type: ${ext}` }, { status: 400 })
  }

  const resolvedFolderId = await resolveFolderIdOrAuto({
    userId,
    folderId,
    sourceType: "file",
    title: title ?? undefined,
    fileName: file.name,
  })

  const result = await ingestFromFile({
    userId,
    file,
    folderId: resolvedFolderId ?? undefined,
    title: title ?? undefined,
    clientSource,
  })

  return NextResponse.json(result, { status: 201 })
}
