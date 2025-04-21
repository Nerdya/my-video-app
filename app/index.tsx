import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, Button, TextInput } from "react-native";
import { createCryptoService, createAPIService } from "react-native-vpage-sdk";
import { EnvConfig, vkycTpcConfig } from "@/helpers/config";

export default function IndexScreen() {
  const router = useRouter();
  const cryptoService = createCryptoService();

  const [errorMessage, setErrorMessage] = useState("");

  const [apiService, setApiService] = useState<any>();
  const [ws6Url, setWs6Url] = useState("");
  const [config, setConfig] = useState<EnvConfig>();
  const [appointmentId, setAppointmentId] = useState("");
  const [apiToken, setApiToken] = useState("");

  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  useEffect(() => {
    setApiService(null);
  }, []);

  const initApiService = () => {
    const res = cryptoService.decryptWS6Url(ws6Url);
  
    // Set the config synchronously
    const updatedConfig = vkycTpcConfig;
    const updatedApiToken = res?.token?.split(".")[1] || "";
    const updatedAppointmentId = res?.appointmentId || "";

    setConfig(updatedConfig);
    setApiToken(updatedApiToken);
    setAppointmentId(updatedAppointmentId);

    // Use the updated config to create the API service
    setApiService(
      createAPIService({
        baseURL: updatedConfig.vcoreBaseUrl,
        headers: {
          token: updatedApiToken,
        },
      })
    );
  };

  const getConfigInfo = async () => {
    try {
      const res = await apiService.getConfigInfo(appointmentId);
      if (!res?.status) {
        setErrorMessage(`Invalid response from getConfigInfo API: ${JSON.stringify(res)}`);
        return;
      }
      console.log("Config info fetched:", res?.data);
    } catch (error) {
      setErrorMessage(`Exception: ${error}`);
    }
  }

  const createMeeting = async () => {
    if (isCreatingMeeting) {
      return;
    }
    setIsCreatingMeeting(true);
    setErrorMessage(``);
    try {
      const customerIp = await apiService.getIPAddress();
      const res = await apiService.createMeeting(appointmentId, customerIp);
      if (!res?.status || !res?.data?.sessionId || !res?.data?.key || !res?.data?.code || !res?.data?.subId) {
        setErrorMessage(`Invalid response from createMeeting API: ${JSON.stringify(res)}`);
        return;
      }
      console.log("Meeting created successfully:", res?.data);
      const appId = config?.appId || "";
      const token = res?.data?.code;
      const channelName = res?.data?.key;
      const localUid = res?.data?.subId;
      toCall(appointmentId, apiToken, appId, token, channelName, localUid);
    } catch (error) {
      setErrorMessage(`Exception: ${error}`);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const toCall = (appointmentId: string, apiToken: string, appId: string, token: string, channelName: string, localUid: string) => {
    router.push({
      pathname: "/call",
      params: {
        appointmentId: encodeURIComponent(appointmentId),
        apiToken: encodeURIComponent(apiToken),
        appId: encodeURIComponent(appId),
        token: encodeURIComponent(token),
        channelName: encodeURIComponent(channelName),
        localUid: encodeURIComponent(localUid),
      },
    });
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 20, fontSize: 16 }}>
        This is a demo app showcasing the integration of the `react-native-vpage-sdk` package for video calling functionality, using WS6.
      </Text>
      <Text style={{ marginBottom: 10, fontSize: 16 }}>
        Input WS6 URL to create a meeting.
      </Text>
      <TextInput
        value={ws6Url}
        onChangeText={setWs6Url}
        style={styles.input}
        placeholder="Enter WS6 URL"
      />

      <Button
        title="Init API service"
        onPress={initApiService}
        disabled={!ws6Url.trim()}
      />

      <Text style={{ marginBottom: 10, fontSize: 16 }}></Text>

      <Text style={{ marginBottom: 10, fontSize: 16 }}>
        Init API service before creating a meeting.
      </Text>

      <Button
        title={isCreatingMeeting ? "Creating Meeting..." : "Create Meeting"}
        onPress={createMeeting}
        disabled={!apiService || isCreatingMeeting}
      />

      {/* Display error message */}
      {errorMessage ? (
        <Text style={{ color: "red", marginTop: 10 }}>{errorMessage}</Text>
      ) : null}
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
