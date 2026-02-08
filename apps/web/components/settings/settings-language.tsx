"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Locale, useLocale } from "@/lib/i18n"

export function SettingsLanguage() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-sm">{t.settings.language}</h3>
      </div>
      <Select onValueChange={(v) => setLocale(v as Locale)} value={locale}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t.settings.selectLanguage} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zh">{t.settings.languageZh}</SelectItem>
          <SelectItem value="en">{t.settings.languageEn}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
