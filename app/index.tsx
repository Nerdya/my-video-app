import { useState } from "react";
import { View, Text, Button, TextInput } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  const [appId, setAppId] = useState("85aec5b5ad574659957cf8886527e134");
  const [channelName, setChannelName] = useState("cuongnk");
  const [token, setToken] = useState("007eJxTYFguE/1he8jkTW5b4oMa0mQcn+9cwt0V/PhVj+h2nX1fYmUVGCxME1OTTZNME1NMzU3MTC0tTc2T0ywsLMxMjcxTDY1NNLkepTcEMjJ0MF5kZmSAQBCfnSG5ND8vPS+bgQEAqj0gBQ==");
  const [localUid, setLocalUid] = useState("0");

  return (
    <View style={{ padding: 20 }}>
      <Text>App ID</Text>
      <TextInput value={appId} onChangeText={setAppId} style={styles.input} />

      <Text>Channel</Text>
      <TextInput value={channelName} onChangeText={setChannelName} style={styles.input} />

      <Text>Token (optional)</Text>
      <TextInput value={token} onChangeText={setToken} style={styles.input} />

      <Text>UID (optional)</Text>
      <TextInput value={localUid} onChangeText={setLocalUid} style={styles.input} keyboardType="numeric" />

      <Button
        title="Start Call"
        onPress={() => router.push(
          `/video-call?appId=${encodeURIComponent(appId)}&channelName=${encodeURIComponent(channelName)}&token=${encodeURIComponent(token)}&localUid=${encodeURIComponent(localUid)}`
        )}
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
