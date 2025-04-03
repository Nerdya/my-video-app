import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, Button, TextInput } from "react-native";
import publicIP from "react-native-public-ip";
import { createCryptoService, createAPIService } from "react-native-vpage-sdk";
import { EnvConfig, vkycTpcConfig } from "@/helpers/config";

export default function IndexScreen() {
  const router = useRouter();
  const cryptoService = createCryptoService();

  const [apiService, setApiService] = useState<any>();
  const [ws6Url, setWs6Url] = useState("https://vekyc-vpage-tpc-ui-uat.mobifi.vn//partner-redirect-dynamic?appointment_id=34d689ed-c5c7-44db-b616-111fcdb20d25&token_encrypt=7DBH0kM0drkeGKoMFACv3ZZSHobKYhgVR5mr9V0jXzx83YDA%2BcasI8hucngnb76SaugMDj1ouEFv2PfXCrZRBfI8xfy63GNiMqXwBXfIzg7%2BRiFR%2FHxZKWY2GVMxvcyeRONp9n4EY3aVTYc0XobqjA%3D%3D");
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
        console.error("Invalid response from getConfigInfo API:", res);
        return;
      }
      console.log("Config info fetched:", res?.data);
    } catch (error) {
      console.error("Exception:", error);
    }
  }

  const getIPAddress = async () => {
    try {
      return await publicIP();
    } catch (error) {
      console.error("Error fetching public IP:", error);
    }
  };

  const createMeeting = async () => {
    if (isCreatingMeeting) {
      return;
    }
    setIsCreatingMeeting(true);
    try {
      const customerIp = await getIPAddress() || "";
      const res = await apiService.createMeeting(appointmentId, customerIp);
      if (!res?.status || !res?.data?.sessionId || !res?.data?.key || !res?.data?.code || !res?.data?.subId) {
        console.error("Invalid response from createMeeting API:", res);
        return;
      }
      console.log("Meeting created successfully:", res?.data);
      // const appId = "85aec5b5ad574659957cf8886527e134";
      // const token = "007eJxTYNC9u7onNfTyxlO6kloTlXhqXiwSffT087cz9j5bF8wJSHmowGBhmpiabJpkmphiam5iZmppaWqenGZhYWFmamSeamhs8k/kbXpDICND4I1jjIwMEAjiszMkl+bnpedlMzAAAC+VIq0=";
      // const channelName = "cuongnk";
      // const localUid = "0";
      const appId = config?.appId || "";
      const token = res?.data?.code;
      const channelName = res?.data?.key;
      const localUid = res?.data?.subId;
      toCall(appointmentId, apiToken, appId, token, channelName, localUid);
    } catch (error) {
      console.error("Exception:", error);
    } finally {
      setIsCreatingMeeting(false);
    }
  }

  const toCall = (appointmentId: string, apiToken: string, appId: string, token: string, channelName: string, localUid: string) => {
    console.log("Navigating to CallScreen with the following parameters:");
    console.log("appointmentId:", appointmentId);
    console.log("apiToken:", apiToken);
    console.log("appId:", appId);
    console.log("token:", token);
    console.log("channelName:", channelName);
    console.log("localUid:", localUid);
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
      <Text style={{ marginBottom: 20, fontSize: 16 }}>
        Input WS6 URL to create a meeting.
      </Text>
      <Text style={{ marginBottom: 10, fontSize: 16 }}>
        WS6 URL:
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

      {/* <Button
        title="Get Config Info"
        onPress={getConfigInfo}
        disabled={!apiService}
      /> */}

      <Button
        title={isCreatingMeeting ? "Creating Meeting..." : "Create Meeting"}
        onPress={createMeeting}
        disabled={!apiService || isCreatingMeeting}
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
