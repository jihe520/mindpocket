"use client"

import type { ChatStatus } from "@ai-sdk/react"
import { BookOpen } from "lucide-react"
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"
import { ChatModelSelector } from "@/components/chat-model-selector"

function AttachmentPreviewList() {
  const { files, remove } = usePromptInputAttachments()

  if (files.length === 0) {
    return null
  }

  return (
    <PromptInputHeader>
      <Attachments>
        {files.map((file) => (
          <Attachment data={file} key={file.id} onRemove={() => remove(file.id)}>
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  )
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  status,
  stop,
  selectedModelId,
  onModelChange,
  useKnowledgeBase,
  onKnowledgeBaseChange,
}: {
  input: string
  setInput: (value: string) => void
  onSubmit: (message: PromptInputMessage) => void
  status: ChatStatus
  stop: () => void
  selectedModelId: string
  onModelChange: (modelId: string) => void
  useKnowledgeBase: boolean
  onKnowledgeBaseChange: (value: boolean) => void
}) {
  return (
    <div className="w-full px-4 pb-4">
      <PromptInput accept="image/*" multiple onSubmit={onSubmit}>
        <AttachmentPreviewList />
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            value={input}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments label="添加图片" />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <ChatModelSelector onModelChange={onModelChange} selectedModelId={selectedModelId} />
            <PromptInputButton
              className={useKnowledgeBase ? "bg-primary/10 text-primary" : ""}
              onClick={() => onKnowledgeBaseChange(!useKnowledgeBase)}
              size="sm"
              tooltip="知识库"
            >
              <BookOpen className="size-4" />
              <span className="text-xs">知识库</span>
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit onStop={stop} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}
