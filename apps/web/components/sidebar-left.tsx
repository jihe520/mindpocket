"use client"

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ChatItem, FolderItem } from "@repo/types"
import {
  Bookmark,
  Folder,
  GripVertical,
  Import,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  SmilePlus,
  Sparkles,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  BilibiliIcon,
  GithubIcon,
  QQIcon,
  TwitterIcon,
  XiaohongshuIcon,
} from "@/components/icons/platform-icons"
import { NavUser } from "@/components/nav-user"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useT } from "@/lib/i18n"
import { useChatStore, useFolderStore, useUIStore, useUserStore } from "@/stores"

const socialLinks = [
  { name: "GitHub", icon: GithubIcon, url: "https://github.com/jihe520/mindpocket" },
  { name: "X", icon: TwitterIcon, url: "https://x.com/EqbymCi" },
  {
    name: "小红书",
    icon: XiaohongshuIcon,
    url: "https://www.xiaohongshu.com/user/profile/647a0857000000002a037c03",
  },
  { name: "哔哩哔哩", icon: BilibiliIcon, url: "https://space.bilibili.com/400340982" },
  { name: "QQ群", icon: QQIcon, url: "https://qm.qq.com/q/jSXw3cyi8U" },
]

export function SidebarLeft({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useT()

  // Zustand stores
  const { openSearchDialog } = useUIStore()
  const { showAllChats, setShowAllChats } = useUIStore()
  const { userInfo, fetchUser } = useUserStore()
  const {
    chats,
    isLoading: isLoadingChats,
    fetchChats,
    deleteChat: deleteChatFromStore,
  } = useChatStore()
  const {
    folders,
    isLoading: isLoadingFolders,
    fetchFolders,
    createFolder: createFolderInStore,
    deleteFolder: deleteFolderFromStore,
    updateFolderEmoji,
    reorderFolders: reorderFoldersInStore,
    moveBookmarkToFolder: moveBookmarkInStore,
    removeBookmarkFromFolder,
  } = useFolderStore()

  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  // dnd-kit state
  const [activeDrag, setActiveDrag] = useState<{
    type: "bookmark" | "folder"
    id: string
    title: string
    emoji?: string
  } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // 初始加载文件夹和用户信息（只加载一次）
  useEffect(() => {
    fetchFolders()
    fetchUser()
  }, [fetchFolders, fetchUser])

  // 聊天记录随 pathname 变化重新加载
  useEffect(() => {
    fetchChats(true) // Force refresh on pathname change
  }, [fetchChats])

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim()
    if (!name) {
      setIsCreatingFolder(false)
      setNewFolderName("")
      return
    }
    const folder = await createFolderInStore(name)
    if (folder) {
      toast.success(t.sidebar.folderCreated)
    } else {
      toast.error(t.sidebar.folderCreateFailed)
    }
    setIsCreatingFolder(false)
    setNewFolderName("")
  }, [newFolderName, t, createFolderInStore])

  const handleDeleteChat = useCallback(
    async (e: React.MouseEvent, chatId: string) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        const res = await fetch("/api/chat", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: chatId }),
        })
        if (res.ok) {
          deleteChatFromStore(chatId)
          if (pathname === `/chat/${chatId}`) {
            router.push("/chat")
          }
          toast.success(t.sidebar.chatDeleted)
        }
      } catch {
        toast.error(t.sidebar.chatDeleteFailed)
      }
    },
    [pathname, router, t, deleteChatFromStore]
  )

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      const success = await deleteFolderFromStore(folderId)
      if (success) {
        if (pathname === `/folders/${folderId}`) {
          router.push("/")
        }
        toast.success(t.sidebar.folderDeleted)
      } else {
        toast.error(t.sidebar.folderDeleteFailed)
      }
    },
    [pathname, router, t, deleteFolderFromStore]
  )

  const handleDeleteBookmark = useCallback(
    async (e: React.MouseEvent, bookmarkId: string) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        const res = await fetch(`/api/bookmarks/${bookmarkId}`, {
          method: "DELETE",
        })
        if (res.ok) {
          // Remove from all folders
          for (const folder of folders) {
            if (folder.items.some((item) => item.id === bookmarkId)) {
              removeBookmarkFromFolder(folder.id, bookmarkId)
            }
          }
          if (pathname === `/bookmark/${bookmarkId}`) {
            router.push("/")
          }
          toast.success(t.sidebar.bookmarkDeleted)
        } else {
          toast.error(t.sidebar.bookmarkDeleteFailed)
        }
      } catch {
        toast.error(t.sidebar.bookmarkDeleteFailed)
      }
    },
    [pathname, router, t, folders, removeBookmarkFromFolder]
  )

  const handleEmojiChange = useCallback(
    async (folderId: string, emoji: string) => {
      const success = await updateFolderEmoji(folderId, emoji)
      if (!success) {
        toast.error(t.sidebar.emojiChangeFailed)
      }
    },
    [t, updateFolderEmoji]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const data = active.data.current
    if (data?.type === "bookmark") {
      setActiveDrag({ type: "bookmark", id: active.id as string, title: data.title })
    } else if (data?.type === "folder") {
      setActiveDrag({
        type: "folder",
        id: active.id as string,
        title: data.name,
        emoji: data.emoji,
      })
    }
  }, [])

  const moveBookmarkToFolder = useCallback(
    async (bookmarkId: string, sourceFolderId: string, targetFolderId: string, title: string) => {
      const success = await moveBookmarkInStore(bookmarkId, sourceFolderId, targetFolderId, title)
      if (success) {
        toast.success("已移动")
      } else {
        toast.error("移动失败")
      }
    },
    [moveBookmarkInStore]
  )

  const reorderFolders = useCallback(
    async (oldIndex: number, newIndex: number) => {
      const reordered = arrayMove(folders, oldIndex, newIndex)
      const success = await reorderFoldersInStore(reordered.map((f) => f.id))
      if (!success) {
        toast.error("排序失败")
      }
    },
    [folders, reorderFoldersInStore]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null)
      const { active, over } = event
      if (!over) {
        return
      }

      const activeType = active.data.current?.type

      if (activeType === "bookmark") {
        const bookmarkId = active.data.current?.bookmarkId as string
        const sourceFolderId = active.data.current?.folderId as string
        const targetFolderId = over.data.current?.folderId as string

        if (!targetFolderId || targetFolderId === sourceFolderId) {
          return
        }

        moveBookmarkToFolder(
          bookmarkId,
          sourceFolderId,
          targetFolderId,
          active.data.current?.title || ""
        )
      }

      if (activeType === "folder") {
        const oldIndex = folders.findIndex((f) => f.id === active.id)
        const newIndex = folders.findIndex((f) => f.id === over.id)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return
        }

        reorderFolders(oldIndex, newIndex)
      }
    },
    [folders, moveBookmarkToFolder, reorderFolders]
  )

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <svg
                    className="size-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>MindPocket</title>
                    <path d="M14 2a3 3 0 0 1 .054 6l-.218.653A4.507 4.507 0 0 1 15.89 11.5h1.319a2.5 2.5 0 1 1 0 2h-1.32a4.487 4.487 0 0 1-1.006 1.968l.704.704a2.5 2.5 0 1 1-1.414 1.414l-.934-.934A4.485 4.485 0 0 1 11.5 17a4.481 4.481 0 0 1-1.982-.46l-.871 1.046a3 3 0 1 1-1.478-1.35l.794-.954A4.48 4.48 0 0 1 7 12.5c0-.735.176-1.428.488-2.041l-.868-.724A2.5 2.5 0 1 1 7.9 8.2l.87.724a4.48 4.48 0 0 1 3.169-.902l.218-.654A3 3 0 0 1 14 2M6 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2m10.5 0a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1m-5-8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m8 2a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1m-14-5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1M14 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
                  </svg>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">MindPocket</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {t.sidebar.subtitle}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* 主导航 */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/chat"}>
              <Link href="/chat">
                <Sparkles />
                <span>{t.sidebar.aiChat}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={openSearchDialog}>
              <Search />
              <span>{t.sidebar.search}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>{t.sidebar.dashboard}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/ingest"}>
              <Link href="/ingest">
                <Import />
                <span>{t.sidebar.import}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"}>
              <Link href="/">
                <Bookmark />
                <span>{t.sidebar.bookmarks}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* 聊天记录 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <MessageSquare className="mr-1 size-3" />
            {t.sidebar.chatHistory}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingChats && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t.common.loading}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {!isLoadingChats && chats.length === 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="text-muted-foreground text-xs">{t.sidebar.noChats}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {!isLoadingChats &&
                chats.length > 0 &&
                (showAllChats ? chats : chats.slice(0, 4)).map((chat) => (
                  <ChatMenuItem
                    chat={chat}
                    isActive={pathname === `/chat/${chat.id}`}
                    key={chat.id}
                    onDelete={(e) => handleDeleteChat(e, chat.id)}
                    t={t}
                  />
                ))}
              {!isLoadingChats && chats.length > 4 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="text-muted-foreground text-xs"
                    onClick={() => setShowAllChats(!showAllChats)}
                  >
                    <MoreHorizontal className="size-4" />
                    <span>
                      {showAllChats
                        ? t.sidebar.showLess
                        : `${t.sidebar.showMore} (${chats.length - 4})`}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 文件夹分类 */}
        <SidebarGroup className="-mt-5">
          <SidebarGroupLabel>
            <Folder className="mr-1 size-3" />
            {t.sidebar.folders}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} sensors={sensors}>
              <SortableContext
                items={[
                  ...folders.map((f) => f.id),
                  ...folders.flatMap((f) => f.items.map((item) => `bookmark-${item.id}`)),
                ]}
                strategy={verticalListSortingStrategy}
              >
                <SidebarMenu>
                  {isLoadingFolders && (
                    <SidebarMenuItem>
                      <SidebarMenuButton disabled>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{t.common.loading}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {!isLoadingFolders && folders.length === 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton disabled>
                        <span className="text-muted-foreground text-xs">{t.sidebar.noFolders}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {!isLoadingFolders &&
                    folders.map((f) => (
                      <FolderMenuItem
                        folder={f}
                        isActive={pathname === `/folders/${f.id}`}
                        key={f.id}
                        onDelete={() => handleDeleteFolder(f.id)}
                        onDeleteBookmark={handleDeleteBookmark}
                        onEmojiChange={handleEmojiChange}
                        t={t}
                      />
                    ))}

                  <SidebarMenuItem>
                    {isCreatingFolder ? (
                      <div className="flex items-center gap-2 px-2 py-1">
                        <span>📁</span>
                        <input
                          autoFocus
                          className="h-6 flex-1 rounded border bg-transparent px-1 text-sm outline-none focus:border-sidebar-primary"
                          onBlur={handleCreateFolder}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCreateFolder()
                            }
                            if (e.key === "Escape") {
                              setIsCreatingFolder(false)
                              setNewFolderName("")
                            }
                          }}
                          placeholder={t.sidebar.folderPlaceholder}
                          ref={newFolderInputRef}
                          value={newFolderName}
                        />
                      </div>
                    ) : (
                      <SidebarMenuButton
                        className="text-sidebar-foreground/70"
                        onClick={() => setIsCreatingFolder(true)}
                      >
                        <Plus className="size-4" />
                        <span>{t.sidebar.newFolder}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SortableContext>

              <DragOverlay>
                {activeDrag ? (
                  <div className="flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-1.5 text-sm shadow-md">
                    {activeDrag.type === "folder" ? (
                      <>
                        <span>{activeDrag.emoji}</span>
                        <span>{activeDrag.title}</span>
                      </>
                    ) : (
                      <span className="truncate">{activeDrag.title}</span>
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        {/* 用户信息 */}
        <NavUser user={userInfo} />

        {/* 社交媒体链接 */}
        <div className="flex items-center justify-between ">
          {socialLinks.map((link) => (
            <a
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              href={link.url}
              key={link.name}
              rel="noopener noreferrer"
              target="_blank"
            >
              <link.icon className="size-4" />
              <span className="sr-only">{link.name}</span>
            </a>
          ))}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function ChatMenuItem({
  chat,
  isActive,
  onDelete,
  t,
}: {
  chat: ChatItem
  isActive: boolean
  onDelete: (e: React.MouseEvent) => void
  t: ReturnType<typeof useT>
}) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarMenuItem
      onContextMenu={(e) => {
        e.preventDefault()
        setOpen(true)
      }}
    >
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`}>
          <span className="truncate">{chat.title}</span>
        </Link>
      </SidebarMenuButton>
      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction className="opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100">
            <MoreHorizontal className="size-3" />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 />
            <span>{t.sidebar.deleteChat}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function FolderMenuItem({
  folder,
  isActive,
  onDelete,
  onDeleteBookmark,
  onEmojiChange,
  t,
}: {
  folder: FolderItem
  isActive: boolean
  onDelete: () => void
  onDeleteBookmark: (e: React.MouseEvent, bookmarkId: string) => void
  onEmojiChange: (folderId: string, emoji: string) => void
  t: ReturnType<typeof useT>
}) {
  const [open, setOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const emojiPickerOpenedAt = useRef(0)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: folder.id,
      data: { type: "folder", name: folder.name, emoji: folder.emoji, folderId: folder.id },
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <Collapsible className="group/collapsible">
      <SidebarMenuItem ref={setNodeRef} style={style}>
        <Popover
          onOpenChange={(v) => {
            if (!v && Date.now() - emojiPickerOpenedAt.current < 300) {
              return
            }
            setEmojiPickerOpen(v)
          }}
          open={emojiPickerOpen}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              asChild
              className={
                isOver && !isDragging ? "ring-2 ring-primary/50 bg-sidebar-accent" : undefined
              }
              isActive={isActive}
              onContextMenu={(e) => {
                e.preventDefault()
                setOpen(true)
              }}
            >
              <Link href={`/folders/${folder.id}`}>
                <PopoverAnchor asChild>
                  <span
                    className="cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                  >
                    {folder.emoji}
                  </span>
                </PopoverAnchor>
                <span>{folder.name}</span>
              </Link>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <PopoverContent align="start" className="w-fit p-0" side="right">
            <EmojiPicker
              className="h-[342px]"
              onEmojiSelect={({ emoji }) => {
                onEmojiChange(folder.id, emoji)
                setEmojiPickerOpen(false)
              }}
            >
              <EmojiPickerSearch />
              <EmojiPickerContent />
              <EmojiPickerFooter />
            </EmojiPicker>
          </PopoverContent>
        </Popover>
        <DropdownMenu onOpenChange={setOpen} open={open}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction className="opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100">
              <MoreHorizontal className="size-3" />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right">
            <DropdownMenuItem
              onClick={() => {
                setOpen(false)
                setTimeout(() => {
                  emojiPickerOpenedAt.current = Date.now()
                  setEmojiPickerOpen(true)
                }, 150)
              }}
            >
              <SmilePlus />
              <span>{t.sidebar.changeEmoji}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <Trash2 />
              <span>{t.sidebar.deleteFolder}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <CollapsibleContent>
          <SidebarMenuSub>
            {folder.items.map((item) => (
              <BookmarkMenuItem
                bookmark={item}
                folderId={folder.id}
                key={item.id}
                onDelete={(e) => onDeleteBookmark(e, item.id)}
                t={t}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function BookmarkMenuItem({
  bookmark,
  folderId,
  onDelete,
  t,
}: {
  bookmark: { id: string; title: string }
  folderId: string
  onDelete: (e: React.MouseEvent) => void
  t: ReturnType<typeof useT>
}) {
  const [open, setOpen] = useState(false)
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: `bookmark-${bookmark.id}`,
    data: { type: "bookmark", bookmarkId: bookmark.id, folderId, title: bookmark.title },
    disabled: false,
  })

  return (
    <SidebarMenuSubItem
      onContextMenu={(e) => {
        e.preventDefault()
        setOpen(true)
      }}
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.5 : undefined }}
    >
      <SidebarMenuSubButton asChild>
        <Link href={`/bookmark/${bookmark.id}`}>
          <span className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="size-3 text-muted-foreground" />
          </span>
          <span>{bookmark.title}</span>
        </Link>
      </SidebarMenuSubButton>
      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction className="-right-5 opacity-0 group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:opacity-100 data-[state=open]:opacity-100">
            <MoreHorizontal className="size-3" />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 />
            <span>{t.sidebar.deleteBookmark}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuSubItem>
  )
}
