import { Client } from "pg"
import { getDatabaseUrl } from "../lib/database-url"

async function main() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
  })

  try {
    await client.connect()
    await client.query("CREATE EXTENSION IF NOT EXISTS vector")
    console.log("[ensure-extensions] pgvector extension ready")
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error("[ensure-extensions] Failed to ensure pgvector extension")
  console.error(error)
  process.exit(1)
})
