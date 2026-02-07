import { StatusBar } from "expo-status-bar"
import { Button } from "heroui-native"
import { StyleSheet, Text, View } from "react-native"

export default function Native() {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <Button onPress={() => console.log("Pressed!")}>Get Started</Button>
    </View>
  )
}
