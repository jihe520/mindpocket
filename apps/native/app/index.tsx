import { Button } from "heroui-native"
import { View } from "react-native"

export default function Native() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Button onPress={() => console.log("Pressed!")}>Get Started</Button>
    </View>
  )
}
