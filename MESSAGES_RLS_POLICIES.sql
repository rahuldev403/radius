-- Enable RLS on messages table if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages they send" ON messages;
DROP POLICY IF EXISTS "Users can update messages they receive" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Policy: Users can view messages they send or receive
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy: Users can insert messages they send
CREATE POLICY "Users can insert messages they send"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- Policy: Users can update messages they receive (for marking as read)
CREATE POLICY "Users can update messages they receive"
ON messages FOR UPDATE
USING (
  auth.uid() = receiver_id
)
WITH CHECK (
  auth.uid() = receiver_id
);

-- Policy: Users can delete their own sent or received messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE messages_id_seq TO authenticated;
