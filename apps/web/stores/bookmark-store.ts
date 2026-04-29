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

// 从书签列表中移除所有待删除的 ID，防止并发刷新将乐观删除的书签复活
function filterPendingDeletes(
  items: BookmarkItem[],
  pendingDeletes: Record<string, true>
): BookmarkItem[] {
  return items.filter((item) => !pendingDeletes[item.id])
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
              const pending = get().pendingDeletes
              set((state) => ({
                bookmarks: [
                  ...state.bookmarks,
                  ...filterPendingDeletes(cached.data.bookmarks, pending),
                ],
                pagination: cached.data.pagination,
                isLoadingMore: false,
              }))
            } else {
              set({
                bookmarks: filterPendingDeletes(cached.data.bookmarks, get().pendingDeletes),
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

              // 缓存和状态写入前过滤待删除 ID，防止已删书签复活
              const pending = get().pendingDeletes
              const filteredBookmarks = filterPendingDeletes(data.bookmarks, pending)

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
                data: { bookmarks: filteredBookmarks, pagination: newPagination },
                timestamp: Date.now(),
                ttl: CACHE_TTL,
              }

              if (append) {
                set((state) => ({
                  bookmarks: [...state.bookmarks, ...filteredBookmarks],
                  pagination: newPagination,
                  isLoadingMore: false,
                  cache: newCache,
                }))
              } else {
                set({
                  bookmarks: filteredBookmarks,
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
                // 再次从列表中移除（防止并发刷新将其重新插入）
                return {
                  pendingDeletes: rest,
                  bookmarks: state.bookmarks.filter((item) => item.id !== bookmarkId),
                }
              })
              return true
            }
          } catch {
            // 网络错误 → 回滚
          }

          // 回滚：清除 pending 后重新获取列表
          // 保存快照，防止 refetch 也失败时 UI 停留在假删除状态
          const rollbackSnapshot = { bookmarks: currentList, pagination: currentPagination }

          set((state) => {
            const { [bookmarkId]: _removed, ...restPending } = state.pendingDeletes
            return { pendingDeletes: restPending, cache: {} }
          })

          try {
            await get().fetchBookmarks()
          } catch {
            // refetch 失败 → 恢复删除前快照
            set({
              bookmarks: rollbackSnapshot.bookmarks,
              pagination: rollbackSnapshot.pagination,
            })
          }
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
