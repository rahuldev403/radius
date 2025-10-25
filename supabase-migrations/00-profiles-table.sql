-- =============================================
-- PROFILES TABLE - Base User Profile Schema
-- =============================================
-- This migration creates the profiles table that extends auth.users
-- with additional user information needed throughout the app.
-- 
-- IMPORTANT: Run this migration BEFORE any other migrations!
-- Other tables reference profiles(id) as foreign keys.
-- =============================================

-- Drop existing table if it exists (for clean re-runs during development)
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================
-- PROFILES TABLE
-- =============================================
-- Stores extended user profile information
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    phone VARCHAR(20),
    location VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    skills TEXT[],
    interests TEXT[],
    availability JSONB,
    credits INTEGER DEFAULT 0,
    total_services_provided INTEGER DEFAULT 0,
    total_services_received INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    onboarding_completed BOOLEAN DEFAULT false,
    preferred_language VARCHAR(10) DEFAULT 'en',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_credits CHECK (credits >= 0),
    CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5),
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL AND 
         latitude >= -90 AND latitude <= 90 AND 
         longitude >= -180 AND longitude <= 180)
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view profiles (public read)
CREATE POLICY "profiles_select_public"
    ON profiles FOR SELECT
    USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "profiles_delete_own"
    ON profiles FOR DELETE
    USING (auth.uid() = id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================
-- This trigger automatically creates a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email_notifications, push_notifications)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        true,
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SAMPLE DATA (Optional - Comment out for production)
-- =============================================
-- Uncomment below to insert sample profiles for testing

/*
-- Note: These UUIDs should match existing users in auth.users
-- You'll need to replace these with actual user IDs from your auth.users table

INSERT INTO profiles (id, full_name, bio, location, skills, credits, onboarding_completed)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'John Doe', 'Web developer passionate about teaching', 'San Francisco, CA', ARRAY['JavaScript', 'React', 'Node.js'], 100, true),
    ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'Graphic designer and photography enthusiast', 'New York, NY', ARRAY['Photoshop', 'Illustrator', 'Photography'], 150, true),
    ('00000000-0000-0000-0000-000000000003', 'Bob Johnson', 'Fitness coach and nutrition expert', 'Los Angeles, CA', ARRAY['Personal Training', 'Nutrition', 'Yoga'], 75, true);
*/

-- =============================================
-- VERIFICATION
-- =============================================
-- Run these queries to verify the setup:

-- Check if table was created
-- SELECT * FROM profiles LIMIT 5;

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Profiles table is now ready!
-- Next steps:
-- 1. Verify table creation: SELECT COUNT(*) FROM profiles;
-- 2. Test creating a new user (profile should auto-create)
-- 3. Run dependent migrations (services, bookings, community-projects, etc.)
-- =============================================
