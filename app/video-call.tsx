import { View, Button } from "react-native";
import { createAgoraRtcEngine } from "react-native-agora";

const APP_ID = "your-agora-app-id";
const CHANNEL_NAME = "test-channel";
const TOKEN = "your-temporary-token";
const UID = 0;

export default function VideoCallScreen() {
  const agoraEngine = createAgoraRtcEngine();
  agoraEngine.initialize({ appId: APP_ID });
  agoraEngine.enableVideo();

  const joinChannel = () => {
    agoraEngine.joinChannel(TOKEN, CHANNEL_NAME, UID, {
      autoSubscribeAudio: true,
      autoSubscribeVideo: true,
    });
  };

  return (
    <View>
      <Button title="Join Call" onPress={joinChannel} />
    </View>
  );
}
