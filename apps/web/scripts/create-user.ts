import "dotenv/config"
import { hashPassword } from "better-auth/crypto"
import { nanoid } from "nanoid"
import { db } from "../db/client"
import { account, user } from "../db/schema/auth"

async function createUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || "Admin"

  if (!(email && password)) {
    console.error("Usage: pnpm tsx scripts/create-user.ts <email> <password> [name]")
    process.exit(1)
  }

  const userId = nanoid()
  const accountId = nanoid()

  try {
    // 创建用户
    await db.insert(user).values({
      id: userId,
      email,
      name,
      emailVerified: true,
    })

    // 创建账户（存储密码）
    const hashedPassword = await hashPassword(password)
    await db.insert(account).values({
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    })

    console.log(`✅ 用户创建成功: ${email}`)
  } catch (error) {
    console.error("❌ 创建用户失败:", error)
    process.exit(1)
  }
}

createUser()
