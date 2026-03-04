"use client"

import type { AiProvider } from "@repo/types"
import { Bot, Check, Loader2, Pencil, Plug, Plus, Star, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useT } from "@/lib/i18n"

interface FormData {
  name: string
  type: AiProvider["type"]
  baseUrl: string
  apiKey: string
  modelId: string
}

const emptyForm: FormData = {
  name: "",
  type: "chat",
  baseUrl: "",
  apiKey: "",
  modelId: "",
}

export function SettingsAiModel() {
  const t = useT()
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-providers")
      if (res.ok) {
        setProviders(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleSave = async () => {
    if (!(form.name && form.baseUrl && form.apiKey && form.modelId)) {
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const body: Record<string, string> = {
          name: form.name,
          baseUrl: form.baseUrl,
          modelId: form.modelId,
        }
        if (form.apiKey !== "••••••••") {
          body.apiKey = form.apiKey
        }
        const res = await fetch(`/api/ai-providers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          throw new Error("Failed to update")
        }
      } else {
        const res = await fetch("/api/ai-providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          throw new Error("Failed to create")
        }
      }
      toast.success(t.settings.aiModelSaved)
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await fetchProviders()
    } catch {
      toast.error(t.settings.aiModelTestFailed)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/ai-providers/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(t.settings.aiModelDeleted)
      await fetchProviders()
    }
  }

  const handleSetDefault = async (id: string) => {
    const res = await fetch(`/api/ai-providers/${id}/default`, { method: "POST" })
    if (res.ok) {
      await fetchProviders()
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const res = await fetch(`/api/ai-providers/${id}/test`, { method: "POST" })
      if (res.ok) {
        toast.success(t.settings.aiModelTestSuccess)
      } else {
        const data = await res.json()
        toast.error(t.settings.aiModelTestFailed, { description: data.error })
      }
    } catch {
      toast.error(t.settings.aiModelTestFailed)
    } finally {
      setTestingId(null)
    }
  }

  const handleEdit = (provider: AiProvider) => {
    setEditingId(provider.id)
    setForm({
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      apiKey: "••••••••••••••••••••••••",
      modelId: provider.modelId,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const chatProviders = providers.filter((p) => p.type === "chat")
  const embeddingProviders = providers.filter((p) => p.type === "embedding")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chat Models */}
      <section>
        <h3 className="mb-3 font-medium text-sm">{t.settings.aiModelTypeChat}</h3>
        {chatProviders.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t.settings.aiModelEmpty}</p>
        ) : (
          <div className="space-y-2">
            {chatProviders.map((p) => (
              <ProviderCard
                key={p.id}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
                onTest={handleTest}
                provider={p}
                t={t}
                testingId={testingId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Embedding Models */}
      <section>
        <h3 className="mb-3 font-medium text-sm">{t.settings.aiModelTypeEmbedding}</h3>
        {embeddingProviders.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t.settings.aiModelEmpty}</p>
        ) : (
          <div className="space-y-2">
            {embeddingProviders.map((p) => (
              <ProviderCard
                key={p.id}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
                onTest={handleTest}
                provider={p}
                t={t}
                testingId={testingId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Form */}
      {showForm ? (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              {editingId ? t.settings.aiModelEdit : t.settings.aiModelAdd}
            </h4>
            <Button onClick={handleCancel} size="sm" variant="ghost">
              <X className="size-4" />
            </Button>
          </div>

          {!editingId && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t.settings.aiModelType}</Label>
              <Select
                onValueChange={(v) => setForm({ ...form, type: v as "chat" | "embedding" })}
                value={form.type}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">{t.settings.aiModelTypeChat}</SelectItem>
                  <SelectItem value="embedding">{t.settings.aiModelTypeEmbedding}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">{t.settings.aiModelName}</Label>
            <Input
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My OpenRouter"
              value={form.name}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t.settings.aiModelBaseUrl}</Label>
            <Input
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              value={form.baseUrl}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t.settings.aiModelApiKey}</Label>
            <Input
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-..."
              type="password"
              value={form.apiKey}
            />
            <p className="text-muted-foreground text-xs">{t.settings.aiModelApiKeyHint}</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t.settings.aiModelModelId}</Label>
            <Input
              onChange={(e) => setForm({ ...form, modelId: e.target.value })}
              placeholder="gpt-4o"
              value={form.modelId}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button disabled={saving} onClick={handleSave} size="sm">
              {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
              {t.common.save}
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline">
              {t.settings.aiModelCancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="w-full"
          onClick={() => {
            setForm(emptyForm)
            setEditingId(null)
            setShowForm(true)
          }}
          size="sm"
          variant="outline"
        >
          <Plus className="mr-1 size-4" />
          {t.settings.aiModelAdd}
        </Button>
      )}
    </div>
  )
}

function ProviderCard({
  provider,
  t,
  testingId,
  onEdit,
  onSetDefault,
  onTest,
  onDelete,
}: {
  provider: AiProvider
  t: ReturnType<typeof useT>
  testingId: string | null
  onEdit: (p: AiProvider) => void
  onSetDefault: (id: string) => void
  onTest: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Bot className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{provider.name}</span>
          {provider.isDefault && (
            <span className="flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-primary text-xs">
              <Check className="size-3" />
              {t.settings.aiModelDefault}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-muted-foreground text-xs">
          {provider.modelId} · {(() => {
            try {
              return new URL(provider.baseUrl).host
            } catch {
              return provider.baseUrl
            }
          })()}
        </p>
      </div>
      <div className="ml-2 flex shrink-0 items-center">
        {!provider.isDefault && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-7"
                onClick={() => onSetDefault(provider.id)}
                size="icon"
                variant="ghost"
              >
                <Star className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.settings.aiModelSetDefault}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="size-7"
              disabled={testingId === provider.id}
              onClick={() => onTest(provider.id)}
              size="icon"
              variant="ghost"
            >
              {testingId === provider.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plug className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.settings.aiModelTest}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="size-7" onClick={() => onEdit(provider)} size="icon" variant="ghost">
              <Pencil className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.settings.aiModelEdit}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="size-7"
              onClick={() => onDelete(provider.id)}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.settings.aiModelDelete}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
