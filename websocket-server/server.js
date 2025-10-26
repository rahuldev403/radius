require("dotenv").config();
const http = require("http");
const { Server } = require("ws");

const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:3001"];

// Store WebSocket connections
const clients = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  // CORS headers
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin) || origin?.includes("vercel.app")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  // Health check endpoint
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        connections: clients.size,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

// WebSocket server
const wss = new Server({
  server,
  verifyClient: (info) => {
    const origin = info.origin;
    // Allow all origins in development, verify in production
    if (process.env.NODE_ENV === "production") {
      return (
        ALLOWED_ORIGINS.some((allowed) => origin?.includes(allowed)) ||
        origin?.includes("vercel.app")
      );
    }
    return true;
  },
});

wss.on("connection", (ws, req) => {
  console.log("👤 New WebSocket connection from:", req.headers.origin);
  let userId = null;

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("📨 Received:", message.type);

      switch (message.type) {
        case "auth":
          userId = message.userId;
          if (!clients.has(userId)) {
            clients.set(userId, new Set());
          }
          clients.get(userId).add(ws);
          console.log(
            `✅ User ${userId} authenticated. Total connections: ${clients.size}`
          );
          ws.send(JSON.stringify({ type: "authenticated", userId }));
          break;

        case "join_chat":
          console.log(`👥 User ${userId} joined chat ${message.bookingId}`);
          ws.send(
            JSON.stringify({
              type: "joined_chat",
              bookingId: message.bookingId,
            })
          );
          break;

        case "message":
          const receiverId = message.receiverId;
          console.log(`💬 Message from ${userId} to ${receiverId}`);

          // Send to receiver if online
          if (clients.has(receiverId)) {
            clients.get(receiverId).forEach((client) => {
              if (client.readyState === 1) {
                // WebSocket.OPEN
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
          const senderId = message.senderId;
          if (clients.has(senderId)) {
            clients.get(senderId).forEach((client) => {
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

        case "video_call_request":
          const callReceiverId = message.receiverId;
          console.log(`📹 Video call from ${userId} to ${callReceiverId}`);

          // Send to receiver if online
          if (clients.has(callReceiverId)) {
            clients.get(callReceiverId).forEach((client) => {
              if (client.readyState === 1) {
                client.send(
                  JSON.stringify({
                    type: "video_call_request",
                    senderId: message.senderId || userId,
                    senderName: message.senderName,
                  })
                );
              }
            });
            console.log(`✅ Video call request sent to ${callReceiverId}`);
          } else {
            console.log(`⚠️ User ${callReceiverId} not online`);
          }
          break;

        case "participant_joined":
        case "participant_left":
        case "project_updated":
          // Broadcast to all connected clients (for project updates)
          const projectId = message.projectId;
          console.log(
            `📢 Broadcasting ${message.type} for project ${projectId}`
          );

          clients.forEach((clientSet, clientUserId) => {
            clientSet.forEach((client) => {
              if (client.readyState === 1 && clientUserId !== userId) {
                client.send(
                  JSON.stringify({
                    type: message.type,
                    projectId: projectId,
                    userId: message.userId,
                    data: message.data,
                  })
                );
              }
            });
          });
          break;

        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;

        default:
          console.log(`⚠️ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("👋 WebSocket connection closed");
    if (userId && clients.has(userId)) {
      clients.get(userId).delete(ws);
      if (clients.get(userId).size === 0) {
        clients.delete(userId);
      }
    }
    console.log(`📊 Total connections: ${clients.size}`);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Allowed origins:`, ALLOWED_ORIGINS);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
