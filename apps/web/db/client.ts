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

const sql = neon(process.env.DATABASE_URL!)

const schema = {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
}

export const db = drizzle(sql, { schema })
