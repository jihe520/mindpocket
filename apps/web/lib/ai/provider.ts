import { gateway } from "ai"
import { chatModels, DEFAULT_CHAT_MODEL } from "./models"

export function getChatModel(modelId?: string) {
  const selectedId = modelId ?? DEFAULT_CHAT_MODEL
  const isValid = chatModels.some((m) => m.id === selectedId)
  return gateway(isValid ? selectedId : DEFAULT_CHAT_MODEL)
}

export function getTitleModel() {
  return gateway("openai/gpt-4o-mini")
}
