-- =============================================
-- Services & Bookings - Database Schema
-- =============================================
-- This migration creates tables for the service marketplace
-- where users can offer services and others can book them
-- =============================================

-- Drop existing tables if they exist (for clean re-runs during development)
DROP FUNCTION IF EXISTS get_services_nearby(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- =============================================
-- 1. SERVICES TABLE
-- =============================================
-- Stores all services offered by users
CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2),
    duration INTEGER, -- Duration in minutes
    availability JSONB, -- JSON object with available time slots
    location VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_price CHECK (price IS NULL OR price >= 0),
    CONSTRAINT valid_duration CHECK (duration IS NULL OR duration > 0),
    CONSTRAINT valid_category CHECK (category IN (
        'Teaching & Tutoring',
        'Home Services',
        'Creative Services',
        'Fitness & Wellness',
        'Technology',
        'Professional Services',
        'Other'
    )),
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude IS NOT NULL AND longitude IS NOT NULL AND 
         latitude >= -90 AND latitude <= 90 AND 
         longitude >= -180 AND longitude <= 180)
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_location ON services(latitude, longitude);
CREATE INDEX idx_services_created_at ON services(created_at DESC);

-- =============================================
-- 2. BOOKINGS TABLE
-- =============================================
-- Tracks service bookings between seekers and providers
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT different_users CHECK (provider_id != seeker_id)
);

-- Create indexes
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_seeker ON bookings(seeker_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- =============================================
-- 3. REVIEWS TABLE
-- =============================================
-- Stores reviews and ratings for completed services
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT unique_booking_review UNIQUE (booking_id, reviewer_id)
);

-- Create indexes
CREATE INDEX idx_reviews_service ON reviews(service_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Services Policies
-- Anyone can view active services
CREATE POLICY "Anyone can view active services"
    ON services FOR SELECT
    TO authenticated
    USING (is_active = true OR provider_id = auth.uid());

-- Users can insert their own services
CREATE POLICY "Users can create their own services"
    ON services FOR INSERT
    TO authenticated
    WITH CHECK (provider_id = auth.uid());

-- Users can update their own services
CREATE POLICY "Users can update their own services"
    ON services FOR UPDATE
    TO authenticated
    USING (provider_id = auth.uid())
    WITH CHECK (provider_id = auth.uid());

-- Users can delete their own services
CREATE POLICY "Users can delete their own services"
    ON services FOR DELETE
    TO authenticated
    USING (provider_id = auth.uid());

-- Bookings Policies
-- Users can view bookings they're involved in
CREATE POLICY "Users can view their bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (provider_id = auth.uid() OR seeker_id = auth.uid());

-- Users can create bookings as seekers
CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (seeker_id = auth.uid());

-- Providers and seekers can update bookings
CREATE POLICY "Users can update their bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (provider_id = auth.uid() OR seeker_id = auth.uid())
    WITH CHECK (provider_id = auth.uid() OR seeker_id = auth.uid());

-- Users can cancel their bookings
CREATE POLICY "Users can delete their bookings"
    ON bookings FOR DELETE
    TO authenticated
    USING (provider_id = auth.uid() OR seeker_id = auth.uid());

-- Reviews Policies
-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
    ON reviews FOR SELECT
    TO authenticated
    USING (true);

-- Users can create reviews for bookings they participated in
CREATE POLICY "Users can create reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (reviewer_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "Users can update their reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (reviewer_id = auth.uid())
    WITH CHECK (reviewer_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY "Users can delete their reviews"
    ON reviews FOR DELETE
    TO authenticated
    USING (reviewer_id = auth.uid());

-- =============================================
-- 5. FUNCTIONS
-- =============================================

-- Function to get services near a location
CREATE OR REPLACE FUNCTION get_services_nearby(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    distance_meters INTEGER DEFAULT 50000
)
RETURNS TABLE (
    id BIGINT,
    provider_id UUID,
    provider_name TEXT,
    provider_location TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    price DECIMAL,
    duration INTEGER,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance DOUBLE PRECISION,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Validate input parameters
    IF user_lat IS NULL OR user_lng IS NULL THEN
        RAISE EXCEPTION 'User coordinates cannot be null';
    END IF;
    
    IF distance_meters IS NULL OR distance_meters <= 0 THEN
        RAISE EXCEPTION 'Distance must be a positive number';
    END IF;

    RETURN QUERY
    SELECT 
        s.id,
        s.provider_id,
        COALESCE(p.full_name, 'Unknown')::TEXT as provider_name,
        COALESCE(p.location, '')::TEXT as provider_location,
        s.title,
        s.description,
        s.category,
        s.price,
        s.duration,
        s.latitude,
        s.longitude,
        -- Calculate distance using Haversine formula (in meters)
        -- Add COALESCE to handle any NULL issues
        COALESCE(
            (
                6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(user_lat)) * 
                        cos(radians(s.latitude)) * 
                        cos(radians(s.longitude) - radians(user_lng)) + 
                        sin(radians(user_lat)) * 
                        sin(radians(s.latitude))
                    ))
                )
            ), 0.0
        ) as distance,
        s.is_active,
        s.created_at
    FROM services s
    INNER JOIN profiles p ON s.provider_id = p.id
    WHERE 
        s.is_active = true
        AND s.latitude IS NOT NULL 
        AND s.longitude IS NOT NULL
        -- Filter by distance using bounding box first (faster)
        AND s.latitude BETWEEN (user_lat - (distance_meters / 111000.0)) AND (user_lat + (distance_meters / 111000.0))
        AND s.longitude BETWEEN (user_lng - (distance_meters / (111000.0 * GREATEST(cos(radians(user_lat)), 0.001)))) 
                            AND (user_lng + (distance_meters / (111000.0 * GREATEST(cos(radians(user_lat)), 0.001))))
    HAVING
        -- Then apply exact distance calculation
        COALESCE(
            (
                6371000 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(user_lat)) * 
                        cos(radians(s.latitude)) * 
                        cos(radians(s.longitude) - radians(user_lng)) + 
                        sin(radians(user_lat)) * 
                        sin(radians(s.latitude))
                    ))
                )
            ), 0.0
        ) <= distance_meters
    ORDER BY distance ASC;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in get_services_nearby: %', SQLERRM;
        RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- =============================================
