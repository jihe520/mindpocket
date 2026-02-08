import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai"
import { after, headers } from "next/server"
import { createResumableStreamContext } from "resumable-stream"
import { z } from "zod"
import {
  clearActiveStreamId,
  createStreamId,
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  updateChatTitle,
} from "@/db/queries/chat"
import { findRelevantContent } from "@/lib/ai/embedding"
import { generateTitleFromUserMessage, systemPrompt } from "@/lib/ai/prompts"
import { getChatModel } from "@/lib/ai/provider"
import { auth } from "@/lib/auth"

export const maxDuration = 60

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after })
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const {
    id,
    messages,
    selectedChatModel,
    useKnowledgeBase = true,
  }: {
    id: string
    messages: UIMessage[]
    selectedChatModel?: string
    useKnowledgeBase?: boolean
  } = await req.json()

  const userId = session.user.id

  const userMessage = messages.at(-1)
  if (!userMessage || userMessage.role !== "user") {
    return new Response("Invalid message", { status: 400 })
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

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: getChatModel(selectedChatModel),
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools: useKnowledgeBase
          ? {
              getInformation: tool({
                description:
                  "从用户的书签知识库中检索相关信息来回答问题。当用户提问时，优先使用此工具搜索知识库。",
                parameters: z.object({
                  question: z.string().describe("用于搜索知识库的查询语句"),
                }),
                execute: async ({ question }) => findRelevantContent(question),
              }),
            }
          : undefined,
        stopWhen: stepCountIs(useKnowledgeBase ? 3 : 1),
        onFinish: async ({ response }) => {
          const assistantMessages = response.messages.filter((m) => m.role === "assistant")
          if (assistantMessages.length > 0) {
            const lastMsg = assistantMessages.at(-1)!
            await saveMessages({
              messages: [
                {
                  id: generateId(),
                  chatId: id,
                  role: "assistant",
                  parts: lastMsg.content,
                  createdAt: new Date(),
                },
              ],
            })
          }

          await clearActiveStreamId({ chatId: id })
        },
      })

      result.consumeStream()

      writer.merge(result.toUIMessageStream({ sendReasoning: true }))

      if (isNewChat) {
        const textPart = userMessage.parts.find((p) => p.type === "text")
        if (textPart && "text" in textPart) {
          generateTitleFromUserMessage({ message: textPart.text }).then(async (title) => {
            await updateChatTitle({ chatId: id, title })
            writer.write({
              type: "data",
              data: [{ type: "title", content: title }],
            })
          })
        }
      }
    },
  })

  return createUIMessageStreamResponse({
    stream,
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
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { id }: { id: string } = await req.json()

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== session.user.id) {
    return new Response("Not found", { status: 404 })
  }

  await deleteChatById({ id })
  return new Response("OK", { status: 200 })
}
