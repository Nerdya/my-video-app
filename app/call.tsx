
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

export default function CallScreen() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();
  const apiService = createAPIService({
    baseURL: "https://vekyc-gateway-server-uat.mobifi.vn",
    headers: {
      token: "a77e3d4eb8b1141190827c114cb21dce23331b657da9b85ae32ec7f45cfe92d9"
    }
  });

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

  const appointmentId: string = decodeURIComponent(params.appointmentId as string);
  const appId: string = decodeURIComponent(params.appId as string);
  const token: string = decodeURIComponent(params.token as string);
  const channelName: string = decodeURIComponent(params.channelName as string);
  const localUid: number = Number(decodeURIComponent(params.localUid as string));

  const engine = createVekycEngine();
  const vekycService = createVekycService();
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);

  const hook = async () => {
    try {
      const res = await apiService.hook(appId, channelName);
      if (!res?.status) {
        console.error("Invalid response from hook API:", res);
        return;
      }
      console.log("Hooked successfully:", res);
    } catch (error) {
      console.error("Exception:", error);
    }
  }

  useEffect(() => {
    const init = async () => {
      console.log("Initializing...");
      await vekycService.initialize(engine, appId);
    
      console.log("engine:", engine);
      vekycService.registerEventHandler(engine, {
        onJoinChannelSuccess: () => {
          console.log('onJoinChannelSuccess');
          vekycService.enableVideo(engine);
          setIsJoined(true);
        },
        onUserJoined: (_connection, uid) => {
          console.log('onUserJoined');
          setRemoteUid(() => uid);
        },
        onUserOffline: (_connection, uid) => {
          console.log('onUserOffline');
          setRemoteUid((prevUid) => prevUid === uid ? 0 : prevUid);
        }
      });

      const result = engine.preloadChannel(token, channelName, localUid);
      console.log("Preload result:", result);

      await vekycService.joinChannel(engine, token, channelName, localUid, {});

      await hook();
    };
    
    init();

    return () => {
      console.log("Cleaning up...");
      vekycService.cleanup(engine);
    };
  }, []);

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
      console.error("Exception:", error);
    }
  }


  const leave = () => {
    vekycService.leaveChannel(engine);
    toResult();
  }

  const toResult = () => {
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
