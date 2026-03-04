/**
 * Chat type definitions
 */

import type { BookmarkItemInFolder } from "./bookmark"

/**
 * Chat item interface
 */
export interface ChatItem {
  id: string
  title: string
  createdAt: string
}

/**
 * Chat message role
 */
export type MessageRole = "user" | "assistant" | "system"

/**
 * Message part types
 */
export type MessagePart =
  | { type: "text"; text: string }
  | { type: "image"; image: string }

/**
 * Message attachment
 */
export interface MessageAttachment {
  type: "bookmark"
  bookmarkId: string
  bookmark?: BookmarkItemInFolder
}

/**
 * Message interface
 */
export interface MessageItem {
  id: string
  chatId: string
  role: MessageRole
  parts: MessagePart[]
  attachments: MessageAttachment[]
  createdAt: string
}

/**
 * Chat detail with messages
 */
export interface ChatDetail extends ChatItem {
  messages: MessageItem[]
}