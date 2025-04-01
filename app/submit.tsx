import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, Button, StyleSheet, Switch } from "react-native";

export default function SubmitScreen() {
  const router = useRouter();

  const [isChecked, setIsChecked] = useState(false);

  const toOTP = () => {
    router.push(`/otp`)
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
        title="To OTP"
        onPress={toOTP}
        disabled={!isChecked}
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
