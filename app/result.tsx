import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, Button, StyleSheet } from "react-native";
import { MessageCode } from "@/helpers/config";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const code = decodeURIComponent(params.code as string) as MessageCode;
  const detail = decodeURIComponent(params.code as string);

  const toIndex = () => {
    router.back();
  };

  const renderMessage = () => {
    switch (code) {
      case MessageCode.SUCCESS:
        return "Kết thúc cuộc gọi thành công.";
      case MessageCode.FORCE_DISCONNECT:
        return "Cuộc gọi đã bị ngắt kết nối.";
      case MessageCode.ERROR_INIT:
        return "Có lỗi xảy ra khi khởi tạo cuộc gọi.";
      case MessageCode.ERROR_HOOK:
        return "Có lỗi xảy ra khi kết nối cuộc gọi.";
      case MessageCode.ERROR_CLOSE_VIDEO:
        return "Có lỗi xảy ra khi kết thúc cuộc gọi.";
      case MessageCode.ERROR:
        return "Có lỗi xảy ra trong quá trình cuộc gọi.";
      default:
        return "Có lỗi xảy ra.";
    }
  }

  const renderButton = () => {
    switch (code) {
      case MessageCode.SUCCESS:
      case MessageCode.ERROR:
        return <Button title="Back to Index" onPress={toIndex} />;
      case MessageCode.FORCE_DISCONNECT:
        return <Button title="Retry Call" onPress={toIndex} />;
      default:
        return null;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{renderMessage()}</Text>
      {detail && <Text style={styles.message}>{detail}</Text>}
      {renderButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  message: { fontSize: 18, textAlign: "center", margin: 20 },
});
