import { useRouter } from "expo-router";
import { View, Text, Button } from "react-native";

export default function ResultScreen() {
  const router = useRouter();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 20, fontSize: 16 }}>
        This is the result screen. You can view the results here.
      </Text>
      <Button title="Back to Index" onPress={() => router.back()} />
    </View>
  );
}
