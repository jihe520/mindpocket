/**
 * UI store - manages UI state (search dialog, view mode, sidebar)
 * Partial persistence (viewMode, sidebarExpanded)
 */

import {
  parseSearchMode,
  type SearchDialogState,
  type SearchMode,
  type ViewMode,
} from "@repo/types"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { createPersistConfig } from "./middleware/persist-config"

interface UIState {
  // Search dialog
  searchDialog: SearchDialogState

  // View preferences
  bookmarkViewMode: ViewMode
  showAllChats: boolean

  // Actions
  openSearchDialog: () => void
  closeSearchDialog: () => void
  setSearchMode: (mode: SearchMode) => void
  setBookmarkViewMode: (mode: ViewMode) => void
  setShowAllChats: (show: boolean) => void
}

const initialState = {
  searchDialog: {
    open: false,
    mode: "hybrid" as SearchMode,
  },
  bookmarkViewMode: "grid" as ViewMode,
  showAllChats: false,
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        openSearchDialog: () =>
          set((state) => ({
            searchDialog: { ...state.searchDialog, open: true },
          })),

        closeSearchDialog: () =>
          set((state) => ({
            searchDialog: { ...state.searchDialog, open: false },
          })),

        setSearchMode: (mode) =>
          set((state) => ({
            searchDialog: { ...state.searchDialog, mode: parseSearchMode(mode, "hybrid") },
          })),

        setBookmarkViewMode: (mode) => set({ bookmarkViewMode: mode }),

        setShowAllChats: (show) => set({ showAllChats: show }),
      }),
      createPersistConfig("ui", {
        partialize: (state) =>
          ({
            bookmarkViewMode: state.bookmarkViewMode,
          }) as UIState,
      })
    ),
    { name: "UIStore" }
  )
)

// Keyboard shortcut handler (Cmd+K / Ctrl+K)
if (typeof window !== "undefined") {
  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault()
      useUIStore.getState().openSearchDialog()
    }
  }

  window.addEventListener("keydown", handleKeyDown)
}
