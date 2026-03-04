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
  Video,
} from "lucide-react"
import NextImage from "next/image"
import Link from "next/link"
import { useState } from "react"
import { hasPlatformIcon, PlatformIcon } from "@/components/icons/platform-icons"
import { MoveToFolderDialog } from "@/components/move-to-folder-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

function getRelativeTime(dateStr: string) {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (minutes < 1) {
    return "刚刚"
  }
  if (minutes < 60) {
    return `${minutes}分钟前`
  }
  if (hours < 24) {
    return `${hours}小时前`
  }
  if (days < 7) {
    return `${days}天前`
  }
  if (weeks < 5) {
    return `${weeks}周前`
  }
  return `${months}个月前`
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

export function BookmarkCard({ item }: { item: BookmarkItem }) {
  const t = useT()
  const TypeIcon = typeIcons[item.type] || Link2
  const domain = getDomain(item.url)
  const gradient = getGradientFromUrl(item.url)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [folderInfo, setFolderInfo] = useState({
    folderId: item.folderId,
    folderName: item.folderName,
    folderEmoji: item.folderEmoji,
  })

  const displayFolderName = folderInfo.folderName
  const displayFolderEmoji = folderInfo.folderEmoji

  return (
    <>
      <Link
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border bg-card",
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        )}
        href={`/bookmark/${item.id}`}
      >
        {/* 封面图 */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {item.coverImage ? (
            <NextImage
              alt={item.title}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              src={item.coverImage}
            />
          ) : (
            <div
              className={cn(
                "flex size-full items-center justify-center bg-gradient-to-br",
                gradient
              )}
            >
              <TypeIcon className="size-8 text-muted-foreground/50" />
            </div>
          )}

          {/* 悬浮操作按钮 */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="size-7 bg-background/80 backdrop-blur-sm"
                  onClick={(e) => e.preventDefault()}
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
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
        </div>

        {/* 内容区域 */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          {/* 标题 */}
          <h3 className="line-clamp-2 font-medium text-sm leading-snug">{item.title}</h3>

          {/* 描述 */}
          {item.description && (
            <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
              {item.description}
            </p>
          )}

          {/* 底部元信息 */}
          <div className="mt-auto flex items-center gap-2 pt-1 text-muted-foreground text-xs">
            {displayFolderName && (
              <span className="flex items-center gap-1 truncate">
                <span>{displayFolderEmoji || "📁"}</span>
                <span className="truncate">{displayFolderName}</span>
              </span>
            )}
            {displayFolderName && (hasPlatformIcon(item.platform) || domain) && <span>·</span>}
            {hasPlatformIcon(item.platform) ? (
              <PlatformIcon platform={item.platform!} />
            ) : (
              domain && (
                <span className="flex items-center gap-1 truncate">
                  <Link2 className="size-3 shrink-0" />
                  <span className="truncate">{domain}</span>
                </span>
              )
            )}
          </div>

          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{getRelativeTime(item.createdAt)}</span>
            {item.isFavorite && <Heart className="size-3 fill-red-500 text-red-500" />}
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
    </>
  )
}
