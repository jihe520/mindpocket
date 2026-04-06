"use client"

import { Bot, FileText, Globe, Palette, User, Video } from "lucide-react"
import { useState } from "react"
import { SettingsAccount } from "@/components/settings/settings-account"
import { SettingsAiModel } from "@/components/settings/settings-ai-model"
import { SettingsAppearance } from "@/components/settings/settings-appearance"
import { SettingsBilibili } from "@/components/settings/settings-bilibili"
import { SettingsFileParsing } from "@/components/settings/settings-file-parsing"
import { SettingsLanguage } from "@/components/settings/settings-language"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type SettingsTab = "account" | "appearance" | "language" | "ai-model" | "file-parsing" | "bilibili"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function SettingsDialog({ open, onOpenChange, user }: SettingsDialogProps) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<SettingsTab>("account")

  const tabs = [
    { value: "account" as const, label: t.settings.account, icon: User },
    { value: "ai-model" as const, label: t.settings.aiModel, icon: Bot },
    { value: "file-parsing" as const, label: t.settings.fileParsing, icon: FileText },
    { value: "bilibili" as const, label: "Bilibili", icon: Video },
    { value: "appearance" as const, label: t.settings.appearance, icon: Palette },
    { value: "language" as const, label: t.settings.language, icon: Globe },
  ]

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[640px]" showCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>{t.settings.title}</DialogTitle>
          <DialogDescription>{t.settings.title}</DialogDescription>
        </DialogHeader>
        <div className="flex h-[480px]">
          <nav className="w-[180px] space-y-1 border-r bg-muted/30 p-4">
            <h2 className="mb-3 px-2 font-semibold text-lg">{t.settings.title}</h2>
            {tabs.map((tab) => (
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  activeTab === tab.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                type="button"
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "account" && <SettingsAccount user={user} />}
            {activeTab === "ai-model" && <SettingsAiModel />}
            {activeTab === "file-parsing" && <SettingsFileParsing />}
            {activeTab === "bilibili" && <SettingsBilibili />}
            {activeTab === "appearance" && <SettingsAppearance />}
            {activeTab === "language" && <SettingsLanguage />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
