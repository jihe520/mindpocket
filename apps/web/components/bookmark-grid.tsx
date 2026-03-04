"use client"

import type { BookmarkItem, ViewMode } from "@repo/types"
import {
  ExternalLink,
  FileText,
  FolderInput,
  Grid3X3,
  Heart,
  Image,
  LayoutList,
  Link2,
  Loader2,
  MoreHorizontal,
  Package,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { BookmarkCard } from "@/components/bookmark-card"
import { hasPlatformIcon, PLATFORM_CONFIG, PlatformIcon } from "@/components/icons/platform-icons"
import { MoveToFolderDialog } from "@/components/move-to-folder-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useBookmarkStore, useUIStore } from "@/stores"

const typeFilters = [
  { value: "all", label: "全部", icon: null },
  { value: "link", label: "链接", icon: Link2 },
  { value: "article", label: "文章", icon: FileText },
  { value: "video", label: "视频", icon: Video },
  { value: "image", label: "图片", icon: Image },
] as const

const platformFilters = [
  { value: "all", label: "全部" },
  { value: "wechat", label: "微信" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "bilibili", label: "哔哩哔哩" },
] as const

const LIST_SKELETON_KEYS = [
  "list-skeleton-1",
  "list-skeleton-2",
  "list-skeleton-3",
  "list-skeleton-4",
  "list-skeleton-5",
  "list-skeleton-6",
]
const GRID_SKELETON_KEYS = [
  "grid-skeleton-1",
  "grid-skeleton-2",
  "grid-skeleton-3",
  "grid-skeleton-4",
  "grid-skeleton-5",
  "grid-skeleton-6",
  "grid-skeleton-7",
  "grid-skeleton-8",
]

export function BookmarkGrid({ refreshKey, folderId }: { refreshKey?: number; folderId?: string }) {
  const { bookmarks, filters, pagination, isLoading, isLoadingMore, fetchBookmarks, setFilters } =
    useBookmarkStore()
  const { bookmarkViewMode, setBookmarkViewMode } = useUIStore()

  // Keep folder filter scoped to current page context.
  useEffect(() => {
    setFilters({ folderId })
  }, [folderId, setFilters])

  // Refresh when refreshKey changes
  useEffect(() => {
    if (refreshKey) {
      fetchBookmarks()
    }
  }, [refreshKey, fetchBookmarks])

  const handleLoadMore = useCallback(() => {
    fetchBookmarks(bookmarks.length, true)
  }, [fetchBookmarks, bookmarks.length])

  return (
    <div className="flex flex-col gap-4">
      {/* 筛选栏 */}
      <FilterBar
        activePlatform={filters.platform}
        activeType={filters.type}
        onPlatformChange={(platform) => setFilters({ platform })}
        onTypeChange={(type) => setFilters({ type })}
        setViewMode={setBookmarkViewMode}
        total={pagination.total}
        viewMode={bookmarkViewMode}
      />

      {/* 内容区域 */}
      {isLoading && <LoadingSkeleton viewMode={bookmarkViewMode} />}
      {!isLoading && bookmarks.length === 0 && <EmptyState />}
      {!isLoading && bookmarks.length > 0 && (
        <>
          <BookmarkList bookmarks={bookmarks} viewMode={bookmarkViewMode} />
          {pagination.hasMore && (
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
  activePlatform,
  onPlatformChange,
  viewMode,
  setViewMode,
  total,
}: {
  activeType: string
  onTypeChange: (type: string) => void
  activePlatform: string
  onPlatformChange: (platform: string) => void
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

      <div className="flex items-center gap-1">
        {platformFilters.map((filter) => {
          const config = filter.value !== "all" ? PLATFORM_CONFIG[filter.value] : null
          const Icon = config?.icon
          return (
            <Button
              className={cn("h-7 text-xs", activePlatform === filter.value && "bg-accent")}
              key={filter.value}
              onClick={() => onPlatformChange(filter.value)}
              size="sm"
              variant={activePlatform === filter.value ? "secondary" : "ghost"}
            >
              {Icon && <Icon className={cn("mr-1 size-3.5", config.color)} />}
              {filter.label}
            </Button>
          )
        })}
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
  const t = useT()
  const typeIcons: Record<string, typeof Link2> = {
    link: Link2,
    article: FileText,
    video: Video,
    image: Image,
  }
  const TypeIcon = typeIcons[item.type] || Link2
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)

  let domain: string | null = null
  if (item.url) {
    try {
      domain = new URL(item.url).hostname.replace("www.", "")
    } catch {
      // ignore
    }
  }

  return (
    <>
      <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
        <Link className="flex min-w-0 flex-1 items-center gap-3" href={`/bookmark/${item.id}`}>
          <TypeIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
          {item.folderName && (
            <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
              <span>{item.folderEmoji}</span>
              <span>{item.folderName}</span>
            </span>
          )}
          {hasPlatformIcon(item.platform) ? (
            <span className="hidden shrink-0 sm:inline">
              <PlatformIcon platform={item.platform!} />
            </span>
          ) : (
            domain && (
              <span className="hidden shrink-0 text-muted-foreground text-xs sm:inline">
                {domain}
              </span>
            )
          )}
          <span className="shrink-0 text-muted-foreground text-xs">
            {new Date(item.createdAt).toLocaleDateString("zh-CN")}
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
              size="icon"
              variant="ghost"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={item.url || "#"} rel="noopener noreferrer" target="_blank">
                <ExternalLink className="mr-2 size-3.5" />
                {t.bookmark.openInNewTab}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Heart className="mr-2 size-3.5" />
              {item.isFavorite ? t.bookmark.removeFavorite : t.bookmark.addFavorite}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setMoveDialogOpen(true)}>
              <FolderInput className="mr-2 size-3.5" />
              {t.bookmark.moveToFolder}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <MoveToFolderDialog
        bookmarkId={item.id}
        currentFolderId={item.folderId}
        onMoved={() => {
          // no-op: list view doesn't track folder state locally
        }}
        onOpenChange={setMoveDialogOpen}
        open={moveDialogOpen}
      />
    </>
  )
}

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {LIST_SKELETON_KEYS.map((key) => (
          <Skeleton className="h-12 w-full rounded-lg" key={key} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {GRID_SKELETON_KEYS.map((key) => (
        <div className="flex flex-col gap-2" key={key}>
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Package className="size-12 text-muted-foreground/40" />
      <div className="text-center">
        <p className="font-medium text-muted-foreground">还没有任何收藏</p>
        <p className="mt-1 text-muted-foreground/60 text-sm">开始收藏你喜欢的内容吧</p>
      </div>
    </div>
  )
}
