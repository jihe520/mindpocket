import { Stack, useRouter } from "expo-router"
import { ShareIntentProvider, useShareIntent } from "expo-share-intent"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { Alert } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { saveBookmark } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import "../global.css"

function ShareIntentHandler() {
  const router = useRouter()
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent()
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (!(hasShareIntent && shareIntent)) {
      return
    }

    if (!session?.user) {
      resetShareIntent()
      Alert.alert("未登录", "请先登录后再分享", [
        { text: "去登录", onPress: () => router.push("/login") },
        { text: "取消" },
      ])
      return
    }

    const url = shareIntent.webUrl || shareIntent.text
    if (!url) {
      resetShareIntent()
      return
    }

    saveBookmark(url, shareIntent.title || undefined)
      .then(() => {
        Alert.alert("保存成功", "已添加到 MindPocket")
      })
      .catch(() => {
        Alert.alert("保存失败", "请稍后重试")
      })
      .finally(() => {
        resetShareIntent()
      })
  }, [hasShareIntent, shareIntent, session, resetShareIntent, router])

  return null
}

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <ShareIntentHandler />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="chat/[id]"
              options={{
                headerShown: true,
                title: "对话",
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="login"
              options={{
                presentation: "modal",
                title: "登录",
              }}
            />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ShareIntentProvider>
  )
}
