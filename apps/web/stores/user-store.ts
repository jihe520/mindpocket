/**
 * User store - manages user information
 * No persistence (fetched from server)
 */

import type { UserInfo } from "@repo/types"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface UserState {
  userInfo: UserInfo
  isLoading: boolean
  error: string | null

  // Actions
  fetchUser: () => Promise<void>
  setUserInfo: (userInfo: UserInfo) => void
  reset: () => void
}

const initialState = {
  userInfo: { name: "", email: "", avatar: "" },
  isLoading: false,
  error: null,
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      ...initialState,

      fetchUser: async () => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch("/api/user")
          if (res.ok) {
            const data = await res.json()
            set({ userInfo: data, isLoading: false })
          } else {
            set({ error: "Failed to fetch user", isLoading: false })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unknown error",
            isLoading: false,
          })
        }
      },

      setUserInfo: (userInfo) => set({ userInfo }),

      reset: () => set(initialState),
    }),
    { name: "UserStore" }
  )
)
