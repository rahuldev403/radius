-- ========================================
-- ADD REVIEW SYSTEM TO EXISTING DATABASE
-- Run this if you already have the basic tables
-- ========================================

-- 1. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- Indexes for review queries
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);

-- 2. Endorsements Table
CREATE TABLE IF NOT EXISTS endorsements (
  id SERIAL PRIMARY KEY,
  endorser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endorser_id, endorsee_id, skill)
);

-- Index for endorsement queries
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsee ON endorsements(endorsee_id);

-- 3. Function: Calculate user average rating
CREATE OR REPLACE FUNCTION get_user_average_rating(user_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2) INTO avg_rating
  FROM reviews
  WHERE reviewee_id = user_uuid;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- 4. Enable RLS on new tables
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 6. RLS Policies for Endorsements
CREATE POLICY "Endorsements are viewable by everyone" ON endorsements
  FOR SELECT USING (true);

CREATE POLICY "Users can create endorsements" ON endorsements
  FOR INSERT WITH CHECK (auth.uid() = endorser_id);

-- ========================================
-- Test the new tables
-- ========================================

-- Test if tables exist
SELECT 'reviews' AS table_name, count(*) AS row_count FROM reviews
UNION ALL
SELECT 'endorsements' AS table_name, count(*) AS row_count FROM endorsements;

-- Test the rating function
-- Replace 'user-uuid-here' with an actual user ID
-- SELECT get_user_average_rating('user-uuid-here');
