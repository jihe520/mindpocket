const DEFAULT_APP_URL = "http://127.0.0.1:3000"

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

const appBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL)

export const appLinks = {
  login: `${appBaseUrl}/login`,
  signup: `${appBaseUrl}/signup`,
}
