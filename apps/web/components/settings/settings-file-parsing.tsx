"use client"

import type { BookmarkType } from "@repo/types"
import { Badge } from "@/components/ui/badge"
import { useT } from "@/lib/i18n"
import { EXTENSION_TYPE_MAP } from "@/lib/ingest/types"

export function SettingsFileParsing() {
  const t = useT()

  // 按类型分组文件扩展名
  const groupedExtensions = Object.entries(EXTENSION_TYPE_MAP).reduce(
    (acc, [ext, type]) => {
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(ext)
      return acc
    },
    {} as Record<BookmarkType, string[]>
  )

  // 定义解析引擎信息
  const engines = [
    {
      name: "MarkItDown",
      description: t.settings.fileParsingEngineMarkItDown,
      extensions: [
        ".pdf",
        ".docx",
        ".doc",
        ".xlsx",
        ".xls",
        ".csv",
        ".html",
        ".htm",
        ".xml",
        ".ipynb",
        ".zip",
      ],
    },
    {
      name: "pdf-parse",
      description: t.settings.fileParsingEnginePdfParse,
      extensions: [".pdf"],
    },
  ]

  // 平台支持信息（bilibili 使用 API 解析，其他需要浏览器）
  const platforms = [
    { id: "wechat", name: t.settings.fileParsingPlatformWechat, requiresBrowser: true },
    { id: "bilibili", name: t.settings.fileParsingPlatformBilibili, requiresBrowser: false },
    { id: "xiaohongshu", name: t.settings.fileParsingPlatformXiaohongshu, requiresBrowser: true },
  ]

  return (
    <div className="space-y-6">
      {/* 文件类型 */}
      <section>
        <h3 className="mb-3 font-medium text-sm">{t.settings.fileParsingTypes}</h3>
        <div className="space-y-2">
          {Object.entries(groupedExtensions).map(([type, extensions]) => (
            <div className="flex items-center gap-3 rounded-lg border px-3 py-2" key={type}>
              <Badge className="shrink-0" variant="secondary">
                {
                  t.settings[
                    `fileParsingType${type.charAt(0).toUpperCase()}${type.slice(1)}` as keyof typeof t.settings
                  ] as string
                }
              </Badge>
              <div className="flex flex-wrap gap-1.5">
                {extensions.map((ext) => (
                  <span className="text-muted-foreground text-xs" key={ext}>
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 解析引擎 */}
      <section>
        <h3 className="mb-3 font-medium text-sm">{t.settings.fileParsingEngines}</h3>
        <div className="space-y-3">
          {engines.map((engine) => (
            <div className="space-y-2 rounded-lg border px-3 py-2" key={engine.name}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{engine.name}</span>
              </div>
              <p className="text-muted-foreground text-xs">{engine.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {engine.extensions.map((ext) => (
                  <Badge key={ext} variant="outline">
                    {ext}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 平台支持 */}
      <section>
        <h3 className="mb-3 font-medium text-sm">{t.settings.fileParsingPlatforms}</h3>
        <div className="space-y-2">
          {platforms.map((platform) => (
            <div
              className="flex items-center justify-between rounded-lg border px-3 py-2"
              key={platform.id}
            >
              <span className="text-sm">{platform.name}</span>
              <Badge variant={platform.requiresBrowser ? "default" : "secondary"}>
                {platform.requiresBrowser
                  ? t.settings.fileParsingBrowserRequired
                  : t.settings.fileParsingAPIBased}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
