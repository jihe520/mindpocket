"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useT } from "@/lib/i18n"
import { useBookmarkStore, useFolderStore } from "@/stores"

function formatTemplate(template: string, title: string) {
  return template.replace("{title}", title)
}

interface DeleteBookmarkOptions {
  id: string
  title: string
  onSuccess?: () => void
}

export function useBookmarkDelete() {
  const t = useT()
  const deleteBookmarkFromStore = useBookmarkStore((state) => state.deleteBookmark)
  const folders = useFolderStore((state) => state.folders)
  const removeBookmarkFromFolder = useFolderStore((state) => state.removeBookmarkFromFolder)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteBookmark = useCallback(
    async ({ id, title, onSuccess }: DeleteBookmarkOptions) => {
      if (isDeleting) {
        return false
      }

      setIsDeleting(true)
      setError(null)

      const folderIds = folders
        .filter((folder) => folder.items.some((item) => item.id === id))
        .map((folder) => folder.id)

      const success = await deleteBookmarkFromStore(id)

      if (success) {
        for (const folderId of folderIds) {
          removeBookmarkFromFolder(folderId, id)
        }
        toast.success(formatTemplate(t.bookmark.deleteSuccess, title))
        onSuccess?.()
      } else {
        setError(t.bookmark.deleteFailed)
        toast.error(t.bookmark.deleteFailed)
      }

      setIsDeleting(false)
      return success
    },
    [deleteBookmarkFromStore, folders, isDeleting, removeBookmarkFromFolder, t.bookmark]
  )

  return {
    deleteBookmark,
    error,
    isDeleting,
    resetError: () => setError(null),
  }
}

