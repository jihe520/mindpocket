"use client"

import type { UIMessage } from "ai"
import { Chat } from "@/components/chat"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function ChatClient({
  id,
  chatTitle,
  initialMessages,
}: {
  id: string
  chatTitle: string
  initialMessages: UIMessage[]
}) {
  return (
    <>
      <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
          <span className="line-clamp-1 text-sm">{chatTitle}</span>
        </div>
      </header>
      <Chat autoResume id={id} initialMessages={initialMessages} />
    </>
  )
}
