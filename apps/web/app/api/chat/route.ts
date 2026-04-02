// AI 聊天 API，处理流式对话请求
import { createAgentUIStreamResponse, generateId, type UIMessage } from "ai"
import { headers } from "next/headers"
import { after } from "next/server"
import { createResumableStreamContext } from "resumable-stream"
import { getDefaultProvider, getProviderWithDecryptedKey } from "@/db/queries/ai-provider"
import {
  clearActiveStreamId,
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitle,
} from "@/db/queries/chat"
import { createChatAgent } from "@/lib/ai/agents/chat-agent"
import { generateTitleFromUserMessage, systemPrompt } from "@/lib/ai/prompts"
import { getChatModel } from "@/lib/ai/provider"
import { auth } from "@/lib/auth"
import { corsPreflight, withCors } from "@/lib/cors"

export const dynamic = "force-dynamic"

export const maxDuration = 60

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after })
  } catch {
    return null
  }
}

export function OPTIONS(req: Request) {
  return corsPreflight(req)
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user!.id

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return withCors(req, new Response("Missing id", { status: 400 }))
  }

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== userId) {
    return withCors(req, new Response("Not found", { status: 404 }))
  }

  const dbMessages = await getMessagesByChatId({ id })

  return withCors(
    req,
    Response.json({
      chat: {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt.toISOString(),
      },
      messages: dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts,
        createdAt: msg.createdAt.toISOString(),
      })),
    })
  )
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user!.id

  const {
    id,
    messages,
    selectedChatModel,
    useKnowledgeBase = true,
    useFolderTools = true,
  }: {
    id: string
    messages: UIMessage[]
    selectedChatModel?: string
    useKnowledgeBase?: boolean
    useFolderTools?: boolean
  } = await req.json()

  // Resolve chat model config
  let config: Awaited<ReturnType<typeof getProviderWithDecryptedKey>> = null
  if (selectedChatModel) {
    config = await getProviderWithDecryptedKey(selectedChatModel, userId)
  }
  if (!config) {
    config = await getDefaultProvider(userId, "chat")
  }
  if (!config) {
    return withCors(req, Response.json({ error: "no_chat_model" }, { status: 400 }))
  }

  const userMessage = messages.at(-1)
  if (!userMessage || userMessage.role !== "user") {
    return withCors(req, new Response("Invalid message", { status: 400 }))
  }

  const existingChat = await getChatById({ id })
  const isNewChat = !existingChat

  if (isNewChat) {
    await saveChat({ id, userId, title: "新对话" })
  }

  await saveMessages({
    messages: [
      {
        id: userMessage.id,
        chatId: id,
        role: userMessage.role,
        parts: userMessage.parts,
        createdAt: new Date(),
      },
    ],
  })

  const model = getChatModel(config)
  const agent = createChatAgent({
    model,
    systemPrompt,
    userId,
    useKnowledgeBase,
    useFolderTools,
    onFinish: async ({ response }) => {
      try {
        const assistantMessages = response.messages.filter(
          (message) => message.role === "assistant"
        )
        if (assistantMessages.length > 0) {
          const lastMessage = assistantMessages.at(-1)!
          await saveMessages({
            messages: [
              {
                id: generateId(),
                chatId: id,
                role: "assistant",
                parts: lastMessage.content,
                createdAt: new Date(),
              },
            ],
          })
        }

        if (isNewChat) {
          const textPart = userMessage.parts.find((part) => part.type === "text")
          if (textPart && "text" in textPart) {
            generateTitleFromUserMessage({ message: textPart.text, model }).then(async (title) => {
              await updateChatTitle({ chatId: id, title })
            })
          }
        }
      } finally {
        await clearActiveStreamId({ chatId: id })
      }
    },
    onStepFinish: (step) => {
      if (step.toolCalls.length > 0) {
        const toolNames = step.toolCalls.map((call) => call.toolName).join(",")
        console.info("[chat-agent] tools", {
          chatId: id,
          toolNames,
          stepUsage: step.usage.totalTokens,
        })
      }
    },
  })

  return withCors(
    req,
    await createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      sendReasoning: true,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return
        }
        try {
          const streamContext = getStreamContext()
          if (streamContext) {
            const streamId = generateId()
            await createStreamId({ streamId, chatId: id })
            await streamContext.createNewResumableStream(streamId, () => sseStream)
          }
        } catch {
          // ignore redis errors
        }
      },
    })
  )
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session!.user!.id

  const { id }: { id: string } = await req.json()

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== userId) {
    return withCors(req, new Response("Not found", { status: 404 }))
  }

  await deleteChatById({ id })
  return withCors(req, new Response("OK", { status: 200 }))
}
