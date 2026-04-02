import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { getDatabaseUrl } from "../lib/database-url"
import { userAiProvider, userAiProviderRelations } from "./schema/ai-provider"
import {
  account,
  accountRelations,
  deviceCode,
  deviceCodeRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./schema/auth"
import { bookmark, bookmarkRelations } from "./schema/bookmark"
import { chat, chatRelations, message, messageRelations } from "./schema/chat"
import { embedding } from "./schema/embedding"
import { folder, folderRelations } from "./schema/folder"
import { bookmarkTag, bookmarkTagRelations, tag, tagRelations } from "./schema/tag"

const schema = {
  user,
  session,
  account,
  verification,
  deviceCode,
  userRelations,
  sessionRelations,
  accountRelations,
  deviceCodeRelations,
  folder,
  folderRelations,
  bookmark,
  bookmarkRelations,
  tag,
  bookmarkTag,
  tagRelations,
  bookmarkTagRelations,
  chat,
  chatRelations,
  message,
  messageRelations,
  embedding,
  userAiProvider,
  userAiProviderRelations,
}

declare global {
  // eslint-disable-next-line no-var
  var __mindpocketDbPool: Pool | undefined
  // eslint-disable-next-line no-var
  var __mindpocketDbInstance: Database | undefined
}

function getConnectionString() {
  return getDatabaseUrl()
}

function createPool() {
  return new Pool({ connectionString: getConnectionString() })
}

function getPool() {
  if (process.env.NODE_ENV === "production") {
    return createPool()
  }

  if (!globalThis.__mindpocketDbPool) {
    globalThis.__mindpocketDbPool = createPool()
  }

  return globalThis.__mindpocketDbPool
}

function createDb() {
  return drizzle(getPool(), { schema })
}

type Database = ReturnType<typeof createDb>

function getDb() {
  if (process.env.NODE_ENV === "production") {
    return createDb()
  }

  if (!globalThis.__mindpocketDbInstance) {
    globalThis.__mindpocketDbInstance = createDb()
  }

  return globalThis.__mindpocketDbInstance
}

// Delay pool creation until the database is actually used at runtime.
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const database = getDb()
    const value = Reflect.get(database as object, prop, receiver)
    return typeof value === "function" ? value.bind(database) : value
  },
  has(_target, prop) {
    return prop in getDb()
  },
  ownKeys() {
    return Reflect.ownKeys(getDb() as object)
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getDb() as object, prop)
  },
})
