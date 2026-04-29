"use client"

import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Loader2,
  Monitor,
  Pencil,
  Puzzle,
  Save,
  Tag,
  Trash2,
  User,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { DeleteBookmarkDialog } from "@/components/delete-bookmark-dialog"
import { hasPlatformIcon, PlatformIcon } from "@/components/icons/platform-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useBookmarkDelete } from "@/hooks/use-bookmark-delete"
import { useLocale, useT } from "@/lib/i18n"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })
const MDPreview = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default.Markdown), {
  ssr: false,
})

interface BookmarkTag {
  id: string
  name: string
  color: string | null
}

interface BookmarkDetail {
  id: string
  type: string
  title: string
  description: string | null
  url: string | null
  content: string | null
  coverImage: string | null
  isFavorite: boolean
  sourceType: string | null
  fileUrl: string | null
  fileExtension: string | null
  ingestStatus: string
  ingestError: string | null
  platform: string | null
  author: string | null
  language: string | null
  sourceCreatedAt: Date | null
  createdAt: Date
  updatedAt: Date
  folderId: string | null
  folderName: string | null
  folderEmoji: string | null
  tags: BookmarkTag[]
}

export function BookmarkDetailClient({ bookmark }: { bookmark: BookmarkDetail }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(bookmark.content ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { deleteBookmark, error, isDeleting, resetError } = useBookmarkDelete()

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        setIsEditing(false)
      }
    } finally {
      setIsSaving(false)
    }
  }, [bookmark.id, content])

  return (
    <SidebarInset className="flex min-w-0 flex-col overflow-hidden">
      <div className="flex h-full flex-col">
        <Header
          bookmark={bookmark}
          deleteError={error}
          deleteOpen={deleteDialogOpen}
          isDeleting={isDeleting}
          isEditing={isEditing}
          isSaving={isSaving}
          onDelete={() => {
            resetError()
            setDeleteDialogOpen(true)
          }}
          onDeleteConfirm={() => {
            deleteBookmark({
              id: bookmark.id,
              title: bookmark.title,
              onSuccess: () => {
                setDeleteDialogOpen(false)
                router.push("/")
              },
            }).catch(() => {
              // 已通过 toast.error 处理错误，此处无需额外操作
            })
          }}
          onDeleteOpenChange={(open) => {
            if (!open) {
              resetError()
            }
            setDeleteDialogOpen(open)
          }}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <MetadataSection bookmark={bookmark} />
            <Separator className="my-6" />
            <ContentSection content={content} isEditing={isEditing} onContentChange={setContent} />
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}

function Header({
  bookmark,
  deleteError,
  deleteOpen,
  isDeleting,
  isEditing,
  isSaving,
  onDelete,
  onDeleteConfirm,
  onDeleteOpenChange,
  onEdit,
  onSave,
}: {
  bookmark: BookmarkDetail
  deleteError: string | null
  deleteOpen: boolean
  isDeleting: boolean
  isEditing: boolean
  isSaving: boolean
  onDelete: () => void
  onDeleteConfirm: () => void
  onDeleteOpenChange: (open: boolean) => void
  onEdit: () => void
  onSave: () => void
}) {
  const t = useT()
  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
          <Link
            className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
            href="/"
          >
            <ArrowLeft className="size-4" />
            {t.bookmarkDetail.back}
          </Link>
          <Separator className="mx-2 data-[orientation=vertical]:h-4" orientation="vertical" />
          <span className="line-clamp-1 flex-1 text-sm font-medium">{bookmark.title}</span>
        </div>
        <div className="flex items-center gap-2 px-3">
          {bookmark.url && (
            <Button asChild size="sm" variant="ghost">
              <a href={bookmark.url} rel="noopener noreferrer" target="_blank">
                <ExternalLink className="mr-1 size-3.5" />
                {t.bookmarkDetail.originalLink}
              </a>
            </Button>
          )}
          {isEditing ? (
            <Button disabled={isSaving || isDeleting} onClick={onSave} size="sm">
              {isSaving ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
              ) : (
                <Save className="mr-1 size-3.5" />
              )}
              {t.bookmarkDetail.save}
            </Button>
          ) : (
            <Button disabled={isDeleting} onClick={onEdit} size="sm" variant="outline">
              <Pencil className="mr-1 size-3.5" />
              {t.bookmarkDetail.edit}
            </Button>
          )}
          <Button
            className="border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
            disabled={isDeleting}
            onClick={onDelete}
            size="sm"
            variant="outline"
          >
            {isDeleting ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1 size-3.5" />
            )}
            {t.bookmarkDetail.delete}
          </Button>
        </div>
      </header>
      <DeleteBookmarkDialog
        error={deleteError}
        isDeleting={isDeleting}
        onConfirm={onDeleteConfirm}
        onOpenChange={onDeleteOpenChange}
        open={deleteOpen}
        title={bookmark.title}
      />
    </>
  )
}

