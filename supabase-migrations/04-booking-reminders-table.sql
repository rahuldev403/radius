-- Create booking_reminders table for automated email reminders
CREATE TABLE IF NOT EXISTS booking_reminders (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type VARCHAR(10) NOT NULL CHECK (reminder_type IN ('24h', '1h', '15min')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for efficient querying
  CONSTRAINT unique_booking_reminder UNIQUE (booking_id, reminder_type)
);

-- Index for finding pending reminders efficiently
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON booking_reminders(scheduled_for, sent) WHERE sent = FALSE;

-- Index for booking lookups
CREATE INDEX IF NOT EXISTS idx_reminders_booking ON booking_reminders(booking_id);

-- Enable RLS (Row Level Security)
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reminders for their own bookings
CREATE POLICY "Users can view their booking reminders" ON booking_reminders
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE seeker_id = auth.uid() OR provider_id = auth.uid()
    )
  );

-- Policy: System can insert reminders (for API)
CREATE POLICY "System can insert reminders" ON booking_reminders
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update reminders (for marking as sent)
CREATE POLICY "System can update reminders" ON booking_reminders
  FOR UPDATE
  USING (true);

COMMENT ON TABLE booking_reminders IS 'Stores scheduled email reminders for bookings (24h, 1h, 15min before session)';
COMMENT ON COLUMN booking_reminders.reminder_type IS 'Type of reminder: 24h (24 hours before), 1h (1 hour before), 15min (15 minutes before)';
COMMENT ON COLUMN booking_reminders.scheduled_for IS 'When the reminder should be sent';
COMMENT ON COLUMN booking_reminders.sent IS 'Whether the reminder email has been sent';
COMMENT ON COLUMN booking_reminders.sent_at IS 'When the reminder email was actually sent';
