# Your Skill App - WebSocket Server

Standalone WebSocket server for real-time chat and notifications.

## Features

- ✅ Real-time messaging
- ✅ Video call signaling
- ✅ Project collaboration notifications
- ✅ Automatic reconnection
- ✅ Heartbeat/ping-pong
- ✅ CORS support
- ✅ Health check endpoint

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Start server:

```bash
npm start
```

Server will run on `http://localhost:8080`

## Testing

Health check:

```bash
curl http://localhost:8080/health
```

WebSocket connection:

```javascript
const ws = new WebSocket("ws://localhost:8080");
```

## Deployment to Railway

1. Push this folder to a GitHub repository
2. Go to [Railway](https://railway.app)
3. Create new project from GitHub repo
4. Set environment variables:
   - `PORT`: 8080 (Railway sets this automatically)
   - `NODE_ENV`: production
   - `ALLOWED_ORIGINS`: Your Vercel app URL
5. Deploy!

Railway will provide you with a URL like: `https://your-app.railway.app`

Use this URL in your Next.js app as: `wss://your-app.railway.app`

## Environment Variables

- `PORT`: Port number (default: 8080, Railway sets automatically)
- `NODE_ENV`: Environment (development/production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins

## API Endpoints

### Health Check

- **GET** `/health`
- Returns server status and connection count

## WebSocket Messages

### Client → Server

#### Authentication

```json
{
  "type": "auth",
  "userId": "user-uuid"
}
```

#### Send Message

```json
{
  "type": "message",
  "receiverId": "receiver-uuid",
  "data": {
    "id": "message-uuid",
    "content": "Hello!",
    "sender_id": "sender-uuid"
  }
}
```

#### Join Chat

```json
{
  "type": "join_chat",
  "bookingId": "booking-uuid"
}
```

#### Video Call Request

```json
{
  "type": "video_call_request",
  "receiverId": "receiver-uuid",
  "senderId": "sender-uuid",
  "senderName": "John Doe"
}
```

#### Project Updates

```json
{
  "type": "participant_joined",
  "projectId": "project-uuid",
  "userId": "user-uuid",
  "data": {}
}
```

### Server → Client

#### Authenticated

```json
{
  "type": "authenticated",
  "userId": "user-uuid"
}
```

#### New Message

```json
{
  "type": "new_message",
  "message": {
    "id": "message-uuid",
    "content": "Hello!",
    "sender_id": "sender-uuid"
  }
}
```

#### Message Sent Confirmation

```json
{
  "type": "message_sent",
  "messageId": "message-uuid"
}
```

## License

MIT