function getSourceLabel(sourceType: string | null): {
  label: "sourceWeb" | "sourceExtension" | "sourceFile"
  icon: typeof Monitor | typeof Puzzle | typeof FileText
} {
  switch (sourceType) {
    case "url":
      return { label: "sourceWeb", icon: Monitor }
    case "extension":
      return { label: "sourceExtension", icon: Puzzle }
    case "file":
      return { label: "sourceFile", icon: FileText }
    default:
      return { label: "sourceWeb", icon: Monitor }
  }
}

function getTypeLabel(type: string, t: ReturnType<typeof useT>) {
  switch (type) {
    case "link":
      return t.bookmarkDetail.typeLink
    case "article":
      return t.bookmarkDetail.typeArticle
    case "video":
      return t.bookmarkDetail.typeVideo
    case "image":
      return t.bookmarkDetail.typeImage
    default:
      return type
  }
}

function MetadataSection({ bookmark }: { bookmark: BookmarkDetail }) {
  const t = useT()
  const { locale } = useLocale()
  const source = getSourceLabel(bookmark.sourceType)
  const SourceIcon = source.icon
  const sourceLabelMap = {
    sourceWeb: t.bookmarkDetail.sourceWeb,
    sourceExtension: t.bookmarkDetail.sourceExtension,
    sourceFile: t.bookmarkDetail.sourceFile,
  } as const

  return (
    <div className="space-y-5">
      {/* 标题 */}
      <h1 className="text-2xl font-bold leading-tight">{bookmark.title}</h1>

      {/* 描述 */}
      {bookmark.description && (
        <p className="text-muted-foreground leading-relaxed">{bookmark.description}</p>
      )}

      {/* 属性列表 - 竖向排列 */}
      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
        {/* 平台 */}
        {bookmark.platform && (
          <>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Globe className="size-3.5" />
              {t.bookmarkDetail.platform}
            </span>
            <span className="flex items-center gap-1.5">
              {hasPlatformIcon(bookmark.platform) ? (
                <PlatformIcon className="size-4" platform={bookmark.platform} />
              ) : (
                <Globe className="size-4 text-muted-foreground" />
              )}
              <span className="capitalize">{bookmark.platform}</span>
            </span>
          </>
        )}

        {/* 来源 */}
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <SourceIcon className="size-3.5" />
          {t.bookmarkDetail.source}
        </span>
        <span>
          <Badge className="text-xs" variant="outline">
            {sourceLabelMap[source.label]}
          </Badge>
        </span>

        {/* 类型 */}
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <FileText className="size-3.5" />
          {t.bookmarkDetail.type}
        </span>
        <span>{getTypeLabel(bookmark.type, t)}</span>

        {/* 作者 */}
        {bookmark.author && (
          <>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <User className="size-3.5" />
              {t.bookmarkDetail.author}
            </span>
            <span>{bookmark.author}</span>
          </>
        )}

        {/* 文件夹 */}
        {bookmark.folderName && (
          <>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <FolderOpen className="size-3.5" />
              {t.bookmarkDetail.folder}
            </span>
            <span className="flex items-center gap-1.5">
              <span>{bookmark.folderEmoji || "📁"}</span>
              {bookmark.folderName}
            </span>
          </>
        )}

        {/* 收藏时间 */}
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="size-3.5" />
          {t.bookmarkDetail.savedAt}
        </span>
        <span>
          {new Date(bookmark.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>

        {/* 原始发布时间 */}
        {bookmark.sourceCreatedAt && (
          <>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5" />
              {t.bookmarkDetail.publishedAt}
            </span>
            <span>
              {new Date(bookmark.sourceCreatedAt).toLocaleDateString(
                locale === "zh" ? "zh-CN" : "en",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </span>
          </>
        )}

        {/* 标签 */}
        {bookmark.tags.length > 0 && (
          <>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Tag className="size-3.5" />
              {t.bookmarkDetail.tags}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ContentSection({
  content,
  isEditing,
  onContentChange,
}: {
  content: string
  isEditing: boolean
  onContentChange: (v: string) => void
}) {
  const t = useT()
  if (!(content || isEditing)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>{t.bookmarkDetail.noContent}</p>
      </div>
    )
  }

  if (isEditing) {
    return (
      <MDEditor
        height="100%"
        onChange={(v) => onContentChange(v ?? "")}
        preview="live"
        style={{ minHeight: 500 }}
        value={content}
      />
    )
  }

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <MDPreview source={content} />
    </div>
  )
}
