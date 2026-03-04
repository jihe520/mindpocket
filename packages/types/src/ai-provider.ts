/**
 * AI provider type definitions
 */

export const AI_PROVIDER_TYPES = ["chat", "embedding"] as const

export type AiProviderType = (typeof AI_PROVIDER_TYPES)[number]

/**
 * User configured AI provider
 */
export interface AiProvider {
  id: string
  name: string
  type: AiProviderType
  baseUrl: string
  modelId: string
  isDefault: boolean
}

/**
 * Backward-compatible alias used by chat model selector.
 */
export type ChatModel = AiProvider
