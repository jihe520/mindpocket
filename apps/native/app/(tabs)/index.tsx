import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { HistoryDrawer } from "@/components/drawer/history-drawer"
import { SearchInput } from "@/components/home/search-input"
import { Toolbar } from "@/components/home/toolbar"
import { TrendingCard } from "@/components/home/trending-card"
import { getGreeting } from "@/lib/utils"

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState("openai/gpt-4o-mini")
  const greeting = getGreeting()

  const handleSubmit = (text: string) => {
    if (!text.trim()) {
      return
    }
    const chatId = Date.now().toString(36) + Math.random().toString(36).slice(2)
    router.push({
      pathname: "/chat/[id]",
      params: { id: chatId, initialMessage: text, selectedModel },
    })
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-12 flex-row items-center px-4">
        <Pressable onPress={() => setDrawerOpen(true)}>
          <Ionicons color="#333" name="menu-outline" size={24} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting */}
        <View className="items-center px-4 pb-6 pt-16">
          <Text className="text-3xl font-bold text-neutral-800">{greeting}</Text>
          <Text className="mt-2 text-base text-neutral-400">有什么可以帮您的吗？？</Text>
        </View>

        {/* Search Input */}
        <SearchInput onSubmit={handleSubmit} />

        {/* Toolbar */}
        <Toolbar onModelChange={setSelectedModel} selectedModel={selectedModel} />

        {/* Trending Topics */}
        <TrendingCard />
      </ScrollView>

      {/* Drawer */}
      <HistoryDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </View>
  )
}
