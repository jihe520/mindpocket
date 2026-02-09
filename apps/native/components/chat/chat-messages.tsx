import type { ChatStatus, UIMessage } from "ai"
import { useRef } from "react"
import { ActivityIndicator, FlatList, Text, View } from "react-native"
import { ChatMessageBubble } from "./chat-message-bubble"

interface ChatMessagesProps {
  messages: UIMessage[]
  status: ChatStatus
  error?: Error | undefined
}

export function ChatMessages({ messages, status, error }: ChatMessagesProps) {
  const flatListRef = useRef<FlatList>(null)
  const isStreaming = status === "streaming" || status === "submitted"

  return (
    <FlatList
      className="flex-1 px-4"
      contentContainerStyle={{ paddingVertical: 16 }}
      data={messages}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<View className="flex-1 items-center justify-center pt-20" />}
      ListFooterComponent={
        <>
          {isStreaming && messages.at(-1)?.role === "user" && (
            <View className="mb-3 self-start">
              <ActivityIndicator color="#737373" size="small" />
            </View>
          )}
          {error && (
            <View className="mb-3 self-start rounded-2xl rounded-bl-sm bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-500">出错了: {error.message}</Text>
            </View>
          )}
        </>
      }
      onContentSizeChange={() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }}
      ref={flatListRef}
      renderItem={({ item }) => <ChatMessageBubble message={item} />}
    />
  )
}
