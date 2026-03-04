/**
 * Bookmark store - manages bookmark list, filters, and pagination
 * Includes smart caching (2-minute TTL, cache 10 filter combinations)
 * Partial persistence (filters)
 */

import type { BookmarkFilters, BookmarkItem, BookmarkPagination, CacheMap } from "@repo/types"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { createPersistConfig } from "./middleware/persist-config"

interface BookmarkState {
  bookmarks: BookmarkItem[]
  filters: BookmarkFilters
  pagination: BookmarkPagination
  isLoading: boolean
  isLoadingMore: boolean
  cache: CacheMap<{ bookmarks: BookmarkItem[]; pagination: BookmarkPagination }>

  // Actions
  fetchBookmarks: (offset?: number, append?: boolean) => Promise<void>
  setFilters: (filters: Partial<BookmarkFilters>) => void
  resetFilters: () => void
  reset: () => void
}

const CACHE_TTL = 2 * 60 * 1000 // 2 minutes
const MAX_CACHE_ENTRIES = 10

const initialState = {
  bookmarks: [],
  filters: {
    type: "all",
    platform: "all",
  },
  pagination: {
    offset: 0,
    limit: 20,
    hasMore: false,
    total: 0,
  },
  isLoading: false,
  isLoadingMore: false,
  cache: {},
}

function getCacheKey(filters: BookmarkFilters, offset: number): string {
  return JSON.stringify({ ...filters, offset })
}

export const useBookmarkStore = create<BookmarkState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchBookmarks: async (offset = 0, append = false) => {
          const { filters, cache } = get()
          const cacheKey = getCacheKey(filters, offset)

          // Check cache
          const cached = cache[cacheKey]
          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            if (append) {
              set((state) => ({
                bookmarks: [...state.bookmarks, ...cached.data.bookmarks],
                pagination: cached.data.pagination,
                isLoadingMore: false,
              }))
            } else {
              set({
                bookmarks: cached.data.bookmarks,
                pagination: cached.data.pagination,
                isLoading: false,
              })
            }
            return
          }

          // Set loading state
          if (append) {
            set({ isLoadingMore: true })
          } else {
            set({ isLoading: true })
          }

          try {
            const params = new URLSearchParams()
            if (filters.type !== "all") {
              params.set("type", filters.type)
            }
            if (filters.platform !== "all") {
              params.set("platform", filters.platform)
            }
            if (filters.folderId) {
              params.set("folderId", filters.folderId)
            }
            params.set("limit", "20")
            params.set("offset", String(offset))

            const res = await fetch(`/api/bookmarks?${params}`)
            if (res.ok) {
              const data = await res.json()
              const newPagination: BookmarkPagination = {
                offset,
                limit: 20,
                hasMore: data.hasMore,
                total: data.total,
              }

              // Update cache (limit to MAX_CACHE_ENTRIES)
              const newCache = { ...get().cache }
              const cacheKeys = Object.keys(newCache)
              if (cacheKeys.length >= MAX_CACHE_ENTRIES) {
                // Remove oldest entry
                const oldestKey = cacheKeys.reduce((oldest, key) =>
                  newCache[key].timestamp < newCache[oldest].timestamp ? key : oldest
                )
                delete newCache[oldestKey]
              }
              newCache[cacheKey] = {
                data: { bookmarks: data.bookmarks, pagination: newPagination },
                timestamp: Date.now(),
                ttl: CACHE_TTL,
              }

              if (append) {
                set((state) => ({
                  bookmarks: [...state.bookmarks, ...data.bookmarks],
                  pagination: newPagination,
                  isLoadingMore: false,
                  cache: newCache,
                }))
              } else {
                set({
                  bookmarks: data.bookmarks,
                  pagination: newPagination,
                  isLoading: false,
                  cache: newCache,
                })
              }
            } else {
              set({ isLoading: false, isLoadingMore: false })
            }
          } catch {
            set({ isLoading: false, isLoadingMore: false })
          }
        },

        setFilters: (newFilters) => {
          set((state) => ({
            filters: { ...state.filters, ...newFilters },
            bookmarks: [],
            pagination: { ...state.pagination, offset: 0 },
          }))
          // Fetch with new filters
          get().fetchBookmarks()
        },

        resetFilters: () => {
          set({
            filters: initialState.filters,
            bookmarks: [],
            pagination: initialState.pagination,
          })
          get().fetchBookmarks()
        },

        reset: () => set(initialState),
      }),
      createPersistConfig("bookmark", {
        partialize: (state) =>
          ({
            filters: {
              type: state.filters.type,
              platform: state.filters.platform,
            },
          }) as BookmarkState,
      })
    ),
    { name: "BookmarkStore" }
  )
)
