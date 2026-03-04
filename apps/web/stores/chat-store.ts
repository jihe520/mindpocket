/**
 * Chat store - manages chat history and AI model selection
 * Partial persistence (selectedModelId, useKnowledgeBase)
 * Includes 5-minute cache for chat list
 */

import type { ChatItem } from "@repo/types"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { createPersistConfig } from "./middleware/persist-config"

interface ChatState {
  chats: ChatItem[]
  isLoading: boolean
  lastFetch: number | null
  selectedModelId: string
  useKnowledgeBase: boolean
  useFolderTools: boolean

  // Actions
  fetchChats: (force?: boolean) => Promise<void>
  deleteChat: (chatId: string) => void
  setSelectedModelId: (modelId: string) => void
  setUseKnowledgeBase: (use: boolean) => void
  setUseFolderTools: (use: boolean) => void
  reset: () => void
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const initialState = {
  chats: [],
  isLoading: false,
  lastFetch: null,
  selectedModelId: "",
  useKnowledgeBase: true,
  useFolderTools: true,
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        fetchChats: async (force = false) => {
          const { lastFetch, isLoading } = get()

          // Check cache validity
          if (!force && lastFetch && Date.now() - lastFetch < CACHE_TTL) {
            return
          }

          // Prevent concurrent fetches
          if (isLoading) {
            return
          }

          set({ isLoading: true })
          try {
            const res = await fetch("/api/history?limit=20")
            if (res.ok) {
              const data = await res.json()
              set({
                chats: data.chats,
                lastFetch: Date.now(),
                isLoading: false,
              })
            } else {
              set({ isLoading: false })
            }
          } catch {
            set({ isLoading: false })
          }
        },

        deleteChat: (chatId) =>
          set((state) => ({
            chats: state.chats.filter((c) => c.id !== chatId),
          })),

        setSelectedModelId: (modelId) => set({ selectedModelId: modelId }),

        setUseKnowledgeBase: (use) => set({ useKnowledgeBase: use }),
        setUseFolderTools: (use) => set({ useFolderTools: use }),

        reset: () => set(initialState),
      }),
      createPersistConfig("chat", {
        partialize: (state) =>
          ({
            selectedModelId: state.selectedModelId,
            useKnowledgeBase: state.useKnowledgeBase,
            useFolderTools: state.useFolderTools,
          }) as ChatState,
      })
    ),
    { name: "ChatStore" }
  )
)
