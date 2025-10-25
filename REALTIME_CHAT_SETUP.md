# Real-Time Chat Setup Guide

## What I Fixed

### 1. **Improved Real-Time Subscription** (`app/bookings/[id]/page.tsx`)

- ✅ Added detailed console logging to debug connection issues
- ✅ Added filters to reduce unnecessary events (`filter: sender_id=in.(...)`)
- ✅ Added presence tracking for user status
- ✅ Better error handling for connection states (TIMED_OUT, CLOSED, etc.)
- ✅ Toast notifications for connection status
- ✅ Improved duplicate message detection

### 2. **Updated Supabase Client** (`lib/supabase.ts`)

- ✅ Added real-time configuration options
- ✅ Enabled session persistence
- ✅ Auto token refresh
- ✅ Set events per second limit

## How Supabase Realtime Works

Supabase Realtime **DOES use WebSockets** under the hood! You don't need to set up separate WebSocket servers. Supabase handles all of that for you.

## Required Setup in Supabase Dashboard

You need to **enable Realtime for the messages table** in your Supabase dashboard:

### Step 1: Enable Realtime Replication

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Database** → **Replication** in the left sidebar
4. Find the `messages` table in the list
5. **Toggle ON** the switch next to `messages`

### Step 2: Verify Realtime is Enabled

1. Go to **Settings** → **API**
2. Scroll down to **Realtime** section
3. Make sure **Enable Realtime** is checked
4. Copy your Realtime URL (should be like `wss://[project-ref].supabase.co/realtime/v1`)

### Step 3: Run the Messages Migration

Execute the SQL in `supabase-migrations/03-messages-table.sql` to create/update the messages table with proper structure and RLS policies.

## Testing Real-Time Chat

1. **Open two browser windows** (or use incognito mode for the second window)
2. Log in as **different users** in each window
3. Open the **same booking chat** in both windows
4. Send a message from one window
5. **It should appear instantly** in the other window without refreshing!

## Debugging

Check the browser console for these logs:

- 🔌 `Setting up realtime subscription for chat:` - Subscription starting
- ✅ `Realtime subscription active for booking:` - Connected successfully
- 📨 `New message received via realtime:` - Message received
- ❌ `Realtime subscription error` - Connection problem

### Common Issues

#### Issue 1: "Connection issue. Messages may be delayed"

**Solution**: Enable Realtime replication for the `messages` table (see Step 1 above)

#### Issue 2: Messages only show after refresh

**Solution**:

- Check if Realtime is enabled in Supabase Settings
- Verify RLS policies allow SELECT on messages
- Check browser console for errors

#### Issue 3: "TIMED_OUT" status

**Solution**:

- Check your internet connection
- Verify Supabase project status
- Try refreshing the page

#### Issue 4: Duplicate messages

**Solution**: Already handled! The code checks for existing messages before adding.

## What You Should See

When real-time is working correctly:

- ✅ Toast notification "Connected to real-time chat" appears
- ✅ Messages from other users appear instantly
- ✅ No need to refresh the page
- ✅ Toast notifications for new messages
- ✅ Unread count updates automatically

## Additional Features Included

- 📱 **Browser notifications** for new messages (if permitted)
- 🔔 **Toast notifications** for chat updates
- 👀 **Auto mark as read** when viewing chat
- 🔄 **Automatic reconnection** on connection loss
- 📊 **Presence tracking** (shows who's online)

## Troubleshooting Commands

If real-time still doesn't work, run this SQL to verify table publication:

```sql
-- Check if messages table is published to realtime
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE tablename = 'messages';
```

If it returns no rows, run:

```sql
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## Need More Help?

1. Check Supabase Realtime status: https://status.supabase.com
2. Review Supabase Realtime docs: https://supabase.com/docs/guides/realtime
3. Check browser console for detailed error messages
