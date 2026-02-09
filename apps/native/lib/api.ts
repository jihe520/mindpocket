import { authClient } from "./auth-client"

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"

export async function saveBookmark(url: string, title?: string) {
  const response = await authClient.$fetch(`${API_URL}/api/ingest`, {
    method: "POST",
    body: { url, title },
  })
  return response.data
}
