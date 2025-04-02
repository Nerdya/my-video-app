import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, Button, StyleSheet, Switch } from "react-native";
import { createAPIService } from "react-native-vpage-sdk";

export default function SubmitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const apiService = createAPIService({
    baseURL: "https://vekyc-gateway-server-uat.mobifi.vn",
    headers: {
      token: "c1c20a5d447dac739e71f1e872dc26bb744e727f143753d9e44ce129ea645019"
    }
  });

  const appointmentId: string = decodeURIComponent(params.appointmentId as string);
  const appId: string = decodeURIComponent(params.appId as string);
  const token: string = decodeURIComponent(params.token as string);
  const channelName: string = decodeURIComponent(params.channelName as string);
  const localUid: number = Number(decodeURIComponent(params.localUid as string));

  const [isChecked, setIsChecked] = useState(false);
  const [contractId, setContractId] = useState("");

  useEffect(() => {
    console.log('submit', appId);
  }, [appId]);

  const submit = async () => {
    try {
      const res = await apiService.submit(appointmentId);
      if (!res?.status || !res?.data?.contractId) {
        console.error("Invalid response from submit API:", res);
        return;
      }
      console.log("Submitted successfully:", res?.data);
      setContractId(res?.data?.contractId);
      toCall();
    } catch (error) {
      console.error("Exception:", error);
    }
  }

  const toCall = () => {
    router.replace(
      `/call?appointmentId=${encodeURIComponent(appointmentId)}&contractId=${encodeURIComponent(contractId)}&appId=${encodeURIComponent(appId)}&token=${encodeURIComponent(token)}&channelName=${encodeURIComponent(channelName)}&localUid=${encodeURIComponent(localUid)}`
    )
  }

  return (
    <View style={{ padding: 20 }}>
      <View style={styles.checkboxContainer}>
        <Switch
          value={isChecked}
          onValueChange={setIsChecked}
        />
        <Text style={styles.checkboxLabel}>
          I agree with the terms and conditions
        </Text>
      </View>

      <Button
        title="Submit"
        onPress={submit}
        disabled={!appId.trim() || !isChecked}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
});
