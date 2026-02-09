import type { UIMessage } from "ai"
import { Text, View } from "react-native"

interface ChatMessageBubbleProps {
  message: UIMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <View className={`mb-3 max-w-[80%] ${isUser ? "self-end" : "self-start"}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser ? "rounded-br-sm bg-neutral-800" : "rounded-bl-sm bg-neutral-100"
        }`}
      >
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text":
              return (
                <Text
                  className={`text-sm leading-5 ${isUser ? "text-white" : "text-neutral-700"}`}
                  key={`${message.id}-${i}`}
                >
                  {part.text}
                </Text>
              )
            case "reasoning":
              return (
                <Text
                  className="text-xs italic leading-4 text-neutral-400"
                  key={`${message.id}-${i}`}
                >
                  {part.reasoning}
                </Text>
              )
            default:
              return null
          }
        })}
      </View>
    </View>
  )
}
