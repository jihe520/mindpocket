import { index, pgTable, text, vector } from "drizzle-orm/pg-core"
import { bookmark } from "./bookmark"

export const embedding = pgTable(
  "embedding",
  {
    id: text("id").primaryKey(),
    bookmarkId: text("bookmark_id")
      .notNull()
      .references(() => bookmark.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }).notNull(),
  },
  (table) => [
    index("embedding_bookmarkId_idx").on(table.bookmarkId),
    index("embeddingIndex").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
)
