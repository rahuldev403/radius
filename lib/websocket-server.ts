import { Server } from "ws";
import { IncomingMessage } from "http";
import { parse } from "url";

// Store WebSocket connections
const clients = new Map<string, Set<any>>();

export function setupWebSocketServer(server: any) {
  const wss = new Server({ noServer: true });

  server.on(
    "upgrade",
    (request: IncomingMessage, socket: any, head: Buffer) => {
      const { pathname } = parse(request.url || "");

      if (pathname === "/api/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    }
  );

  wss.on("connection", (ws: any) => {
    console.log("👤 New WebSocket connection");
    let userId: string | null = null;
    let bookingId: string | null = null;

    ws.on("message", (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("📨 Received:", message);

        switch (message.type) {
          case "auth":
            // Authenticate user
            userId = message.userId;
            if (!clients.has(userId)) {
              clients.set(userId, new Set());
            }
            clients.get(userId)!.add(ws);
            console.log(`✅ User ${userId} authenticated`);
            ws.send(JSON.stringify({ type: "authenticated", userId }));
            break;

          case "join_chat":
            // Join a specific chat room
            bookingId = message.bookingId;
            console.log(`👥 User ${userId} joined chat ${bookingId}`);
            ws.send(JSON.stringify({ type: "joined_chat", bookingId }));
            break;

          case "message":
            // Broadcast message to receiver
            const receiverId = message.receiverId;
            console.log(`💬 Message from ${userId} to ${receiverId}`);

            // Send to receiver if online
            if (clients.has(receiverId)) {
              clients.get(receiverId)!.forEach((client) => {
                if (client.readyState === 1) {
                  // OPEN
                  client.send(
                    JSON.stringify({
                      type: "new_message",
                      message: message.data,
                    })
                  );
                }
              });
            }

            // Confirm to sender
            ws.send(
              JSON.stringify({
                type: "message_sent",
                messageId: message.data.id,
              })
            );
            break;

          case "message_read":
            // Notify sender that message was read
            const senderId = message.senderId;
            if (clients.has(senderId)) {
              clients.get(senderId)!.forEach((client) => {
                if (client.readyState === 1) {
                  client.send(
                    JSON.stringify({
                      type: "message_read_update",
                      messageIds: message.messageIds,
                    })
                  );
                }
              });
            }
            break;

          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    ws.on("close", () => {
      console.log("👋 WebSocket connection closed");
      if (userId && clients.has(userId)) {
        clients.get(userId)!.delete(ws);
        if (clients.get(userId)!.size === 0) {
          clients.delete(userId);
        }
      }
    });

    ws.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
    });
  });

  console.log("🚀 WebSocket server initialized");
  return wss;
}
