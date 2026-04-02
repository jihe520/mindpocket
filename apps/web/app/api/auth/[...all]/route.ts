// 认证 API，统一处理登录、注册、登出等认证请求
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"
import { corsPreflight, withCors } from "@/lib/cors"

export const dynamic = "force-dynamic"

const authHandler = toNextJsHandler(auth)

export function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function GET(req: Request) {
  const response = await authHandler.GET(req)
  return withCors(req, response)
}

export async function POST(req: Request) {
  const response = await authHandler.POST(req)
  return withCors(req, response)
}
