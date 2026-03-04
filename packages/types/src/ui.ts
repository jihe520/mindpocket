/**
 * UI type definitions
 */

import type { SearchMode } from "./search"

/**
 * View mode for bookmark display
 */
export type ViewMode = "grid" | "list"

/**
 * Search dialog state
 */
export interface SearchDialogState {
  open: boolean
  mode: SearchMode
}