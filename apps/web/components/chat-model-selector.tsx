"use client"

import { Check } from "lucide-react"
import { useState } from "react"
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector"
import { PromptInputButton } from "@/components/ai-elements/prompt-input"
import { chatModels } from "@/lib/ai/models"

export function ChatModelSelector({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string
  onModelChange: (modelId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedModel = chatModels.find((m) => m.id === selectedModelId)

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <PromptInputButton size="sm" tooltip="选择模型">
          {selectedModel && <ModelSelectorLogo provider={selectedModel.provider} />}
          <span className="text-xs">{selectedModel?.name ?? "选择模型"}</span>
        </PromptInputButton>
      </ModelSelectorTrigger>
      <ModelSelectorContent title="选择模型">
        <ModelSelectorInput placeholder="搜索模型..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>未找到模型</ModelSelectorEmpty>
          <ModelSelectorGroup>
            {chatModels.map((model) => (
              <ModelSelectorItem
                key={model.id}
                onSelect={() => {
                  onModelChange(model.id)
                  setOpen(false)
                }}
                value={model.id}
              >
                <ModelSelectorLogo provider={model.provider} />
                <ModelSelectorName>{model.name}</ModelSelectorName>
                <span className="text-muted-foreground text-xs">{model.description}</span>
                {model.id === selectedModelId && <Check className="ml-auto size-4" />}
              </ModelSelectorItem>
            ))}
          </ModelSelectorGroup>
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  )
}
