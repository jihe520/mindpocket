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
  // 跟踪正在删除的书签 ID，用于并发删除时的精确回滚
  pendingDeletes: Record<string, true>

  // Actions
  fetchBookmarks: (offset?: number, append?: boolean) => Promise<void>
  deleteBookmark: (bookmarkId: string) => Promise<boolean>
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
  pendingDeletes: {} as Record<string, true>,
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

        deleteBookmark: async (bookmarkId) => {
          // 防止重复删除请求
          if (get().pendingDeletes[bookmarkId]) {
            return false
          }

          const { bookmarks: currentList, pagination: currentPagination } = get()
          const existsInCurrentList = currentList.some((item) => item.id === bookmarkId)

          // 乐观更新：标记 pending + 移除 + 清缓存
          set((state) => ({
            pendingDeletes: { ...state.pendingDeletes, [bookmarkId]: true },
            bookmarks: currentList.filter((item) => item.id !== bookmarkId),
            pagination: existsInCurrentList
              ? { ...currentPagination, total: Math.max(0, currentPagination.total - 1) }
              : currentPagination,
            cache: {},
          }))

          try {
            const res = await fetch(`/api/bookmarks/${bookmarkId}`, {
              method: "DELETE",
            })

            // 404 视为幂等成功（书签已不存在）
            if (res.ok || res.status === 404) {
              set((state) => {
                const { [bookmarkId]: _, ...rest } = state.pendingDeletes
                return { pendingDeletes: rest }
              })
              return true
            }
          } catch {
            // 网络错误 → 回滚
          }

          // 精确回滚：仅恢复失败的书签，不覆盖全量列表
          set((state) => {
            const { [bookmarkId]: _removed, ...restPending } = state.pendingDeletes
            // 如果书签已不在列表中（未被其他操作修改），追回它
            if (existsInCurrentList && !state.bookmarks.some((item) => item.id === bookmarkId)) {
              // 按原始顺序插回（找到被删书签在原列表中的位置）
              const idx = currentList.findIndex((item) => item.id === bookmarkId)
              const restored = [...state.bookmarks]
              if (idx >= 0 && idx <= restored.length) {
                restored.splice(idx, 0, currentList[idx])
              } else {
                restored.push(currentList.find((item) => item.id === bookmarkId)!)
              }
              return {
                pendingDeletes: restPending,
                bookmarks: restored,
                pagination: { ...state.pagination, total: state.pagination.total + 1 },
              }
            }
            return { pendingDeletes: restPending }
          })
          return false
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
