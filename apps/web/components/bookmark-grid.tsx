"use client"

import {
  FileText,
  Grid3X3,
  Image,
  LayoutList,
  Link2,
  Loader2,
  Package,
  Search,
  Video,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { BookmarkCard, type BookmarkItem } from "@/components/bookmark-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const typeFilters = [
  { value: "all", label: "全部", icon: null },
  { value: "link", label: "链接", icon: Link2 },
  { value: "article", label: "文章", icon: FileText },
  { value: "video", label: "视频", icon: Video },
  { value: "image", label: "图片", icon: Image },
] as const

type ViewMode = "grid" | "list"

export function BookmarkGrid() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const [activeType, setActiveType] = useState("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const fetchBookmarks = useCallback(
    async (offset = 0, append = false) => {
      if (!append) setIsLoading(true)
      else setIsLoadingMore(true)

      try {
        const params = new URLSearchParams()
        if (activeType !== "all") params.set("type", activeType)
        if (search) params.set("search", search)
        params.set("limit", "20")
        params.set("offset", String(offset))

        const res = await fetch(`/api/bookmarks?${params}`)
        if (res.ok) {
          const data = await res.json()
          setBookmarks((prev) => (append ? [...prev, ...data.bookmarks] : data.bookmarks))
          setTotal(data.total)
          setHasMore(data.hasMore)
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [activeType, search]
  )

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const handleSearch = useCallback(() => {
    setSearch(searchInput)
  }, [searchInput])

  const handleLoadMore = useCallback(() => {
    fetchBookmarks(bookmarks.length, true)
  }, [fetchBookmarks, bookmarks.length])

  return (
    <div className="flex flex-col gap-4">
      {/* 筛选栏 */}
      <FilterBar
        activeType={activeType}
        onSearch={handleSearch}
        onSearchInputChange={setSearchInput}
        onTypeChange={setActiveType}
        searchInput={searchInput}
        setViewMode={setViewMode}
        total={total}
        viewMode={viewMode}
      />

      {/* 内容区域 */}
      {isLoading ? (
        <LoadingSkeleton viewMode={viewMode} />
      ) : bookmarks.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <>
          <BookmarkList bookmarks={bookmarks} viewMode={viewMode} />
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button disabled={isLoadingMore} onClick={handleLoadMore} variant="outline">
                {isLoadingMore && <Loader2 className="mr-2 size-4 animate-spin" />}
                加载更多
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FilterBar({
  activeType,
  onTypeChange,
  searchInput,
  onSearchInputChange,
  onSearch,
  viewMode,
  setViewMode,
  total,
}: {
  activeType: string
  onTypeChange: (type: string) => void
  searchInput: string
  onSearchInputChange: (v: string) => void
  onSearch: () => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  total: number
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {typeFilters.map((filter) => (
            <Button
              className={cn("h-8 text-xs", activeType === filter.value && "bg-accent")}
              key={filter.value}
              onClick={() => onTypeChange(filter.value)}
              size="sm"
              variant={activeType === filter.value ? "secondary" : "ghost"}
            >
              {filter.icon && <filter.icon className="mr-1 size-3.5" />}
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{total} 条收藏</span>
          <div className="flex items-center rounded-md border">
            <Button
              className="size-8 rounded-r-none"
              onClick={() => setViewMode("grid")}
              size="icon"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
            >
              <Grid3X3 className="size-3.5" />
            </Button>
            <Button
              className="size-8 rounded-l-none"
              onClick={() => setViewMode("list")}
              size="icon"
              variant={viewMode === "list" ? "secondary" : "ghost"}
            >
              <LayoutList className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="搜索收藏..."
          value={searchInput}
        />
      </div>
    </div>
  )
}

function BookmarkList({ bookmarks, viewMode }: { bookmarks: BookmarkItem[]; viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col divide-y rounded-xl border">
        {bookmarks.map((item) => (
          <BookmarkListItem item={item} key={item.id} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {bookmarks.map((item) => (
        <BookmarkCard item={item} key={item.id} />
      ))}
    </div>
  )
}

function BookmarkListItem({ item }: { item: BookmarkItem }) {
  const typeIcons: Record<string, typeof Link2> = {
    link: Link2,
    article: FileText,
    video: Video,
    image: Image,
  }
  const TypeIcon = typeIcons[item.type] || Link2

  let domain: string | null = null
  if (item.url) {
    try {
      domain = new URL(item.url).hostname.replace("www.", "")
    } catch {
      // ignore
    }
  }

  return (
    <a
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
      href={item.url || "#"}
      rel="noopener noreferrer"
      target="_blank"
    >
      <TypeIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
      {item.folderName && (
        <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
          <span>{item.folderEmoji}</span>
          <span>{item.folderName}</span>
        </span>
      )}
      {domain && (
        <span className="hidden shrink-0 text-muted-foreground text-xs sm:inline">{domain}</span>
      )}
      <span className="shrink-0 text-muted-foreground text-xs">
        {new Date(item.createdAt).toLocaleDateString("zh-CN")}
      </span>
    </a>
  )
}

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton className="h-12 w-full rounded-lg" key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="flex flex-col gap-2" key={i}>
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Package className="size-12 text-muted-foreground/40" />
      <div className="text-center">
        <p className="font-medium text-muted-foreground">
          {search ? "没有找到匹配的收藏" : "还没有任何收藏"}
        </p>
        <p className="mt-1 text-muted-foreground/60 text-sm">
          {search ? "试试其他关键词" : "开始收藏你喜欢的内容吧"}
        </p>
      </div>
    </div>
  )
}
