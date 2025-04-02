import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, Button, TextInput } from "react-native";
import { createAPIService } from "react-native-vpage-sdk";

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const apiService = createAPIService({
    baseURL: "https://vekyc-gateway-server-uat.mobifi.vn",
    headers: {
      token: "c1c20a5d447dac739e71f1e872dc26bb744e727f143753d9e44ce129ea645019"
    }
  });
  
  const [appId, setAppId] = useState("85aec5b5ad574659957cf8886527e134");
  const [token, setToken] = useState("007eJxTYDjreVpYj9+qd1/oifqv9dKa8jJ35x58ZdgSvufM9er7t0MVGCxME1OTTZNME1NMzU3MTC0tTc2T0ywsLMxMjcxTDY1NHmx+nd4QyMiwz72QmZEBAkF8dobk0vy89LxsBgYA6QMh9A==");
  const [channelName, setChannelName] = useState("cuongnk");
  const [localUid, setLocalUid] = useState("0");

  const toCall = () => {
    router.replace(
      `/call?appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}&channelName=${encodeURIComponent(channelName)}&localUid=${encodeURIComponent(localUid)}`
    )
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>App ID</Text>
      <TextInput
        value={appId}
        onChangeText={setAppId}
        style={styles.input}
        placeholder="Enter App ID"
      />

      <Text>Token (optional)</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        style={styles.input}
        placeholder="Enter Token"
      />

      <Text>Channel (optional)</Text>
      <TextInput
        value={channelName}
        onChangeText={setChannelName}
        style={styles.input}
        placeholder="Enter Channel Name"
      />

      <Text>UID (optional)</Text>
      <TextInput
        value={localUid}
        onChangeText={setLocalUid}
        style={styles.input}
        keyboardType="numeric"
        placeholder="Enter UID"
      />

      <Button
        title="To Call"
        onPress={toCall}
        disabled={!appId.trim()}
      />
    </View>
  );
}

const styles = {
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
};
