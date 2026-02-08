export const DEFAULT_CHAT_MODEL = "openai/gpt-4o-mini"

export interface ChatModel {
  id: string
  name: string
  provider: string
  description: string
}

export const chatModels: ChatModel[] = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "快速且经济，适合日常任务",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI 最强多模态模型",
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    description: "速度与智能的最佳平衡",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "deepseek",
    description: "高性价比中文对话模型",
  },
]
