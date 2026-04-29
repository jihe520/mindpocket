"use client"

import type { BookmarkItem } from "@repo/types"
import {
  ExternalLink,
  FileText,
  FolderInput,
  Heart,
  Image as ImageIcon,
  Link2,
  MoreHorizontal,
  Trash2,
  Video,
} from "lucide-react"
import NextImage from "next/image"
import Link from "next/link"
import { useState } from "react"
import { DeleteBookmarkDialog } from "@/components/delete-bookmark-dialog"
import { hasPlatformIcon, PlatformIcon } from "@/components/icons/platform-icons"
import { MoveToFolderDialog } from "@/components/move-to-folder-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBookmarkDelete } from "@/hooks/use-bookmark-delete"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const typeIcons: Record<string, typeof Link2> = {
  link: Link2,
  article: FileText,
  video: Video,
  image: ImageIcon,
}

function getDomain(url: string | null) {
  if (!url) {
    return null
  }
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return null
  }
}

function formatTemplate(template: string, count: number) {
  return template.replace("{count}", String(count))
}

function getRelativeTime(dateStr: string, t: ReturnType<typeof useT>) {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (minutes < 1) {
    return t.bookmarkList.justNow
  }
  if (minutes < 60) {
    return formatTemplate(t.bookmarkList.minutesAgo, minutes)
  }
  if (hours < 24) {
    return formatTemplate(t.bookmarkList.hoursAgo, hours)
  }
  if (days < 7) {
    return formatTemplate(t.bookmarkList.daysAgo, days)
  }
  if (weeks < 5) {
    return formatTemplate(t.bookmarkList.weeksAgo, weeks)
  }
  return formatTemplate(t.bookmarkList.monthsAgo, months)
}

function getGradientFromUrl(url: string | null) {
  if (!url) {
    return "from-blue-500/20 to-purple-500/20"
  }
  const hash = url.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const gradients = [
    "from-blue-500/20 to-purple-500/20",
    "from-green-500/20 to-teal-500/20",
    "from-orange-500/20 to-red-500/20",
    "from-pink-500/20 to-rose-500/20",
    "from-indigo-500/20 to-blue-500/20",
    "from-amber-500/20 to-yellow-500/20",
  ]
  return gradients[hash % gradients.length]
}

function getTypeLabel(type: string, t: ReturnType<typeof useT>) {
  switch (type) {
    case "link":
      return t.bookmarkList.typeLink
    case "article":
      return t.bookmarkList.typeArticle
    case "video":
      return t.bookmarkList.typeVideo
    case "image":
      return t.bookmarkList.typeImage
    default:
      return type
  }
}

export function BookmarkCard({ item }: { item: BookmarkItem }) {
  const t = useT()
  const TypeIcon = typeIcons[item.type] || Link2
  const domain = getDomain(item.url)
  const gradient = getGradientFromUrl(item.url)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [folderInfo, setFolderInfo] = useState({
    folderId: item.folderId,
    folderName: item.folderName,
    folderEmoji: item.folderEmoji,
  })
  const { deleteBookmark, error, isDeleting, resetError } = useBookmarkDelete()

  const displayFolderName = folderInfo.folderName
  const displayFolderEmoji = folderInfo.folderEmoji
  const hasPlatform = hasPlatformIcon(item.platform)
  const showFallbackTypeMeta = !(displayFolderName || domain || hasPlatform)

  return (
    <>
      <Link
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm",
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-black/5"
        )}
        href={`/bookmark/${item.id}`}
      >
        {/* 封面图和状态信息 */}
        <div className="relative aspect-[1.18] w-full overflow-hidden bg-muted">
          {item.coverImage ? (
            <NextImage
              alt={item.title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              src={item.coverImage}
            />
          ) : (
            <div
              className={cn(
                "flex size-full items-center justify-center bg-gradient-to-br",
                gradient
              )}
            >
              <TypeIcon className="size-7 text-foreground/35" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-90" />

          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <Badge
              className="border-white/15 bg-black/40 text-white backdrop-blur-md"
              variant="outline"
            >
              <TypeIcon className="size-3.5" />
              {getTypeLabel(item.type, t)}
            </Badge>
            {item.isFavorite && (
              <Badge className="border-rose-400/20 bg-rose-500/85 text-white backdrop-blur-md">
                <Heart className="size-3.5 fill-current" />
              </Badge>
            )}
          </div>

          {(hasPlatform || domain) && (
            <div className="absolute bottom-2 left-2 max-w-[calc(100%-4rem)]">
              <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-white text-xs backdrop-blur-md">
                {hasPlatform ? (
                  <PlatformIcon platform={item.platform!} />
                ) : (
                  <Link2 className="size-3 shrink-0" />
                )}
                <span className="truncate">{domain || item.platform}</span>
              </div>
            </div>
          )}

          {/* 悬浮操作按钮 */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  className="size-7 rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md hover:bg-black/55 hover:text-white"
                  onClick={(e) => e.preventDefault()}
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-3" />
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    setDropdownOpen(false)
                    resetError()
                    setDeleteDialogOpen(true)
                  }}
                  variant="destructive"
                >
                  <Trash2 className="mr-2 size-3.5" />
                  {t.bookmark.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex flex-1 flex-col gap-2.5 p-3">
          {/* 标题 */}
          <h3 className="line-clamp-2 min-h-[2.75rem] font-semibold text-[0.95rem] leading-6 tracking-[-0.01em]">
            {item.title}
          </h3>

          {/* 底部元信息 */}
          <div className="mt-auto flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs">
            {displayFolderName && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-1">
                <span>{displayFolderEmoji || "📁"}</span>
                <span className="truncate">{displayFolderName}</span>
              </span>
            )}
            {!hasPlatform && domain && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted/70 px-2 py-1">
                <Link2 className="size-3 shrink-0" />
                <span className="truncate">{domain}</span>
              </span>
            )}
            <span className="ml-auto inline-flex items-center rounded-full bg-muted/60 px-2 py-1 font-medium text-[11px]">
              {getRelativeTime(item.createdAt, t)}
            </span>
            {hasPlatform && (
              <span className="inline-flex size-6 items-center justify-center rounded-full border bg-background">
                <PlatformIcon platform={item.platform!} />
              </span>
            )}
            {item.isFavorite && !item.coverImage && (
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40">
                <Heart className="size-3 shrink-0 fill-current" />
              </span>
            )}
            {showFallbackTypeMeta && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted/70 px-2 py-1">
                <TypeIcon className="size-3 shrink-0" />
                <span className="truncate">{getTypeLabel(item.type, t)}</span>
              </span>
            )}
          </div>
        </div>
      </Link>

      <MoveToFolderDialog
        bookmarkId={item.id}
        currentFolderId={folderInfo.folderId}
        onMoved={(folderId, folderName, folderEmoji) => {
          setFolderInfo({ folderId, folderName, folderEmoji })
        }}
        onOpenChange={setMoveDialogOpen}
        open={moveDialogOpen}
      />
      <DeleteBookmarkDialog
        error={error}
        isDeleting={isDeleting}
        onConfirm={() => {
          deleteBookmark({
            id: item.id,
            title: item.title,
            onSuccess: () => setDeleteDialogOpen(false),
          }).catch(() => {
            // 已通过 toast.error 处理错误，此处无需额外操作
          })
        }}
        onOpenChange={(open) => {
          if (!open) {
            resetError()
          }
          setDeleteDialogOpen(open)
        }}
        open={deleteDialogOpen}
        title={item.title}
      />
    </>
  )
}
