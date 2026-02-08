import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import {
  account,
  accountRelations,
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

const sql = neon(process.env.DATABASE_URL!)

const schema = {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
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
}

export const db = drizzle(sql, { schema })
