
import React, { useState, useEffect } from "react";
import { useRouter, useSegments, useLocalSearchParams } from "expo-router";
import {
  Alert,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createAPIService, createVekycEngine, createVekycService, RtcSurfaceView, VideoSourceType } from "react-native-vpage-sdk";
import { vkycTpcConfig } from "@/helpers/config";

export default function CallScreen() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();

  const handleBackNavigation = () => {
    if (segments[0] !== "call") return false; // Prevent back handling if not on CallScreen

    Alert.alert(
      "Leave Call",
      "You are currently in the call. Are you sure you want to leave?",
      [
        { text: "Cancel", style: "cancel", onPress: () => {} },
        { text: "Yes, Leave", style: "destructive", onPress: toResult },
      ],
      { cancelable: true }
    );
    return true; // Prevent default back behavior
  };

  useEffect(() => {
    if (segments[0] === "call") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackNavigation
      );

      return () => backHandler.remove();
    }
  }, [segments]);

  const appointmentId = decodeURIComponent(params.appointmentId as string);
  const apiToken = decodeURIComponent(params.apiToken as string);
  const appId = decodeURIComponent(params.appId as string);
  const channelName = decodeURIComponent(params.channelName as string);
  const token = decodeURIComponent(params.token as string);
  const localUid = Number(decodeURIComponent(params.localUid as string));

  const apiService = createAPIService({
    baseURL: vkycTpcConfig.vcoreBaseUrl,
    headers: {
      token: apiToken,
    },
  });

  const engine = createVekycEngine();
  const vekycService = createVekycService();
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);

  const join = async () => {
    vekycService.getPermissions();

    const initializeResult = await vekycService.initialize(engine, appId);
    console.log("initializeResult:", initializeResult);

    // Register event handlers
    await vekycService.registerEventHandler(engine, {
      onJoinChannelSuccess: () => {
        console.log("onJoinChannelSuccess");
        const enableVideoResult = vekycService.enableVideo(engine);
        console.log("enableVideoResult:", enableVideoResult);
        const startPreviewResult = vekycService.startPreview(engine);
        console.log("startPreviewResult:", startPreviewResult);
        setIsJoined(true);
      },
      onUserJoined: (_connection, uid) => {
        console.log("onUserJoined", uid);
        setRemoteUid(() => uid);
      },
      onUserOffline: (_connection, uid) => {
        console.log("onUserOffline", uid);
        setRemoteUid((prevUid) => (prevUid === uid ? 0 : prevUid));
      },
    });

    const joinResult = await vekycService.joinChannel(engine, token, channelName, localUid, {});
    console.log("joinResult:", joinResult);
  };

  useEffect(() => {
    join();

    return () => {
      console.log("Cleaning up...");
      vekycService.cleanup(engine);
    };
  }, []);

  const hook = async () => {
    try {
      if (!apiService) {
        console.error("API service is not available for hook");
        return;
      }
  
      const res = await apiService.hook(appId, channelName);
      if (!res?.status) {
        console.error("Invalid response from hook API:", res);
        return;
      }
      console.log("Hooked successfully:", res);
    } catch (error) {
      console.error("Exception during hook:", error);
    }
  }

  const closeVideo = async () => {
    try {
      const res = await apiService.closeVideo(channelName);
      if (!res?.status) {
        console.error("Invalid response from closeVideo API:", res);
        return;
      }
      console.log("Closed video successfully:", res);
      leave();
    } catch (error) {
      console.error("Error closing video:", error);
    }
  }

  const leave = () => {
    try {
      vekycService.leaveChannel(engine);
    } catch (error) {
      console.error("Error leaving:", error);
    }
    toResult();
  }

  const toResult = () => {
    router.replace(`/result`);
  }

  return (
    <SafeAreaView style={styles.main}>
      <Text style={styles.head}>Video Call Screen</Text>
      <View style={styles.btnContainer}>
        <Text onPress={hook} style={styles.button}>
          Connect to Agent
        </Text>
        <Text onPress={closeVideo} style={styles.button}>
          End Call
        </Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}>
        {isJoined && (
          <React.Fragment>
            {/* Render local video */}
            <Text>Local user uid: {localUid}</Text>
            <RtcSurfaceView
              canvas={{
                uid: localUid,
                sourceType: VideoSourceType.VideoSourceCamera,
              }}
              style={styles.videoView}
            />

            {/* Render remote video */}
            {remoteUid ? (
              <React.Fragment>
                <Text>Remote user uid: {remoteUid}</Text>
                <RtcSurfaceView
                  canvas={{
                    uid: remoteUid,
                    sourceType: VideoSourceType.VideoSourceRemote,
                  }}
                  style={styles.videoView}
                />
              </React.Fragment>
            ) : (
              <Text>Waiting for remote user to join</Text>
            )}
          </React.Fragment>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#0055cc',
    margin: 5,
  },
  main: { flex: 1, alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: '#ddeeff', width: '100%' },
  scrollContainer: { alignItems: 'center' },
  videoView: { width: '90%', height: 200 },
  btnContainer: { flexDirection: 'row', justifyContent: 'center' },
  head: { fontSize: 20 },
});
