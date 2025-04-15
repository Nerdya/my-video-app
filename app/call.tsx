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
import { createAPIService, createVekycService, createSocketService, RtcSurfaceView, VideoSourceType } from "react-native-vpage-sdk";
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
  const [isHooking, setIsHooking] = useState(false);
  const [isClosingVideo, setIsClosingVideo] = useState(false);

  const socketService = createSocketService();
  const [socketServiceInstance, setSocketServiceInstance] = useState(socketService);

  const connectSocket = async () => {
    socketService.initialize(
      vkycTpcConfig.socketBaseUrl,
      channelName,
      apiToken,
      (message) => {
        console.log(`[${new Date()}]`, message);
      }
    );

    socketService.registerEventHandler({
      // onUnhandledMessage: (message) => {
      //   console.error('Unhandled message:', message);
      // },
      // onUnhandledReceipt: (frame) => {
      //   console.error('Unhandled receipt:', frame);
      // },
      // onUnhandledFrame: (frame) => {
      //   console.error('Unhandled frame:', frame);
      // },
      // beforeConnect: async (client) => {
      //   console.log('Before connect:', client);
      // },
      onConnect: (frame) => {
        console.log("STOMP connected:", frame);
        socketService.subscribeSessionNotifyTopic((message) => {
          console.log("Session notify:", message);
        });
        socketService.subscribeSocketNotifyTopic((message) => {
          console.log("Socket notify:", message);
        });
        socketService.subscribeSocketHealthTopic((message) => {
          console.log("Session notify:", message);
        });
        socketService.subscribeAppLiveTopic((message) => {
          console.log("App live:", message);
        });
      },
      onDisconnect: (frame) => {
        console.log('STOMP disconnected:', frame);
      },
      // onStompError: (frame) => {
      //   console.error('STOMP error:', frame);
      // },
      // onWebSocketClose: (event) => {
      //   console.error('WebSocket closed:', event);
      // },
      // onWebSocketError: (event) => {
      //   console.error('WebSocket error:', event);
      // },
      // onChangeState: (state) => {
      //   console.log('State changed:', state);
      // }
    });

    socketService.connect();
    setSocketServiceInstance(socketService);
  };

  const vekycService = createVekycService();
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);

  const joinCall = async () => {
    await vekycService.getPermissions();

    await vekycService.initialize(appId);

    // Register event handlers
    await vekycService.registerEventHandler({
      onJoinChannelSuccess: () => {
        console.log("onJoinChannelSuccess");
        vekycService.enableVideo();
        vekycService.startPreview();
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

    await vekycService.joinChannel(token, channelName, localUid, {});
  };

  useEffect(() => {
    console.log("Initializing socket connection...");
    connectSocket();

    console.log("Initializing call...");
    joinCall();

    return () => {
      console.log("Cleaning up call...");
      vekycService.cleanup();
      
      console.log("Cleaning up socket connection...");
      socketService.cleanup();
    };
  }, []);

  const hook = async () => {
    if (isHooking) {
      return;
    }
    setIsHooking(true);
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
      socketService.startHealthCheck(socketServiceInstance);
    } catch (error) {
      console.error("Exception during hook:", error);
    } finally {
      setIsHooking(false);
    }
  }

  const closeVideo = async () => {
    if (isClosingVideo) {
      return;
    }
    setIsClosingVideo(true);
    try {
      const res = await apiService.closeVideo(channelName);
      if (!res?.status) {
        console.error("Invalid response from closeVideo API:", res);
        return;
      }
      console.log("Closed video successfully:", res);
    } catch (error) {
      console.error("Error closing video:", error);
    } finally {
      setIsClosingVideo(false);
      leaveCall();
    }
  }

  const leaveCall = () => {
    vekycService.leaveChannel();
    toResult();
  }

  const toResult = () => {
    router.replace("/result");
  }

  return (
    <SafeAreaView style={styles.main}>
      <Text style={styles.head}>Video Call Screen</Text>
      <View style={styles.btnContainer}>
        <Text onPress={hook} style={styles.button}>
          {isHooking ? "Connecting to Agent..." : "Connect to Agent"}
        </Text>
        <Text onPress={closeVideo} style={styles.button}>
          {isClosingVideo ? "Ending Call..." : "End Call"}
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
