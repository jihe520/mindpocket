import { DefaultChatTransport } from "ai"
import { fetch as expoFetch } from "expo/fetch"
import { getItem } from "expo-secure-store"

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"

function getCookie(): string {
  const raw = getItem("mindpocket_cookie") || "{}"
  let parsed: Record<string, { value: string; expires: string | null }> = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    return ""
  }
  return Object.entries(parsed)
    .filter(([, v]) => !v.expires || new Date(v.expires) > new Date())
    .map(([key, v]) => `${key}=${v.value}`)
    .join("; ")
}

export function createChatTransport() {
  return new DefaultChatTransport({
    api: `${API_URL}/api/chat`,
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    headers: () => {
      const cookie = getCookie()
      return cookie ? { cookie } : {}
    },
  })
}
