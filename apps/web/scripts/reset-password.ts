import { hashPassword } from "better-auth/crypto"
import { and, eq } from "drizzle-orm"

async function resetPassword() {
  const email = process.argv[2]
  const newPassword = process.argv[3]

  if (!(email && newPassword)) {
    console.error("Usage: pnpm tsx scripts/reset-password.ts <email> <new-password>")
    process.exit(1)
  }

  try {
    const { db } = await import("../db/client")
    const { account, user } = await import("../db/schema/auth")

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: {
        id: true,
        email: true,
      },
    })

    if (!existingUser) {
      console.error(`❌ 未找到用户: ${email}`)
      process.exit(1)
    }

    const credentialAccount = await db.query.account.findFirst({
      where: and(eq(account.userId, existingUser.id), eq(account.providerId, "credential")),
      columns: {
        id: true,
      },
    })

    if (!credentialAccount) {
      console.error(`❌ 用户 ${email} 没有可重置的邮箱密码账户（providerId=credential）`)
      process.exit(1)
    }

    const hashedPassword = await hashPassword(newPassword)

    await db
      .update(account)
      .set({
        password: hashedPassword,
      })
      .where(eq(account.id, credentialAccount.id))

    console.log(`✅ 密码已重置: ${email}`)
  } catch (error) {
    console.error("❌ 重置密码失败:", error)
    process.exit(1)
  }
}

resetPassword()