-- 6. SAMPLE DATA (Optional - Comment out for production)
-- =============================================
-- Uncomment to insert sample services for testing

/*
-- Note: Replace these UUIDs with actual user IDs from your profiles table
INSERT INTO services (provider_id, title, description, category, price, duration, location, latitude, longitude)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Web Development Tutoring', 'Learn modern web development with React and Next.js', 'Teaching & Tutoring', 50.00, 60, 'San Francisco, CA', 37.7749, -122.4194),
    ('00000000-0000-0000-0000-000000000002', 'Photography Sessions', 'Professional photography for portraits and events', 'Creative Services', 150.00, 120, 'New York, NY', 40.7128, -74.0060),
    ('00000000-0000-0000-0000-000000000003', 'Personal Training', 'One-on-one fitness coaching and nutrition advice', 'Fitness & Wellness', 75.00, 60, 'Los Angeles, CA', 34.0522, -118.2437);
*/

-- =============================================
-- VERIFICATION
-- =============================================
-- Run these queries to verify the setup:

-- Check if tables were created
SELECT 
    'services' as table_name,
    COUNT(*) as row_count
FROM services
UNION ALL
SELECT 
    'bookings' as table_name,
    COUNT(*) as row_count
FROM bookings
UNION ALL
SELECT 
    'reviews' as table_name,
    COUNT(*) as row_count
FROM reviews;

-- Check if function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name = 'get_services_nearby'
    AND routine_schema = 'public';

-- Test the get_services_nearby function with sample coordinates
-- (San Francisco coordinates - will return empty if no services exist)
-- SELECT * FROM get_services_nearby(37.7749, -122.4194, 50000);

-- =============================================
-- HELPFUL QUERIES
-- =============================================

-- Create a test service (uncomment and modify with real user ID):
/*
INSERT INTO services (
    provider_id, 
    title, 
    description, 
    category, 
    price, 
    duration, 
    location, 
    latitude, 
    longitude
)
VALUES (
    'YOUR_USER_ID_HERE',
    'Test Service',
    'This is a test service to verify the setup',
    'Teaching & Tutoring',
    50.00,
    60,
    'Your City',
    37.7749,  -- Your latitude
    -122.4194  -- Your longitude
);
*/

-- View all services with provider info:
-- SELECT s.*, p.full_name, p.location 
-- FROM services s 
-- JOIN profiles p ON s.provider_id = p.id;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Services marketplace is ready!
-- 
-- Next steps:
-- 1. Verify function exists (run query above)
-- 2. Create test service (uncomment and run INSERT above)
-- 3. Test in app: Navigate to /home and check map
-- 
-- If you see "Error fetching services: {}" in browser:
-- - Check browser console for detailed error
-- - Verify migration ran successfully
-- - Confirm at least one service exists with coordinates
-- - Check RLS policies allow your user to view services
-- =============================================
