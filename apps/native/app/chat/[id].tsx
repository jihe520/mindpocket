import { useChat } from "@ai-sdk/react"
import { useLocalSearchParams } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ChatInputBar } from "@/components/chat/chat-input-bar"
import { ChatMessages } from "@/components/chat/chat-messages"
import { createChatTransport } from "@/lib/chat"

export default function ChatScreen() {
  const { id, initialMessage, selectedModel } = useLocalSearchParams<{
    id: string
    initialMessage?: string
    selectedModel?: string
  }>()
  const insets = useSafeAreaInsets()
  const [inputText, setInputText] = useState("")
  const hasSentInitial = useRef(false)

  const { messages, status, error, sendMessage, stop } = useChat({
    id,
    transport: createChatTransport(),
    experimental_throttle: 50,
    chatRequestBody: {
      selectedChatModel: selectedModel || "openai/gpt-4o-mini",
    },
    onError: (err) => {
      Alert.alert("发送失败", err.message || "请稍后重试")
    },
  })

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true
      sendMessage({ text: initialMessage })
    }
  }, [initialMessage, sendMessage])

  const isStreaming = status === "streaming" || status === "submitted"

  const handleSend = () => {
    if (!inputText.trim()) {
      return
    }
    sendMessage({ text: inputText.trim() })
    setInputText("")
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
      keyboardVerticalOffset={90}
    >
      <ChatMessages error={error} messages={messages} status={status} />
      <View style={{ paddingBottom: insets.bottom }}>
        <ChatInputBar
          isStreaming={isStreaming}
          onChangeText={setInputText}
          onSend={handleSend}
          onStop={stop}
          value={inputText}
        />
      </View>
    </KeyboardAvoidingView>
  )
}
