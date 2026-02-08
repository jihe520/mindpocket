"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { useT } from "@/lib/i18n"

interface SettingsAccountProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function SettingsAccount({ user }: SettingsAccountProps) {
  const t = useT()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 rounded-lg">
          <AvatarImage alt={user.name} src={user.avatar} />
          <AvatarFallback className="rounded-lg text-lg">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium text-lg">{user.name}</p>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">{t.settings.profileName}</Label>
          <p className="text-sm">{user.name || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">{t.settings.profileEmail}</Label>
          <p className="text-sm">{user.email || "-"}</p>
        </div>
      </div>
    </div>
  )
}
