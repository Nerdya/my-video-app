import { Client, IMessage, StompHeaders } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class SocketService {
  private client?: Client;

  /**
   * Initializes the STOMP client.
   * @param socketUrl - The WebSocket server URL.
   * @param useSockJS - Whether to use SockJS instead of native WebSocket.
   */
  initialize(socketUrl: string, useSockJS: boolean = true): void {
    this.client = new Client({
      webSocketFactory: useSockJS
        ? () => new SockJS(socketUrl, null, { timeout: 30000 })
        : undefined, // Use native WebSocket if `useSockJS` is false
      brokerURL: useSockJS ? undefined : socketUrl, // Only set brokerURL if not using SockJS
      reconnectDelay: 5000,
      heartbeatIncoming: 5000,
      heartbeatOutgoing: 5000,
      debug: (data) => {
        console.log(`[${new Date()}]`, data);
      },
    });
  }

  /**
   * Connects to the STOMP WebSocket server.
   * @param sessionKey - The session key for the user.
   * @param token - The authentication token.
   * @param deviceInfo - Device information to send in headers.
   */
  connect(sessionKey: string, token: string, deviceInfo: Record<string, any>): void {
    if (!this.client) {
      console.error('STOMP client is not initialized.');
      return;
    }

    if (this.client.connected) {
      console.warn('STOMP client is already connected.');
      return;
    }

    const socketHeaders: StompHeaders = {
      'Access-Control-Allow-Origin': '*',
      token,
      deviceInfo: JSON.stringify(deviceInfo),
    };

    this.client.connectHeaders = socketHeaders;

    this.client.activate();
  }

  /**
   * Subscribes to a topic.
   * @param topic - The topic to subscribe to.
   * @param callback - The callback to handle incoming messages.
   */
  subscribe(topic: string, callback: (message: IMessage) => void): void {
    if (!this.client || !this.client.connected) {
      console.error('STOMP client is not connected.');
      return;
    }

    this.client.subscribe(topic, callback);
  }

  /**
   * Registers event handlers for the STOMP client.
   * @param sessionKey - The session key for the user.
   */
  registerEventHandlers(sessionKey: string): void {
    if (!this.client) {
      console.error('STOMP client is not initialized.');
      return;
    }

    this.client.onConnect = (frame) => {
      console.log('Connected:', frame);

      // Example: Subscribe to topics
      this.client?.subscribe(`/user/${sessionKey}/notify`, (res) => {
        console.log('Notification:', JSON.parse(res.body));
      });

      this.client?.subscribe(`/user/health`, (res) => {
        console.log('Health:', res);
      });

      this.client?.subscribe(`/app/live`, (res) => {
        console.log('Live:', res);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message'], frame.body);
    };

    this.client.onWebSocketClose = (event) => {
      console.log('WebSocket closed:', event);
    };

    this.client.onWebSocketError = (event) => {
      console.error('WebSocket error:', event);
    };
  }

  /**
   * Disconnects from the STOMP WebSocket server.
   */
  disconnect(): void {
    if (!this.client || !this.client.connected) {
      console.warn('STOMP client is not connected.');
      return;
    }

    this.client.deactivate();
    console.log('STOMP connection closed.');
  }

  /**
   * Cleans up the STOMP client instance.
   */
  cleanup(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = undefined;
      console.log('STOMP client cleaned up.');
    }
  }
}

/**
 * Factory function to create an instance of SocketService.
 * @returns A new instance of SocketService.
 */
export function createSocketService() {
  return new SocketService();
}
