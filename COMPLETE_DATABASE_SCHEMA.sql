-- ========================================
-- RADIUS SKILL SHARING PLATFORM
-- Complete Database Schema
-- ========================================

-- Enable PostGIS for geolocation features
CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- TABLES
-- ========================================

-- 1. Profiles (extends Supabase auth.users)
-- Already exists, ensure it has these columns:
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Services
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster provider queries
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);

-- 3. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seeker ON bookings(seeker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);

-- 4. Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  notification_type TEXT CHECK (notification_type IN ('email', 'push', 'sms')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cron job queries
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at, sent);
CREATE INDEX IF NOT EXISTS idx_reminders_booking ON reminders(booking_id);

-- 5. Messages (Chat)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat queries
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 6. Reviews & Ratings
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

-- 7. Endorsements (Skill validation)
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

-- 8. Community Projects
CREATE TABLE IF NOT EXISTS community_projects (
  id SERIAL PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(Point, 4326),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_projects_location ON community_projects USING GIST(location);

-- 9. Project Participants
CREATE TABLE IF NOT EXISTS project_participants (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('organizer', 'contributor', 'volunteer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Index for participant queries
CREATE INDEX IF NOT EXISTS idx_project_participants_project ON project_participants(project_id);
CREATE INDEX IF NOT EXISTS idx_project_participants_user ON project_participants(user_id);

-- 10. User Credits (Incentive system)
CREATE TABLE IF NOT EXISTS user_credits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Credit Transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for credit, negative for debit
  type TEXT CHECK (type IN ('earned', 'spent', 'donated', 'bonus', 'refund')),
  description TEXT,
  related_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  related_project_id INTEGER REFERENCES community_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for transaction queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function: Get services within radius
CREATE OR REPLACE FUNCTION get_services_nearby(
  user_lat FLOAT,
  user_lng FLOAT,
  distance_meters FLOAT
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  description TEXT,
  category TEXT,
  provider_id UUID,
  provider_name TEXT,
  provider_location GEOGRAPHY
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.category,
    p.id AS provider_id,
    p.full_name AS provider_name,
    p.location AS provider_location
  FROM services s
  JOIN profiles p ON s.provider_id = p.id
  WHERE
    p.location IS NOT NULL
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      distance_meters
    )
  ORDER BY
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate user average rating
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

-- Function: Get credit balance
CREATE OR REPLACE FUNCTION get_user_credits(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  user_balance INTEGER;
BEGIN
  SELECT balance INTO user_balance
  FROM user_credits
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(user_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON community_projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Initialize user credits on profile creation
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.id, 100) -- Give 100 credits to new users
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_credits
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_credits();

-- Trigger: Award credits on completed booking
CREATE OR REPLACE FUNCTION award_credits_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Award credits to provider
    INSERT INTO credit_transactions (user_id, amount, type, description, related_booking_id)
    VALUES (NEW.provider_id, 10, 'earned', 'Earned from completed service', NEW.id);
    
    UPDATE user_credits
    SET balance = balance + 10
    WHERE user_id = NEW.provider_id;
    
    -- Deduct credits from seeker
    INSERT INTO credit_transactions (user_id, amount, type, description, related_booking_id)
    VALUES (NEW.seeker_id, -10, 'spent', 'Paid for service', NEW.id);
    
    UPDATE user_credits
    SET balance = balance - 10
    WHERE user_id = NEW.seeker_id AND balance >= 10;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_credits
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION award_credits_on_completion();

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Services: Everyone can read, only owner can update/delete
CREATE POLICY "Services are viewable by everyone" ON services
  FOR SELECT USING (true);

CREATE POLICY "Users can create own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can update own services" ON services
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Users can delete own services" ON services
  FOR DELETE USING (auth.uid() = provider_id);

-- Bookings: Users can see bookings they're involved in
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = provider_id OR auth.uid() = seeker_id
  );

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (
    auth.uid() = provider_id OR auth.uid() = seeker_id
  );

-- Messages: Users can see messages they sent or received
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reviews: Everyone can read, only booking participants can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Endorsements: Everyone can read, authenticated users can create
CREATE POLICY "Endorsements are viewable by everyone" ON endorsements
  FOR SELECT USING (true);

CREATE POLICY "Users can create endorsements" ON endorsements
  FOR INSERT WITH CHECK (auth.uid() = endorser_id);

-- Community Projects: Everyone can read, authenticated users can create
CREATE POLICY "Projects are viewable by everyone" ON community_projects
  FOR SELECT USING (true);

CREATE POLICY "Users can create projects" ON community_projects
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own projects" ON community_projects
  FOR UPDATE USING (auth.uid() = creator_id);

-- User Credits: Users can only view their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- INITIAL DATA (Optional)
-- ========================================

-- Insert default categories (optional)
-- You can reference these in your frontend
-- No separate categories table needed, but you could create one

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Spatial index for profiles location
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);

-- Full-text search indexes (optional, for search functionality)
CREATE INDEX IF NOT EXISTS idx_services_title_search ON services USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_services_description_search ON services USING GIN(to_tsvector('english', description));

-- ========================================
-- VIEWS (Optional, for convenience)
-- ========================================

-- View: Booking details with all related info
CREATE OR REPLACE VIEW booking_details AS
SELECT
  b.id,
  b.start_time,
  b.end_time,
  b.status,
  b.created_at,
  s.title AS service_title,
  s.category AS service_category,
  p_provider.full_name AS provider_name,
  p_provider.avatar_url AS provider_avatar,
  p_seeker.full_name AS seeker_name,
  p_seeker.avatar_url AS seeker_avatar
FROM bookings b
JOIN services s ON b.service_id = s.id
JOIN profiles p_provider ON b.provider_id = p_provider.id
JOIN profiles p_seeker ON b.seeker_id = p_seeker.id;

-- View: User statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT
  p.id,
  p.full_name,
  COUNT(DISTINCT s.id) AS services_offered,
  COUNT(DISTINCT b_provider.id) AS sessions_provided,
  COUNT(DISTINCT b_seeker.id) AS sessions_attended,
  COALESCE(AVG(r.rating), 0)::NUMERIC(3,2) AS average_rating,
  COUNT(DISTINCT r.id) AS review_count,
  COALESCE(uc.balance, 0) AS credit_balance
FROM profiles p
LEFT JOIN services s ON p.id = s.provider_id
LEFT JOIN bookings b_provider ON p.id = b_provider.provider_id
LEFT JOIN bookings b_seeker ON p.id = b_seeker.seeker_id
LEFT JOIN reviews r ON p.id = r.reviewee_id
LEFT JOIN user_credits uc ON p.id = uc.user_id
GROUP BY p.id, p.full_name, uc.balance;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ========================================
-- NOTES
-- ========================================

-- 1. Run this script in your Supabase SQL editor
-- 2. Make sure PostGIS extension is enabled
-- 3. Test all functions after creation
-- 4. Set up Supabase Auth properly
-- 5. Configure SMTP for email notifications (optional)
-- 6. Set up cron jobs for reminders (use pg_cron or external service)

-- ========================================
-- END OF SCHEMA
-- ========================================
