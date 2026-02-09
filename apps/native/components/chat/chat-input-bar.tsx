import { Ionicons } from "@expo/vector-icons"
import { Pressable, TextInput, View } from "react-native"

interface ChatInputBarProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  isStreaming?: boolean
  onStop?: () => void
}

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  isStreaming,
  onStop,
}: ChatInputBarProps) {
  const isEmpty = !value.trim()

  return (
    <View className="flex-row items-end gap-2 border-t border-neutral-100 bg-white px-4 py-3">
      <TextInput
        className="max-h-24 min-h-[36px] flex-1 rounded-2xl bg-neutral-50 px-4 py-2 text-sm text-neutral-800"
        editable={!isStreaming}
        multiline
        onChangeText={onChangeText}
        onSubmitEditing={onSend}
        placeholder={isStreaming ? "AI 正在回复..." : "输入消息..."}
        placeholderTextColor="#999"
        value={value}
      />
      {isStreaming ? (
        <Pressable
          className="items-center justify-center rounded-full bg-red-500 p-2"
          onPress={onStop}
        >
          <Ionicons color="#fff" name="stop" size={18} />
        </Pressable>
      ) : (
        <Pressable
          className={`items-center justify-center rounded-full p-2 ${
            isEmpty ? "bg-neutral-300" : "bg-neutral-800"
          }`}
          disabled={isEmpty}
          onPress={onSend}
        >
          <Ionicons color="#fff" name="arrow-up" size={18} />
        </Pressable>
      )}
    </View>
  )
}
