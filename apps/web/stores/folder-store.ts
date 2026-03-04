/**
 * Folder store - manages folder CRUD, drag & drop, and sorting
 * Includes 10-minute cache and optimistic updates
 */

import type { FolderItem } from "@repo/types"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface FolderState {
  folders: FolderItem[]
  isLoading: boolean
  lastFetch: number | null

  // Actions
  fetchFolders: (force?: boolean) => Promise<void>
  createFolder: (name: string) => Promise<FolderItem | null>
  deleteFolder: (folderId: string) => Promise<boolean>
  updateFolderEmoji: (folderId: string, emoji: string) => Promise<boolean>
  reorderFolders: (orderedIds: string[]) => Promise<boolean>
  moveBookmarkToFolder: (
    bookmarkId: string,
    sourceFolderId: string,
    targetFolderId: string,
    title: string
  ) => Promise<boolean>
  removeBookmarkFromFolder: (folderId: string, bookmarkId: string) => void
  reset: () => void
}

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

const initialState = {
  folders: [],
  isLoading: false,
  lastFetch: null,
}

export const useFolderStore = create<FolderState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchFolders: async (force = false) => {
        const { lastFetch, isLoading } = get()

        // Check cache validity
        if (!force && lastFetch && Date.now() - lastFetch < CACHE_TTL) {
          return
        }

        // Prevent concurrent fetches
        if (isLoading) {
          return
        }

        set({ isLoading: true })
        try {
          const res = await fetch("/api/folders")
          if (res.ok) {
            const data = await res.json()
            set({
              folders: data.folders,
              lastFetch: Date.now(),
              isLoading: false,
            })
          } else {
            set({ isLoading: false })
          }
        } catch {
          set({ isLoading: false })
        }
      },

      createFolder: async (name) => {
        try {
          const res = await fetch("/api/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          })
          if (res.ok) {
            const data = await res.json()
            set((state) => ({
              folders: [...state.folders, data.folder],
            }))
            return data.folder
          }
        } catch {
          // silently fail
        }
        return null
      },

      deleteFolder: async (folderId) => {
        const prevFolders = get().folders
        // Optimistic update
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
        }))

        try {
          const res = await fetch("/api/folders", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: folderId }),
          })
          if (res.ok) {
            return true
          }
          // Rollback on failure
          set({ folders: prevFolders })
          return false
        } catch {
          // Rollback on error
          set({ folders: prevFolders })
          return false
        }
      },

      updateFolderEmoji: async (folderId, emoji) => {
        const prevFolders = get().folders
        // Optimistic update
        set((state) => ({
          folders: state.folders.map((f) => (f.id === folderId ? { ...f, emoji } : f)),
        }))

        try {
          const res = await fetch(`/api/folders/${folderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
          })
          if (res.ok) {
            return true
          }
          // Rollback on failure
          set({ folders: prevFolders })
          return false
        } catch {
          // Rollback on error
          set({ folders: prevFolders })
          return false
        }
      },

      reorderFolders: async (orderedIds) => {
        const prevFolders = get().folders
        // Optimistic update
        const reordered = orderedIds
          .map((id) => prevFolders.find((f) => f.id === id))
          .filter(Boolean) as FolderItem[]
        set({ folders: reordered })

        try {
          const res = await fetch("/api/folders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedIds }),
          })
          if (res.ok) {
            return true
          }
          // Rollback on failure
          set({ folders: prevFolders })
          return false
        } catch {
          // Rollback on error
          set({ folders: prevFolders })
          return false
        }
      },

      moveBookmarkToFolder: async (bookmarkId, sourceFolderId, targetFolderId, title) => {
        const prevFolders = get().folders
        // Optimistic update
        set((state) => ({
          folders: state.folders.map((f) => {
            if (f.id === sourceFolderId) {
              return { ...f, items: f.items.filter((item) => item.id !== bookmarkId) }
            }
            if (f.id === targetFolderId) {
              return { ...f, items: [{ id: bookmarkId, title }, ...f.items].slice(0, 5) }
            }
            return f
          }),
        }))

        try {
          const res = await fetch(`/api/bookmarks/${bookmarkId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId: targetFolderId }),
          })
          if (res.ok) {
            return true
          }
          // Rollback on failure
          set({ folders: prevFolders })
          return false
        } catch {
          // Rollback on error
          set({ folders: prevFolders })
          return false
        }
      },

      removeBookmarkFromFolder: (folderId, bookmarkId) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId
              ? { ...f, items: f.items.filter((item) => item.id !== bookmarkId) }
              : f
          ),
        })),

      reset: () => set(initialState),
    }),
    { name: "FolderStore" }
  )
)
