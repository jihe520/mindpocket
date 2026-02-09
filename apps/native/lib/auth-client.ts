import { expoClient } from "@better-auth/expo/client"
import { createAuthClient } from "better-auth/react"
import { getItem, setItem } from "expo-secure-store"

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  plugins: [
    expoClient({
      scheme: "mindpocket",
      storagePrefix: "mindpocket",
      storage: { getItem, setItem },
    }),
  ],
})
