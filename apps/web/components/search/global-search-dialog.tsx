"use client"

import { SEARCH_MODES, type SearchMatchReason, type SearchResultItem } from "@repo/types"
import { Globe, Hash, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useT } from "@/lib/i18n"
import { useUIStore } from "@/stores"

export function GlobalSearchDialog() {
  const router = useRouter()
  const t = useT()
  const { searchDialog, closeSearchDialog, setSearchMode } = useUIStore()
  const { open, mode } = searchDialog
  const [input, setInput] = useState("")
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const query = input.trim()

  const modeLabels = useMemo(
    () => ({
      keyword: t.searchDialog.modeKeyword,
      semantic: t.searchDialog.modeSemantic,
      hybrid: t.searchDialog.modeHybrid,
    }),
    [t]
  )

  useEffect(() => {
    if (!open) {
      setInput("")
      setResults([])
      setFallbackReason(null)
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    if (!query) {
      setResults([])
      setIsLoading(false)
      setFallbackReason(null)
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      return
    }

    const controller = new AbortController()
    abortControllerRef.current?.abort()
    abortControllerRef.current = controller

    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({ q: query, mode, limit: "20" })
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          setResults([])
          setFallbackReason(null)
          return
        }

        const data = (await response.json()) as {
          items: SearchResultItem[]
          fallbackReason?: string
        }

        setResults(data.items)
        setFallbackReason(data.fallbackReason ?? null)
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([])
          setFallbackReason(null)
        }
      } finally {
        setIsLoading(false)
      }
    }, 280)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [mode, open, query])

  return (
    <CommandDialog
      className="max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[760px]"
      description={t.searchDialog.description}
      onOpenChange={closeSearchDialog}
      open={open}
      title={t.searchDialog.title}
    >
      <Command className="bg-transparent" shouldFilter={false}>
        <div className="flex items-center gap-2 border-b border-border/60 pr-10 **:data-[slot=command-input-wrapper]:flex-1 **:data-[slot=command-input-wrapper]:border-none">
          <CommandInput
            onValueChange={(nextValue) => {
              if (nextValue.startsWith("/k ")) {
                setSearchMode("keyword")
                setInput(nextValue.slice(3))
                return
              }
              if (nextValue.startsWith("/s ")) {
                setSearchMode("semantic")
                setInput(nextValue.slice(3))
                return
              }
              if (nextValue.startsWith("/h ")) {
                setSearchMode("hybrid")
                setInput(nextValue.slice(3))
                return
              }
              setInput(nextValue)
            }}
            placeholder={t.searchDialog.placeholder}
            value={input}
          />
          <div className="inline-flex shrink-0 rounded-lg border border-border/70 bg-muted/40 p-0.5">
            {SEARCH_MODES.map((itemMode) => (
              <button
                className={
                  itemMode === mode
                    ? "rounded-md bg-background px-2.5 py-1 font-medium text-xs shadow-sm"
                    : "rounded-md px-2.5 py-1 text-muted-foreground text-xs transition hover:text-foreground"
                }
                key={itemMode}
                onClick={() => setSearchMode(itemMode)}
                type="button"
              >
                {modeLabels[itemMode]}
              </button>
            ))}
          </div>
        </div>

        <CommandList className="max-h-[58vh]">
          {!query && (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm">
              {t.searchDialog.emptyIdle}
            </div>
          )}

          {query && isLoading && (
            <div className="flex items-center gap-2 px-4 py-10 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t.searchDialog.loading}
            </div>
          )}

          {query && !isLoading && fallbackReason && (
            <div className="px-4 py-2 text-amber-500 text-xs">{t.searchDialog.fallbackHint}</div>
          )}

          {!isLoading && query && (
            <CommandEmpty>
              <div className="space-y-1">
                <p>{t.searchDialog.emptyResult}</p>
                <p className="text-muted-foreground text-xs">{t.searchDialog.emptySuggestion}</p>
              </div>
            </CommandEmpty>
          )}

          {!isLoading && results.length > 0 && (
            <CommandGroup heading={t.searchDialog.resultGroupTitle}>
              {results.map((item) => (
                <CommandItem
                  className="items-start gap-3 rounded-md px-3 py-3"
                  key={item.id}
                  onSelect={() => {
                    closeSearchDialog()
                    router.push(`/bookmark/${item.id}`)
                  }}
                  value={`${item.id}-${item.title}`}
                >
                  <div className="pt-0.5">
                    {mode === "semantic" || item.matchReasons.includes("semantic") ? (
                      <Sparkles className="size-4 text-emerald-500" />
                    ) : (
                      <Hash className="size-4 text-sky-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="truncate font-medium text-sm">{item.title}</div>
                    {item.description && (
                      <p className="line-clamp-1 text-muted-foreground text-xs">
                        {item.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.matchReasons.map((reason) => (
                        <span
                          className="rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[11px]"
                          key={`${item.id}-${reason}`}
                        >
                          {getReasonLabel(reason, t)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-0.5 text-right text-muted-foreground text-xs">
                    <p>{formatDate(item.createdAt)}</p>
                    {item.url && (
                      <p className="inline-flex items-center gap-1">
                        <Globe className="size-3" />
                        {getDomain(item.url)}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

function getReasonLabel(reason: SearchMatchReason, t: ReturnType<typeof useT>) {
  if (reason === "title") {
    return t.searchDialog.reasonTitle
  }
  if (reason === "description") {
    return t.searchDialog.reasonDescription
  }
  if (reason === "content") {
    return t.searchDialog.reasonContent
  }
  if (reason === "url") {
    return t.searchDialog.reasonUrl
  }
  if (reason === "tag") {
    return t.searchDialog.reasonTag
  }
  return t.searchDialog.reasonSemantic
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return date.toLocaleDateString("zh-CN")
}
