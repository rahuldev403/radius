-- ================================================
-- Radius App - Profiles Table Schema
-- Run this in Supabase SQL Editor
-- ================================================

-- Enable PostGIS extension for location queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ================================================
-- PROFILES TABLE
-- ================================================

-- Drop and recreate table (⚠️ WARNING: Only use this for fresh setup)
-- Uncomment the line below if you want to start fresh
-- DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table with all required fields
CREATE TABLE IF NOT EXISTS profiles (
  -- Primary key linked to auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User information
  email TEXT,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Location using PostGIS geography type
  location GEOGRAPHY(POINT, 4326),
  
  -- Gamification & Stats
  credits INTEGER DEFAULT 100,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- IMPORTANT: Make sure all columns allow NULL
-- ================================================
-- Run these to ensure existing table has correct constraints
DO $$ 
BEGIN
  -- Make email nullable if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
  END IF;
  
  -- Make other columns nullable
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ALTER COLUMN full_name DROP NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ALTER COLUMN bio DROP NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ALTER COLUMN avatar_url DROP NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ALTER COLUMN location DROP NOT NULL;
  END IF;
END $$;

-- ================================================
-- INDEXES for Performance
-- ================================================

-- Drop ALL existing indexes on profiles table (including problematic ones)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public'
    AND indexname NOT LIKE '%pkey%'  -- Don't drop primary key
  ) 
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname) || ' CASCADE';
  END LOOP;
END $$;

-- Create indexes only if columns exist and have correct types
DO $$
BEGIN
  -- Only create location index if column exists and is GEOGRAPHY type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'location'
    AND udt_name = 'geography'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_location 
      ON profiles USING GIST(location)
      WHERE location IS NOT NULL;
  END IF;
  
  -- Create email index if column exists (works with TEXT or VARCHAR)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_email 
      ON profiles(email)
      WHERE email IS NOT NULL;
  END IF;
END $$;

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Policy: Anyone can view profiles (for discovery)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Policy: Users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before each update
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to calculate distance between two points in kilometers
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
  ) / 1000; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- VERIFY SETUP
-- ================================================

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles';

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ================================================
-- SAMPLE QUERIES (for testing)
-- ================================================

-- 1. Find profiles within 10km of a location
-- Example: Find profiles near San Francisco (37.7749, -122.4194)
/*
SELECT 
  id,
  full_name,
  email,
  ST_Distance(
    location,
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography
  ) / 1000 as distance_km
FROM profiles
WHERE location IS NOT NULL
  AND ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
    10000 -- 10km in meters
  )
ORDER BY distance_km;
*/

-- 2. Count profiles with location set
/*
SELECT COUNT(*) as profiles_with_location
FROM profiles
WHERE location IS NOT NULL;
*/

-- 3. Get all profiles (limited to 10)
/*
SELECT 
  id,
  email,
  full_name,
  bio,
  credits,
  rating,
  created_at
FROM profiles
LIMIT 10;
*/

-- ================================================
-- OPTIONAL: Create other related tables
-- ================================================

-- Email OTPs table (for email verification during signup)
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow all operations (this is a temporary table)
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Allow all operations on email_otps (it's temporary and self-cleaning)
DROP POLICY IF EXISTS "Allow all operations on email_otps" ON email_otps;
CREATE POLICY "Allow all operations on email_otps"
  ON email_otps
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- You might want to create these tables as well:

/*
-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_per_hour NUMERIC(10, 2),
  duration INTEGER, -- in minutes
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  total_price NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email OTPs table (for verification)
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

-- ================================================
-- NOTES
-- ================================================

/*
IMPORTANT NOTES:

1. Make sure PostGIS extension is enabled
2. All profile fields except 'id' should allow NULL
3. Default values are set for credits (100) and stats (0)
4. Location uses GEOGRAPHY type for accurate distance calculations
5. RLS is enabled but allows public read access for discovery
6. Users can only modify their own profiles

AFTER RUNNING THIS SCRIPT:

1. Check that the table was created successfully
2. Verify RLS policies are in place
3. Test inserting a sample profile
4. Update your application code if needed

TROUBLESHOOTING:

If you get errors about existing objects:
- Either drop them first with DROP TABLE/POLICY/TRIGGER
- Or comment out the CREATE statements for existing objects

If location queries don't work:
- Make sure PostGIS extension is enabled
- Check that location column uses GEOGRAPHY(POINT, 4326)
- Verify spatial index exists
*/
