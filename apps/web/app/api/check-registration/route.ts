import { count } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/db/client"
import { user } from "@/db/schema/auth"

// This route depends on live database state and must run at request time.
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const result = await db.select({ count: count() }).from(user)
    const userCount = result[0]?.count || 0

    return NextResponse.json({
      allowed: userCount === 0,
      message: userCount > 0 ? "注册已关闭，系统仅允许一个用户" : null,
    })
  } catch (error) {
    console.error("Error checking registration status:", error)
    return NextResponse.json({ allowed: false, message: "检查注册状态失败" }, { status: 500 })
  }
}
