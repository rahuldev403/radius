// WebSocket Client for Real-Time Chat
type MessageCallback = (message: any) => void;
type StatusCallback = (status: "connected" | "disconnected" | "error") => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageCallbacks: Map<string, MessageCallback[]> = new Map();
  private statusCallbacks: StatusCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  constructor() {
    // Use environment variable or default to localhost
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost =
      process.env.NEXT_PUBLIC_WS_URL ||
      `${wsProtocol}//${window.location.host}`;
    this.url = `${wsHost}/api/ws`;
  }

  connect(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    this.userId = userId;
    console.log("🔌 Connecting to WebSocket:", this.url);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.reconnectAttempts = 0;
        this.notifyStatus("connected");

        // Send authentication
        this.send({
          type: "auth",
          userId: this.userId,
        });

        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 WebSocket message received:", data);

          // Handle heartbeat response
          if (data.type === "pong") {
            return;
          }

          // Notify callbacks
          const callbacks = this.messageCallbacks.get(data.type) || [];
          callbacks.forEach((cb) => cb(data));

          // Also notify 'all' listeners
          const allCallbacks = this.messageCallbacks.get("all") || [];
          allCallbacks.forEach((cb) => cb(data));
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        this.notifyStatus("error");
      };

      this.ws.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        this.notifyStatus("disconnected");
        this.stopHeartbeat();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.notifyStatus("error");
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error("WebSocket not connected");
    }
  }

  // Subscribe to specific message types
  on(type: string, callback: MessageCallback) {
    if (!this.messageCallbacks.has(type)) {
      this.messageCallbacks.set(type, []);
    }
    this.messageCallbacks.get(type)!.push(callback);
  }

  // Unsubscribe from message types
  off(type: string, callback: MessageCallback) {
    const callbacks = this.messageCallbacks.get(type);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Subscribe to connection status
  onStatus(callback: StatusCallback) {
    this.statusCallbacks.push(callback);
  }

  private notifyStatus(status: "connected" | "disconnected" | "error") {
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: "ping" });
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, delay);
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export a singleton instance
export const wsClient = new WebSocketClient();
