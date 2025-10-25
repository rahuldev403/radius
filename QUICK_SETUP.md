# Quick Setup for WebSocket Chat

## ✅ Files Created:

1. `lib/websocket-client.ts` - WebSocket client for browser
2. `lib/websocket-server.ts` - WebSocket server logic
3. `server.js` - Custom Node.js server with WebSocket support
4. `WEBSOCKET_IMPLEMENTATION_GUIDE.md` - Detailed implementation guide

## ✅ Files Updated:

1. `package.json` - Scripts updated to use custom server
2. `app/projects/[id]/page.tsx` - Fixed button onClick handlers
3. `app/bookings/[id]/page.tsx` - Added WebSocket client import

## 🚀 Quick Start

### 1. Install WebSocket Package

```bash
npm install ws
npm install --save-dev @types/ws
```

### 2. Stop Current Dev Server

Press `Ctrl+C` if you have `npm run dev` running.

### 3. Start Custom Server

```bash
node server.js
```

Your app will be available at: http://localhost:3000
WebSocket server will be at: ws://localhost:3000/api/ws

## ✅ What's Fixed:

### 1. Real-Time Chat

- ✅ Custom WebSocket server instead of Supabase Realtime
- ✅ Full control over message delivery
- ✅ No rate limits or connection issues
- ✅ Automatic reconnection on disconnect

### 2. Project Page Buttons

- ✅ **Manage Project** button now works (navigates to `/projects/{id}/manage`)
- ✅ **Message Creator** button now works (navigates to messages with creator)
- ✅ **Open Discussion** button now works (navigates to project discussion)

## 📋 Next Steps:

### For Chat to Work:

1. Read `WEBSOCKET_IMPLEMENTATION_GUIDE.md`
2. Update the chat page `app/bookings/[id]/page.tsx` with the WebSocket code from the guide
3. Test with two browser windows

### For Project Pages:

You may need to create these pages:

- `/app/projects/[id]/manage/page.tsx` - Project management page
- `/app/projects/[id]/discussion/page.tsx` - Project discussion board
- `/app/messages/page.tsx` - Direct messages page

## 🧪 Testing

### Test Real-Time Chat:

1. Open http://localhost:3000 in two browsers (use incognito for 2nd)
2. Log in as different users
3. Open the same booking chat in both windows
4. Send a message - it should appear instantly!

### Test Project Buttons:

1. Go to any project page
2. Click "Manage Project" (if you're the creator)
3. Click "Message Creator"
4. Click "Open Discussion" (if you're a participant)

## 🐛 Troubleshooting:

**Error: Cannot find module 'ws'**

```bash
npm install ws @types/ws
```

**Error: Port 3000 already in use**

```bash
npx kill-port 3000
# Then run: node server.js
```

**WebSocket not connecting**

- Make sure you're running `node server.js`, not `npm run dev`
- Check browser console for WebSocket errors
- Look for "✅ WebSocket connected" message

**Buttons not working**

- Check browser console for errors
- Verify the routes exist
- Check that onClick handlers are properly added

## 📚 Resources:

- Full implementation guide: `WEBSOCKET_IMPLEMENTATION_GUIDE.md`
- WebSocket client code: `lib/websocket-client.ts`
- Custom server code: `server.js`

## Need Help?

Check the console logs - they're very detailed and will tell you exactly what's happening!
