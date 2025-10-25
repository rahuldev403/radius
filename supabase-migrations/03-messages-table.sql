-- =============================================
-- Messages Table - Chat System
-- =============================================
-- This migration creates the messages table for the chat system
-- =============================================

-- Drop existing table if it exists (for clean re-runs during development)
DROP TABLE IF EXISTS messages CASCADE;

-- =============================================
-- MESSAGES TABLE
-- =============================================
-- Stores chat messages between users
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT different_sender_receiver CHECK (sender_id != receiver_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read) WHERE read = FALSE;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

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

-- =============================================
-- REALTIME PUBLICATION
-- =============================================
-- Enable realtime for the messages table
-- This allows real-time subscriptions to work
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Note: If you get an error about publication not existing, run:
-- CREATE PUBLICATION supabase_realtime FOR TABLE messages;
