import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

// MinIO 配置
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "http://localhost:9000"
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY
const MINIO_BUCKET = process.env.MINIO_BUCKET || "mindpocket"
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || MINIO_ENDPOINT

// 启动时校验必要凭证
if (!(MINIO_ACCESS_KEY && MINIO_SECRET_KEY)) {
  throw new Error(
    "MINIO_ACCESS_KEY and MINIO_SECRET_KEY are required. " +
      "Set them in your environment variables or .env file."
  )
}

// 解析 endpoint URL
const endpointUrl = new URL(MINIO_ENDPOINT)

const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: "us-east-1", // MinIO 默认 region
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // MinIO 需要 path style
  tls: endpointUrl.protocol === "https:",
})

// Bucket 初始化状态
let bucketEnsured = false

// 去除末尾斜杠
const TRAILING_SLASH = /\/$/

/** 根据文件扩展名推断 Content-Type */
function getContentType(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase() ?? ""
  const mimeMap: Record<string, string> = {
    // 图片
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    // 文档
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // 文本
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    html: "text/html",
    css: "text/css",
    js: "text/javascript",
    json: "application/json",
    xml: "application/xml",
    // 压缩
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
  }
  return mimeMap[ext] || "application/octet-stream"
}

/** 确保 bucket 存在且设置公开读策略（仅首次调用时检查） */
async function ensureBucket(): Promise<void> {
  if (bucketEnsured) {
    return
  }
  let created = false
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }))
  } catch (e: unknown) {
    // 并发请求可能同时触发 CreateBucket，忽略已存在的错误
    if (
      typeof e === "object" &&
      e !== null &&
      "name" in e &&
      (e as { name: string }).name === "BucketAlreadyOwnedByYou"
    ) {
      bucketEnsured = true
      return
    }
    await s3Client.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }))
    created = true
  }
  // 新建 bucket 时设置公开读策略（等同 mc anonymous set download）
  if (created) {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: MINIO_BUCKET,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
            },
          ],
        }),
      })
    )
  }
  bucketEnsured = true
}

interface PutResult {
  url: string
  pathname: string
}

/**
 * 上传文件到 MinIO，返回公开访问 URL
 */
export async function put(
  pathname: string,
  body: ArrayBuffer | Buffer | string,
  _options?: { access?: "public" | "private" }
): Promise<PutResult> {
  await ensureBucket()

  const buffer = body instanceof ArrayBuffer ? Buffer.from(body) : Buffer.from(body)

  await s3Client.send(
    new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: pathname,
      Body: buffer,
      ContentType: getContentType(pathname),
    })
  )

  // 构造公开访问 URL
  const publicBase = MINIO_PUBLIC_URL.replace(TRAILING_SLASH, "")
  const url = `${publicBase}/${MINIO_BUCKET}/${pathname}`

  return { url, pathname }
}
