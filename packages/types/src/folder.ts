/**
 * Folder type definitions
 */

import type { BookmarkItemInFolder } from "./bookmark"

/**
 * Folder item interface
 */
export interface FolderItem {
  id: string
  name: string
  description?: string | null
  emoji: string
  sortOrder: number
  items: BookmarkItemInFolder[]
}