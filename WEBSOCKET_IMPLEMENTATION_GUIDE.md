# WebSocket Chat Implementation Guide

## IMPORTANT: Due to the length of changes needed, here's a step-by-step guide to implement WebSocket chat.

### Step 1: Install WebSocket Package

Run this in your terminal:

```bash
npm install ws
npm install --save-dev @types/ws
```

### Step 2: Update Scripts in package.json (Already Done ✅)

The scripts have been updated to use the custom server.

### Step 3: Start the Custom Server

Instead of `npm run dev`, you now need to run:

```bash
node server.js
```

This will start both the Next.js app and the WebSocket server on the same port.

### Step 4: Fix Project Page Buttons

The "Manage Project" and "Message Creator" buttons in `/app/projects/[id]/page.tsx` need onClick handlers.

Add these functions before the return statement:

```typescript
const handleManageProject = () => {
  router.push(`/projects/${id}/manage`);
};

const handleMessageCreator = () => {
  // Create or find existing chat with creator
  router.push(`/messages/${project.creator.id}`);
};

const handleOpenDiscussion = () => {
  router.push(`/projects/${id}/discussion`);
};
```

Then update the buttons:

```tsx
{
  /* Manage Project Button */
}
<Button
  variant="outline"
  className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
  onClick={handleManageProject}
>
  <Edit className="w-4 h-4 mr-2" />
  Manage Project
</Button>;

{
  /* Message Creator Button */
}
<Button
  variant="outline"
  size="sm"
  className="mt-3 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
  onClick={handleMessageCreator}
>
  <MessageCircle className="w-4 h-4 mr-2" />
  Message Creator
</Button>;

{
  /* Open Discussion Button */
}
<Button
  className="w-full bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
  onClick={handleOpenDiscussion}
>
  <MessageCircle className="w-4 h-4 mr-2" />
  Open Discussion
</Button>;
```

### Step 5: Replace Supabase Realtime in Chat Page

In `/app/bookings/[id]/page.tsx`, find the section starting with `// --- Real-time Subscription Effect ---` (around line 174) and replace the entire useEffect hook with:

```typescript
// --- WebSocket Real-time Subscription Effect ---
useEffect(() => {
  if (!booking || !currentUser) return;

  console.log("🔌 Setting up WebSocket for chat:", id);

  // Connect to WebSocket
  wsClient.connect(currentUser.id);

  // Join this specific chat room
  wsClient.send({
    type: "join_chat",
    bookingId: id,
  });

  // Handle connection status
  const handleStatus = (status: "connected" | "disconnected" | "error") => {
    console.log("🔔 WebSocket status:", status);
    if (status === "connected") {
      toast.success("Connected to real-time chat", { duration: 2000 });
    } else if (status === "error" || status === "disconnected") {
      toast.error("Connection issue. Messages may be delayed.");
    }
  };

  // Handle incoming messages
  const handleNewMessage = (data: any) => {
    if (data.type === "new_message") {
      console.log("📨 New message received via WebSocket:", data.message);
      const newMsg = data.message;

      // Add message to state if not already present
      setMessages((currentMessages) => {
        const exists = currentMessages.some((msg) => msg.id === newMsg.id);
        if (exists) return currentMessages;
        return [...currentMessages, newMsg];
      });

      // Show notification if message is from other user
      if (newMsg.sender_id !== currentUser.id) {
        const otherUser =
          newMsg.sender_id === booking.provider.id
            ? booking.provider
            : booking.seeker;

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`New message from ${otherUser.full_name}`, {
            body: newMsg.content,
            icon: otherUser.avatar_url || "/logo.png",
            tag: `chat-${id}`,
          });
        }

        toast.info(`${otherUser.full_name}: ${newMsg.content}`);
        setUnreadCount((prev) => prev + 1);
      }
    }
  };

  wsClient.onStatus(handleStatus);
  wsClient.on("new_message", handleNewMessage);
  wsClient.on("all", handleNewMessage);

  // Cleanup on unmount
  return () => {
    console.log("🧹 Cleaning up WebSocket subscription");
    wsClient.off("new_message", handleNewMessage);
    wsClient.off("all", handleNewMessage);
  };
}, [booking, currentUser, id]);
```

### Step 6: Update Send Message Handler

Find the `handleSendMessage` function and update it to broadcast via WebSocket:

```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim() || !currentUser || !booking) return;

  const content = newMessage.trim();
  setNewMessage("");

  try {
    const receiverId =
      currentUser.id === booking.provider.id
        ? booking.seeker.id
        : booking.provider.id;

    // Save to database
    const { data: savedMessage, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content: content,
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Broadcast via WebSocket
    wsClient.send({
      type: "message",
      receiverId: receiverId,
      data: savedMessage,
    });

    // Add to local state immediately
    setMessages((prev) => [...prev, savedMessage]);
  } catch (err: any) {
    console.error("Error sending message:", err);
    toast.error("Failed to send message");
  }
};
```

### Step 7: Testing

1. **Stop your current dev server** (Ctrl+C)
2. **Start the new custom server**:
   ```bash
   node server.js
   ```
3. **Open two browser windows** (use incognito for the second)
4. **Log in as different users** in each window
5. **Open the same booking chat** in both windows
6. **Send messages** - they should appear instantly!

### Troubleshooting

**Issue: "Cannot find module 'ws'"**

- Run: `npm install ws @types/ws`

**Issue: Port already in use**

- Kill the process on port 3000: `npx kill-port 3000`
- Or change the port in `server.js`

**Issue: WebSocket connection refused**

- Check that `node server.js` is running (not `npm run dev`)
- Check browser console for WebSocket errors
- Verify the WebSocket URL in console logs

**Issue: Messages not appearing in real-time**

- Check browser console for "✅ User [id] authenticated"
- Check for "📨 New message received via WebSocket"
- Make sure both users are in the same booking chat

### Why WebSocket Instead of Supabase Realtime?

✅ **Full Control**: You own the WebSocket infrastructure
✅ **No Rate Limits**: Supabase has connection limits
✅ **Custom Logic**: Implement any real-time feature you want
✅ **Cost Effective**: No additional Supabase costs
✅ **Better Performance**: Direct server-to-client communication

### Next Steps

Once this is working, you can extend it to:

- Project discussion boards
- Live presence indicators
- Typing indicators
- Read receipts
- File sharing notifications
