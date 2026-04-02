const DEFAULT_DOCKER_DB_HOST = "host.docker.internal"

function buildDatabaseUrlFromParts() {
  const port = process.env.DB_PORT
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const database = process.env.DB_NAME

  if (!(port && user && password && database)) {
    return null
  }

  const url = new URL("postgresql://localhost")
  url.username = user
  url.password = password
  url.hostname = process.env.DB_HOST || DEFAULT_DOCKER_DB_HOST
  url.port = port
  url.pathname = `/${database}`

  if (process.env.DB_SSLMODE) {
    url.searchParams.set("sslmode", process.env.DB_SSLMODE)
  }

  return url.toString()
}

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || buildDatabaseUrlFromParts()

  if (!databaseUrl) {
    throw new Error(
      "Database connection is missing. Provide DATABASE_URL directly, or set DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, and optional DB_HOST/DB_SSLMODE. DB_HOST defaults to host.docker.internal."
    )
  }

  return databaseUrl
}

export { DEFAULT_DOCKER_DB_HOST }
