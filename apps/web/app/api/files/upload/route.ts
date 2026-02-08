import { put } from "@vercel/blob"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!request.body) {
    return NextResponse.json({ error: "Request body is empty" }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as Blob | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size should be less than 5MB" }, { status: 400 })
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type should be JPEG, PNG, WebP or GIF" },
        { status: 400 }
      )
    }

    const filename = (formData.get("file") as File).name
    const fileBuffer = await file.arrayBuffer()

    const data = await put(filename, fileBuffer, {
      access: "public",
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
