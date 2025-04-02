
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
import { createAPIService, createVekycService, RtcSurfaceView, VideoSourceType } from "react-native-vpage-sdk";

export default function CallScreen() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();
  const apiService = createAPIService({
    baseURL: "https://vekyc-gateway-server-uat.mobifi.vn",
    headers: {
      token: "c1c20a5d447dac739e71f1e872dc26bb744e727f143753d9e44ce129ea645019"
    }
  });

  const handleBackNavigation = () => {
    if (segments[0] !== "call") return false; // Prevent back handling if not on CallScreen

    Alert.alert(
      "Leave Call",
      "You are currently in the call. Are you sure you want to leave?",
      [
        { text: "Cancel", style: "cancel", onPress: () => {} },
        { text: "Yes, Leave", style: "destructive", onPress: () => router.replace(`/result`) },
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

  const appointmentId: string = decodeURIComponent(params.appointmentId as string);
  const appId: string = decodeURIComponent(params.appId as string);
  const token: string = decodeURIComponent(params.token as string);
  const channelName: string = decodeURIComponent(params.channelName as string);
  const localUid: number = Number(decodeURIComponent(params.localUid as string));

  const vekycService = createVekycService(appId);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);

  const hook = async () => {
    try {
      const res = await apiService.hook(appId, channelName);
      if (!res?.status) {
        console.error("Invalid response from hook API:", res);
        return;
      }
      console.log("Hooked successfully:", res?.data);
    } catch (error) {
      console.error("Exception:", error);
    }
  }

  useEffect(() => {
    const init = async () => {
      await vekycService.initialize();
    
      vekycService.registerEventHandler({
        onJoinChannelSuccess: () => {
          vekycService.enableVideo();
          setIsJoined(true);
        },
        onUserJoined: (_connection, uid) => {
          setRemoteUid(() => uid);
        },
        onUserOffline: (_connection, uid) => {
          setRemoteUid((prevUid) => prevUid === uid ? 0 : prevUid);
        }
      });
    
      await vekycService.joinChannel(token, channelName, localUid);
    };
    
    init();
    hook();

    return () => {
      vekycService.cleanup();
    };
  }, []);

  const closeVideo = async () => {
    try {
      const res = await apiService.closeVideo(channelName);
      if (!res?.status) {
        console.error("Invalid response from closeVideo API:", res);
        return;
      }
      console.log("Closed video successfully:", res?.data);
      leave();
    } catch (error) {
      console.error("Exception:", error);
    }
  }


  const leave = () => {
    vekycService.leaveChannel();
    router.replace(`/result`);
  }

  return (
    <SafeAreaView style={styles.main}>
      <Text style={styles.head}>Video Call Screen</Text>
      <View style={styles.btnContainer}>
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
