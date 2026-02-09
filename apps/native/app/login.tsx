import { useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { authClient } from "@/lib/auth-client"

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!(email.trim() && password.trim())) {
      Alert.alert("提示", "请输入邮箱和密码")
      return
    }

    setLoading(true)
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      })

      if (error) {
        Alert.alert("登录失败", error.message || "请检查邮箱和密码")
        return
      }

      router.replace("/(tabs)")
    } catch (_e) {
      Alert.alert("登录失败", "网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View
        className="flex-1 justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Text className="mb-2 text-center text-3xl font-bold text-neutral-800">MindPocket</Text>
        <Text className="mb-10 text-center text-base text-neutral-400">登录以继续</Text>

        <Text className="mb-1 text-sm text-neutral-600">邮箱</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          className="mb-4 rounded-lg border border-neutral-200 px-4 py-3 text-base"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="your@email.com"
          value={email}
        />

        <Text className="mb-1 text-sm text-neutral-600">密码</Text>
        <TextInput
          autoComplete="password"
          className="mb-6 rounded-lg border border-neutral-200 px-4 py-3 text-base"
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          placeholder="输入密码"
          returnKeyType="done"
          secureTextEntry
          value={password}
        />

        <Pressable
          className="items-center rounded-lg bg-neutral-900 py-3.5"
          disabled={loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">登录</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
