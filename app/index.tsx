import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, Button, TextInput } from "react-native";
import publicIP from "react-native-public-ip";
import { createAPIService } from "react-native-vpage-sdk";

export default function IndexScreen() {
  const router = useRouter();
  const apiService = createAPIService({
    baseURL: "https://vekyc-gateway-server-uat.mobifi.vn",
    headers: {
      token: "c1c20a5d447dac739e71f1e872dc26bb744e727f143753d9e44ce129ea645019"
    }
  });

  // const [appointmentId, setAppointmentId] = useState("0b4382f1-5332-493b-9aad-373c348a3152");
  // const [appId, setAppId] = useState("85aec5b5ad574659957cf8886527e134");
  // const [token, setToken] = useState("007eJxTYDjreVpYj9+qd1/oifqv9dKa8jJ35x58ZdgSvufM9er7t0MVGCxME1OTTZNME1NMzU3MTC0tTc2T0ywsLMxMjcxTDY1NHmx+nd4QyMiwz72QmZEBAkF8dobk0vy89LxsBgYA6QMh9A==");
  // const [channelName, setChannelName] = useState("cuongnk");
  // const [localUid, setLocalUid] = useState("0");
  const [appointmentId, setAppointmentId] = useState("0181e6e7-634e-4050-b295-e093fcb3f170");
  const [appId, setAppId] = useState("");
  const [token, setToken] = useState("");
  const [channelName, setChannelName] = useState("");
  const [localUid, setLocalUid] = useState("");

  const getIPAddress = async () => {
    try {
      return await publicIP();
    } catch (error) {
      console.error("Error fetching public IP:", error);
    }
  };

  const getConfigInfo = async () => {
    try {
      const res = await apiService.getConfigInfo(appointmentId);
      if (!res?.status) {
        console.error("Invalid response from getConfigInfo API:", res);
        return;
      }
      console.log("Meeting created successfully:", res?.data);
    } catch (error) {
      console.error("Exception:", error);
    }
  }

  const createMeeting = async () => {
    try {
      const customerIp = await getIPAddress() || "";
      const res = await apiService.createMeeting(appointmentId, customerIp);
      if (!res?.status || !res?.data?.sessionId || !res?.data?.key || !res?.data?.code || !res?.data?.subId) {
        console.error("Invalid response from createMeeting API:", res);
        return;
      }
      console.log("Meeting created successfully:", res?.data);
      setAppId(res?.data?.sessionId);
      setChannelName(res?.data?.key);
      setToken(res?.data?.code);
      setLocalUid(res?.data?.subId);
      console.log('index', appId);
      toCall();
    } catch (error) {
      console.error("Exception:", error);
    }
  }

  const toCall = () => {
    router.push(`/call?appointmentId=${encodeURIComponent(appointmentId)}&appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}&channelName=${encodeURIComponent(channelName)}&localUid=${encodeURIComponent(localUid)}`);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 20, fontSize: 16 }}>
        This is a demo app showcasing the integration of the `react-native-vpage-sdk` package for video calling functionality, using WS6.
      </Text>
      <Text style={{ marginBottom: 20, fontSize: 16 }}>
        Input appointmentId to create a meeting.
      </Text>
      <Text style={{ marginBottom: 10, fontSize: 16 }}>
        Appointment ID
      </Text>
      <TextInput
        value={appointmentId}
        onChangeText={setAppointmentId}
        style={styles.input}
        placeholder="Enter Appointment ID"
      />

      <Button
        title="Create Meeting"
        onPress={createMeeting}
        disabled={!appointmentId.trim()}
      />

      <Text style={{ marginBottom: 300, fontSize: 16 }}>
        ---
      </Text>
      <Text style={{ marginBottom: 10, fontSize: 16 }}>
        For testing purposes
      </Text>
        <Button
        title="Get Config Info"
        onPress={getConfigInfo}
        disabled={!appointmentId.trim()}
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
