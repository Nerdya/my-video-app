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
} from "react-native";
import { createAPIService, createVekycService, createSocketService, RtcSurfaceView, VideoSourceType } from "react-native-vpage-sdk";
import { MessageCode, vkycTpcConfig } from "@/helpers/config";

export default function CallScreen() {
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams();

  const [socketMessages, setSocketMessages] = useState<string[]>([]);

  const handleBackNavigation = () => {
    if (segments[0] !== "call") return false; // Prevent back handling if not on CallScreen

    Alert.alert(
      "Leave Call",
      "You are currently in the call. Are you sure you want to leave?",
      [
        { text: "Cancel", style: "cancel", onPress: () => {} },
        { text: "Yes, Leave", style: "destructive", onPress: () => toResult(MessageCode.END_CALL_EARLY) },
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
  const [isCalling, setIsCalling] = useState(false);
  const [isClosingVideo, setIsClosingVideo] = useState(false);

  const socketService = createSocketService();
  const [socketServiceInstance, setSocketServiceInstance] = useState(socketService);

  const connectSocket = async () => {
    socketService.initialize(
      vkycTpcConfig.socketBaseUrl,
      channelName,
      apiToken,
      // (message) => {
      //   console.log(`[${new Date()}]`, message);
      // }
    );

    socketService.registerEventHandler({
      // onUnhandledMessage: (message) => {
      //   console.warn("Unhandled message:", message);
      // },
      // onUnhandledReceipt: (frame) => {
      //   console.warn("Unhandled receipt:", frame);
      // },
      // onUnhandledFrame: (frame) => {
      //   console.warn("Unhandled frame:", frame);
      // },
      // beforeConnect: async (client) => {
      //   console.log("Before connect:", client);
      // },
      onConnect: (frame) => {
        console.log("STOMP connected:", frame);
        setSocketMessages((prev) => [...prev, `STOMP connected.`]);
        socketService.subscribeSessionNotifyTopic((message) => {
          console.log("Session notify:", message.body);
          const eventType = JSON.parse(message.body)?.eventType;
          const type = JSON.parse(message.body)?.type;
          setSocketMessages((prev) => [...prev, `Session notify: ${eventType || type}`]);
          switch (eventType) {
            case "START_CALL":
              console.log("Call started.");
              break;
            case "END_CALL":
              console.log("Agent left the call.");
              toResult(MessageCode.SUCCESS);
              break;
          }
          switch (type) {
            case "CALL_EXPIRED":
              console.log("No available agent.");
              toResult(MessageCode.CALL_EXPIRED);
              break;
            case "CALL_TIMEOUT":
              console.log("Call timed out.");
              toResult(MessageCode.CALL_TIMEOUT);
            case "STARTED_KYC":
            case "KYC_PASSED":
            case "LEGAL_PAPERS_PASSED":
            case "UPDATE_PAPERS_SUCCESS":
              console.log("Displaying contract...");
              Alert.alert(
                "Info",
                "This is a PDF contract file",
                [{ text: "OK", onPress: () => console.log("Contract dismissed.") }]
              );
              break;
          }
        });
        socketService.subscribeSocketNotifyTopic((message) => {
          console.log("Socket notify:", message.body);
          const type = JSON.parse(message.body)?.type;
          setSocketMessages((prev) => [...prev, `Socket notify: ${type}`]);
        });
        socketService.subscribeSocketHealthTopic((message) => {
          console.log("Socket health:", message.body);
          setSocketMessages((prev) => [...prev, `Socket health: ${message.body}`]);
        });
        socketService.subscribeAppLiveTopic((message) => {
          console.log("App live:", message.body);
          setSocketMessages((prev) => [...prev, `App live: ${message.body}`]);
        });
      },
      onDisconnect: (frame) => {
        console.log("STOMP disconnected:", frame);
        setSocketMessages((prev) => [...prev, `STOMP disconnected.`]);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
      onWebSocketClose: (event) => {
        console.warn("WebSocket closed:", event);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error:", event);
      },
      // onChangeState: (state) => {
      //   console.log("State changed:", state);
      // }
    });

    socketService.connect();
    setSocketServiceInstance(socketService);
  };

  const vekycService = createVekycService();
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [wifiState, setWifiState] = useState<"RED" | "YELLOW" | "GREEN">("GREEN");

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
      onNetworkQuality: (_connection, uid, txQuality, rxQuality) => {
        // console.log("onNetworkQuality", uid, txQuality, rxQuality);
        if (uid === 0) {
          if (rxQuality > 4 || txQuality > 4 || txQuality === 0 || rxQuality === 0) {
            setWifiState((prev) => {
              if (prev !== "RED") {
                socketService.sendNetworkStatus(rxQuality, txQuality, 'true');
              }
              return "RED";
            });
          } else if (rxQuality === 3 || txQuality === 3 || rxQuality === 4 || txQuality === 4) {
            setWifiState("YELLOW");
            socketService.sendNetworkStatus(rxQuality, txQuality, null);
          } else {
            setWifiState("GREEN");
          }
        }
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
    if (isHooking || isCalling) {
      return;
    }
    setIsHooking(true);
    try {
      const res = await apiService?.hook(channelName, channelName);
      if (!res?.status) {
        toResult(MessageCode.ERROR_HOOK, `Invalid response from hook API: ${JSON.stringify(res)}`);
        return;
      }

      console.log("Hooked successfully:", res);
      setIsCalling(true);
      socketService.startHealthCheck(socketServiceInstance);
    } catch (error) {
      toResult(MessageCode.ERROR_HOOK, `Exception: ${error}`);
    } finally {
      setIsHooking(false);
    }
  }

  const closeVideo = async () => {
    console.log("Leaving call...");
    if (isClosingVideo) {
      return;
    }
    setIsClosingVideo(true);
    try {
      if (!isCalling) {
        console.log("Call not started yet, redirecting to result screen.");
        toResult(MessageCode.END_CALL_EARLY);
        return;
      }

      const res = await apiService?.closeVideo(channelName);
      // Add a timeout to check for remaining sockets
      console.log("Checking for remaining sockets...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!res?.status) {
        toResult(MessageCode.ERROR_CLOSE_VIDEO, `Invalid response from closeVideo API: ${JSON.stringify(res)}`);
        return;
      }

      console.log("Closed video successfully:", res);
      toResult(MessageCode.SUCCESS);
    } catch (error) {
      toResult(MessageCode.ERROR_CLOSE_VIDEO, `Exception: ${error}`);
    } finally {
      setIsClosingVideo(false);
    }
  }

  const toResult = (code: MessageCode, errorMessage = "") => {
    router.replace({
      pathname: "/result",
      params: { code: encodeURIComponent(code), detail: encodeURIComponent(errorMessage) },
    });
  };

  const getColorByState = () => {
    switch (wifiState) {
      case "RED": return 'red';     // Disconnected
      case "YELLOW": return 'yellow';  // Connecting / Weak
      case "GREEN": return 'green';   // Connected
      default: return 'gray';
    }
  };

  return (
    <SafeAreaView style={styles.main}>
      <View style={styles.titleContainer}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View
            style={[
              styles.statusCircle,
              { backgroundColor: getColorByState() }, // Dynamically set the circle color
            ]}
          />
        </View>
        <Text style={styles.head}>Video Call Screen</Text>
      </View>

      <View style={styles.btnContainer}>
        {isCalling ? (
          <Text style={styles.buttonDisabled}>Joined Call</Text>
        ) : (
          <Text onPress={hook} style={styles.button}>
            {isHooking ? "Joining Call..." : "Join Call"}
          </Text>
        )}
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

            {/* Display socket message */}
            <View style={styles.socketMessagesContainer}>
              <Text style={styles.socketMessagesHeader}>Socket Messages:</Text>
              {socketMessages.map((msg, index) => (
                <Text key={index} style={styles.socketMessage}>
                  {msg}
                </Text>
              ))}
            </View>
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
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#0055cc",
    margin: 5,
  },
  buttonDisabled: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: "bold",
    color: "#666666",
    backgroundColor: "#cccccc",
    margin: 5,
  },
  main: { flex: 1, alignItems: "center" },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 5,
  },
  statusCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "gray",
  },
  scroll: { flex: 1, backgroundColor: "#ddeeff", width: "100%" },
  scrollContainer: { alignItems: "center" },
  videoView: { width: "90%", height: 200 },
  btnContainer: { flexDirection: "row", justifyContent: "center" },
  head: { fontSize: 20 },
  socketMessagesContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  socketMessagesHeader: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  socketMessage: {
    fontSize: 14,
    marginBottom: 5,
  },
});
