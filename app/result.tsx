import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, Button, StyleSheet } from "react-native";
import { MessageCode } from "@/helpers/config";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const code = decodeURIComponent(params.code as string) as MessageCode;

  const toIndex = () => {
    router.back();
  };

  const renderMessage = () => {
    switch (code) {
      case MessageCode.SUCCESS:
        return "Call completed successfully!";
      case MessageCode.ERROR:
        return "An error occurred during the call.";
      case MessageCode.FORCE_LEAVE:
        return "You have left the call.";
      default:
        return "Unknown result.";
    }
  }

  const renderButton = () => {
    switch (code) {
      case MessageCode.SUCCESS:
      case MessageCode.ERROR:
        return <Button title="Back to Index" onPress={toIndex} />;
      case MessageCode.FORCE_LEAVE:
        return <Button title="Retry Call" onPress={toIndex} />;
      default:
        return null;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{renderMessage()}</Text>
      {renderButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  message: { fontSize: 18, textAlign: "center", margin: 20 },
});
