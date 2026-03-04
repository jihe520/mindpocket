import type { BilibiliCredentials } from "@repo/types"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { decrypt, encrypt } from "@/lib/crypto"
import { db } from "../client"
import { bilibiliCredentials } from "../schema"

export async function getBilibiliCredentials(userId: string): Promise<BilibiliCredentials | null> {
  const result = await db
    .select()
    .from(bilibiliCredentials)
    .where(eq(bilibiliCredentials.userId, userId))
    .limit(1)

  if (result.length === 0) {
    return null
  }

  const cred = result[0]
  return {
    sessdata: decrypt(cred.sessdata),
    biliJct: decrypt(cred.biliJct),
    buvid3: cred.buvid3,
  }
}

export async function saveBilibiliCredentials(
  userId: string,
  credentials: BilibiliCredentials
): Promise<void> {
  const existing = await db
    .select()
    .from(bilibiliCredentials)
    .where(eq(bilibiliCredentials.userId, userId))
    .limit(1)

  const encryptedData = {
    userId,
    sessdata: encrypt(credentials.sessdata),
    biliJct: encrypt(credentials.biliJct),
    buvid3: credentials.buvid3,
  }

  if (existing.length > 0) {
    await db
      .update(bilibiliCredentials)
      .set({
        ...encryptedData,
        updatedAt: new Date(),
      })
      .where(eq(bilibiliCredentials.userId, userId))
  } else {
    await db.insert(bilibiliCredentials).values({
      id: nanoid(),
      ...encryptedData,
    })
  }
}

export async function deleteBilibiliCredentials(userId: string): Promise<void> {
  await db.delete(bilibiliCredentials).where(eq(bilibiliCredentials.userId, userId))
}

export async function hasBilibiliCredentials(userId: string): Promise<boolean> {
  const result = await db
    .select({ id: bilibiliCredentials.id })
    .from(bilibiliCredentials)
    .where(eq(bilibiliCredentials.userId, userId))
    .limit(1)

  return result.length > 0
}
