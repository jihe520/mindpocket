import { relations } from "drizzle-orm"
import { index, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"
import { user } from "./auth"

export const chat = pgTable(
  "chat",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    activeStreamId: text("active_stream_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("chat_userId_idx").on(table.userId)]
)

export const message = pgTable(
  "message",
  {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull(),
    parts: json("parts").notNull(),
    attachments: json("attachments").notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("message_chatId_idx").on(table.chatId)]
)

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}))
