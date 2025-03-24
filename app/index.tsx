import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View>
      <Text>Welcome to My Video App!</Text>
      <Button title="Start Call" onPress={() => router.push("/video-call")} />
    </View>
  );
}
