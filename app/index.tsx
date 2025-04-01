import { useRouter } from "expo-router";
import { View, Text, Button } from "react-native";

export default function IndexScreen() {
  const router = useRouter();

  const toSubmit = () => {
    router.push(`/submit`);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 20, fontSize: 16 }}>
        This is a demo app showcasing the integration of the `react-native-vpage-sdk` package for video calling functionality.
      </Text>
      <Button
        title="To Submit"
        onPress={toSubmit}
      />
    </View>
  );
}
