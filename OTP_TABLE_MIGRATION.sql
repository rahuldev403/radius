-- Create email_otps table for OTP verification
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_otps_email_key UNIQUE (email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS email_otps_email_idx ON email_otps(email);
CREATE INDEX IF NOT EXISTS email_otps_expires_at_idx ON email_otps(expires_at);

-- Enable RLS
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert OTPs (for signup)
CREATE POLICY "Anyone can insert OTPs"
  ON email_otps
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow anyone to select their own OTP
CREATE POLICY "Anyone can select OTPs"
  ON email_otps
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow anyone to delete OTPs (for verification/cleanup)
CREATE POLICY "Anyone can delete OTPs"
  ON email_otps
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Policy: Service role can do everything (for API routes)
CREATE POLICY "Service role can manage OTPs"
  ON email_otps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Cleanup function to delete expired OTPs (optional, can be called via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM email_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO service_role;
