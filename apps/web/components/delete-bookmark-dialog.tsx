"use client"

import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useT } from "@/lib/i18n"

interface DeleteBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  isDeleting: boolean
  error: string | null
  onConfirm: () => void
}

function formatTemplate(template: string, title: string) {
  return template.replace("{title}", title)
}

export function DeleteBookmarkDialog({
  open,
  onOpenChange,
  title,
  isDeleting,
  error,
  onConfirm,
}: DeleteBookmarkDialogProps) {
  const t = useT()

  return (
    <Dialog onOpenChange={(nextOpen) => !isDeleting && onOpenChange(nextOpen)} open={open}>
      <DialogContent
        className="sm:max-w-sm"
        onEscapeKeyDown={(event) => {
          if (isDeleting) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (isDeleting) {
            event.preventDefault()
          }
        }}
        showCloseButton={!isDeleting}
      >
        <DialogHeader>
          <DialogTitle>{t.bookmark.deleteTitle}</DialogTitle>
          <DialogDescription>
            {formatTemplate(t.bookmark.deleteDescription, title)}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button disabled={isDeleting} onClick={() => onOpenChange(false)} variant="outline">
            {t.common.cancel}
          </Button>
          <Button disabled={isDeleting} onClick={onConfirm} variant="destructive">
            {isDeleting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            {t.bookmark.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
