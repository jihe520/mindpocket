import { type NextRequest, NextResponse } from "next/server"

const publicRoutes = ["/login", "/api/auth"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 允许公开路由
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // 检查 session cookie
  const sessionToken = request.cookies.get("better-auth.session_token")

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
