import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSegments, useLocalSearchParams } from "expo-router";
import {
  Alert,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  Button,
  Platform,
} from "react-native";
import { createAPIService, createVekycService, createSocketService, RtcSurfaceView, VideoSourceType } from "react-native-vpage-sdk";
import { MessageCode, vkycTpcConfig } from "@/helpers/config";
import RNFS from "react-native-fs";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const stepsRef = useRef(steps);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const getConfigInfo = async () => {
    try {
      const res = await apiService.getConfigInfo(appointmentId);
      if (!res?.status) {
        console.error("Invalid response from getConfigInfo API:", res);
        return;
      }
      console.log("Config info fetched:", res?.data);
      setSteps(res?.data?.steps || []);
      return res;
    } catch (error) {
      console.error("Exception:", error);
    }
  }

  const getContractList = async () => {
    try {
      const res = await apiService.getContractList(channelName);
      if (!res?.status) {
        console.error("Invalid response from getContractList API:", res);
        return;
      }
      console.log("Contract list fetched:", res?.data);
      return res?.data;
    } catch (error) {
      console.error("Exception:", error);
    }
  }

  // const getContractURL = async () => {
  //   try {
  //     const res = await apiService.getContractURL(channelName);
  //     if (!res?.status) {
  //       console.error("Invalid response from getContractURL API:", res);
  //       return;
  //     }
  //     console.log("Contract URL fetched:", res?.data);
  //     return res?.data;
  //   } catch (error) {
  //     console.error("Exception:", error);
  //   }
  // }

  const downloadContract = async () => {
    if (isDownloading) {
      return;
    }
    setIsDownloading(true);
    try {
      const data = await getContractList();
      if (!data) {
        console.error("Invalid contractListData:", data);
        return;
      }
      const fromUrl = data?.[0]?.url;
      const toFile =
      Platform.OS === "android"
        ? `${RNFS.DownloadDirectoryPath}/${data?.[0]?.name}.${data?.[0]?.fileType}` // Android Downloads folder
        : `${RNFS.DocumentDirectoryPath}/${data?.[0]?.name}.${data?.[0]?.fileType}`; // iOS Documents folder
      const downloadResult = await RNFS.downloadFile({
        fromUrl,
        toFile,
      }).promise;
      if (downloadResult.statusCode === 200) {
        console.log("Download successful:", downloadResult);
        Alert.alert("Download successful", `File saved to: ${toFile}`);
      } else {
        console.error("Download failed:", downloadResult);
        Alert.alert("Download failed", `Status code: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error("Exception:", error);
    } finally {
      setIsDownloading(false);
    }
  }

  const confirmContract = async () => {
    if (isConfirming) {
      return;
    }
    setIsConfirming(true);
    try {
      const res = await apiService.confirmContract(channelName);
      if (!res?.status) {
        console.error("Invalid response from confirmContract API:", res);
        return;
      }
      console.log("Contract confirmed:", res?.data);
      setIsModalVisible(false);
      setIsCompleted(true);
    } catch (error) {
      console.error("Exception:", error);
    } finally {
      setIsConfirming(false);
    }
  }

  const socketService = createSocketService();
  const [socketServiceInstance, setSocketServiceInstance] = useState(socketService);
  const [areLegalPapersPassed, setAreLegalPapersPassed] = useState(false);
  const areLegalPapersPassedRef = useRef(areLegalPapersPassed);
  const [isCompleted, setIsCompleted] = useState(false);
  const isCompletedRef = useRef(isCompleted);

  useEffect(() => {
    areLegalPapersPassedRef.current = areLegalPapersPassed;
  }, [areLegalPapersPassed]);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

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
        socketService.subscribeSessionNotifyTopic(async (message) => {
          console.log("Session notify:", message.body);
          const eventType = JSON.parse(message.body)?.eventType;
          const type = JSON.parse(message.body)?.type;
          setSocketMessages((prev) => [...prev, `Session notify: ${eventType || type}`]);
          const areArraysEqual = (arrayA: any[], arrayB: any[]): boolean => {
            if (arrayA.length !== arrayB.length) {
              return false;
            }
            return arrayA.every((step, index) => step === arrayB[index]);
          }
          const contractModal = (
            <View style={{ padding: 20, backgroundColor: "white", borderRadius: 10 }}>
              <Text style={{ fontSize: 16, marginBottom: 10 }}>Vui lòng xác thực hợp đồng.</Text>
              <Button title={isDownloading ? "Đang tải..." : "Tải hợp đồng"} onPress={downloadContract}/>
              <Text></Text>
              <Button title={isConfirming ? "Đang xác thực..." : "Xác thực hợp đồng"} onPress={confirmContract}/>
              <Text></Text>
              <Button title="Đóng" onPress={() => setIsModalVisible(false)} color="red"/>
            </View>
          );
          switch (true) {
            case eventType === "START_CALL":
              console.log("Call started.");
              break;
            case eventType === "END_CALL":
              console.log("Agent left the call.");
              toResult(MessageCode.END_CALL);
              break;
            case type === "CALL_EXPIRED":
              console.log("No available agent.");
              toResult(MessageCode.CALL_EXPIRED);
              break;
            case type === "CALL_TIMEOUT":
              console.log("Call timed out.");
              toResult(MessageCode.CALL_TIMEOUT);
              break;
            case type.includes("KYC_PASSED"):
              console.log("KYC passed.");
              if (areArraysEqual(stepsRef.current, [1])) {
                setIsCompleted(true);
              }
              if (areArraysEqual(stepsRef.current, [1, 3]) && !areLegalPapersPassedRef.current) {
                setAreLegalPapersPassed(true);
                setModalContent(contractModal);
                setIsModalVisible(true);
              }
              break;
            case type.includes("LEGAL_PAPERS_PASSED") && !areLegalPapersPassedRef.current:
              console.log("Legal papers passed.");
              setAreLegalPapersPassed(true);
              if (areArraysEqual(stepsRef.current, [2]) || areArraysEqual(stepsRef.current, [1, 2])) {
                setIsCompleted(true);
              }
              if (areArraysEqual(stepsRef.current, [2, 3]) || areArraysEqual(stepsRef.current, [1, 2, 3])) {
                setModalContent(contractModal);
                setIsModalVisible(true);
              }
              break;
            case type.includes("STARTED_KYC"):
              console.log("Started KYC.");
              if (areArraysEqual(stepsRef.current, [3]) && !areLegalPapersPassedRef.current) {
                setAreLegalPapersPassed(true);
                setModalContent(contractModal);
                setIsModalVisible(true);
              }
              break;
            case type === "UPDATE_PAPERS_SUCCESS":
              console.log("Update papers success.");
              await getContractList();
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

    socketService.connect(socketService.getDeviceInfo());
    setSocketServiceInstance(socketService);
  };

  const vekycService = createVekycService();
  const [vekycServiceInstance, setVekycServiceInstance] = useState(vekycService);

  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [wifiState, setWifiState] = useState<"RED" | "YELLOW" | "GREEN">("RED");
  const [connectionState, setConnectionState] = useState(0);
  const connectionStateRef = useRef(connectionState);
  const [modalContent, setModalContent] = useState<any>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reconnectTimeout, setReconnectTimeout] = useState<any>();
  const [disconnectTimeout, setDisconnectTimeout] = useState<any>();

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

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
      onConnectionStateChanged(_connection, state) {
        // console.log("onConnectionStateChanged", state);
        setConnectionState((prev) => {
          // console.log("Previous connection state:", prev);
          switch (state) {
            case 1: // Disconnected
              break;
            case 2: // Connecting
              break;
            case 3: // Connected
              if (prev === 4) {
                setIsModalVisible(false);
                clearTimeout(reconnectTimeout);
                setReconnectTimeout(null);
                clearTimeout(disconnectTimeout);
                setDisconnectTimeout(null);
              }
              break;
            case 4: // Reconnecting
              if (prev === 3) {
                const backToHome = () => {
                  setIsModalVisible(false);
                  toResult(MessageCode.END_CALL_EARLY);
                }
                if (!reconnectTimeout) {
                  setReconnectTimeout(
                    setTimeout(() => {
                      if (connectionStateRef.current !== 4) {
                        return;
                      }
                      setModalContent(
                        <View style={{ padding: 20, backgroundColor: "white", borderRadius: 10 }}>
                          <Text style={{ fontSize: 16 }}>Kết nối mạng chập chờn...</Text>
                        </View>
                      );
                      setIsModalVisible(true);
                    }, 10000)
                );
                }
                if (!disconnectTimeout) {
                  setDisconnectTimeout(
                    setTimeout(() => {
                      if (connectionStateRef.current !== 4) {
                        return;
                      }
                      setModalContent(
                        <View style={{ padding: 20, backgroundColor: "white", borderRadius: 10 }}>
                          <Text style={{ fontSize: 16, marginBottom: 10 }}>Bạn đã bị mất kết nối.</Text>
                          <Text style={{ fontSize: 16, marginBottom: 10 }}>Vui lòng quay lại trang chủ.</Text>
                          <Button title="Quay lại trang chủ" onPress={backToHome}></Button>
                        </View>
                      );
                      setIsModalVisible(true);
                    }, 60000)
                  );
                }
              }
              break;
            case 5: // Failed
              break;
          }
          return state;
        });
      },
    });

    await vekycService.joinChannel(token, channelName, localUid, {});
    setVekycServiceInstance(vekycService);
  };

  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);

  const toggleMicrophone = () => {
    vekycServiceInstance.toggleMicrophone(!isMicrophoneEnabled);
    setIsMicrophoneEnabled((prev) => !prev);
  };

  const switchCamera = () => {
    vekycServiceInstance.switchCamera();
  }

  useEffect(() => {
    console.log("Getting config info...");
    getConfigInfo();

    console.log("Initializing socket connection...");
    connectSocket();

    console.log("Initializing call...");
    joinCall();

    return () => {
      console.log("Cleaning modal...");
      setModalContent(null);
      setIsModalVisible(false);

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
      toResult(MessageCode.END_CALL);
    } catch (error) {
      toResult(MessageCode.ERROR_CLOSE_VIDEO, `Exception: ${error}`);
    } finally {
      setIsClosingVideo(false);
    }
  }

  const toResult = (code: MessageCode, errorMessage = "") => {
    console.log("Logic check 1:", [MessageCode.END_CALL, MessageCode.END_CALL_EARLY].includes(code));
    console.log("Logic check 2:", isCompletedRef.current);
    let messageCode = code;
    if ([MessageCode.CALL_EXPIRED].includes(code)) {
      console.log("toResult CALL_EXPIRED");
    } else if (isCompletedRef.current) {
      messageCode = MessageCode.SUCCESS;
    }
    console.log("messageCode:", messageCode);
    router.replace({
      pathname: "/result",
      params: { code: encodeURIComponent(messageCode), detail: encodeURIComponent(errorMessage) },
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
        <Text onPress={toggleMicrophone} style={styles.button}>
          {isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
        </Text>
        <Text onPress={switchCamera} style={styles.button}>
          Switch Camera
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
      <Modal visible={isModalVisible} transparent={true}>
      <View style={styles.modalMask}>
        <View style={styles.modalContainer}>
          {modalContent}
        </View>
      </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, alignItems: "center" },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 10,
    marginTop: 10,
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
  btnContainer: {
    width: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 10,
  },
  button: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#0055cc",
    margin: 5,
    textAlign: "center",
  },
  buttonDisabled: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: "bold",
    color: "#666666",
    backgroundColor: "#cccccc",
    margin: 5,
    textAlign: "center",
  },
  scroll: { flex: 1, backgroundColor: "#ddeeff", width: "100%" },
  scrollContainer: { alignItems: "center" },
  videoView: { width: "90%", height: 200 },
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
  modalMask: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    height: "auto",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  }
});
