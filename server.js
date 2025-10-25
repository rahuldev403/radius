const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store WebSocket connections
const clients = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // WebSocket server
  const wss = new Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url);

    if (pathname === "/api/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws) => {
    console.log("👤 New WebSocket connection");
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
            console.log(`✅ User ${userId} authenticated`);
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
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  server.listen(port, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`🔌 WebSocket server ready on ws://${hostname}:${port}/api/ws`);
  });
});
