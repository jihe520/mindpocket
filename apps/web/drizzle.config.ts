import { defineConfig } from "drizzle-kit"
import { getDatabaseUrl } from "./lib/database-url"

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
})
