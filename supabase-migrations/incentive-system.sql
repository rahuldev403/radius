-- =============================================
-- Incentive Mechanism - Database Schema
-- =============================================
-- This migration creates tables for the credit/reward system
-- where users can give credits to providers and earn badges
-- =============================================

-- Drop existing tables if they exist (for clean re-runs during development)
DROP TABLE IF EXISTS badge_assignments CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;

-- =============================================
-- 1. USER CREDITS TABLE
-- =============================================
-- Tracks credit balance for each user
CREATE TABLE user_credits (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 100, -- Starting balance for new users
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    total_received INTEGER NOT NULL DEFAULT 0, -- For providers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT positive_balance CHECK (balance >= 0),
    CONSTRAINT unique_user_credits UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX idx_user_credits_user ON user_credits(user_id);
CREATE INDEX idx_user_credits_balance ON user_credits(balance DESC);
CREATE INDEX idx_user_credits_total_received ON user_credits(total_received DESC);

-- =============================================
-- 2. CREDIT TRANSACTIONS TABLE
-- =============================================
-- Records all credit transactions (earning, spending, giving)
CREATE TABLE credit_transactions (
    id BIGSERIAL PRIMARY KEY,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reason TEXT,
    reference_type VARCHAR(50), -- 'booking', 'service', 'project', 'donation', etc.
    reference_id BIGINT, -- ID of the related booking/service/project
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_transaction_type CHECK (transaction_type IN (
        'tip', 
        'reward', 
        'bonus', 
        'signup', 
        'referral', 
        'booking_completion',
        'service_creation',
        'project_completion',
        'community_donation',
        'admin_grant'
    ))
);

-- Create indexes
CREATE INDEX idx_credit_transactions_from_user ON credit_transactions(from_user_id);
CREATE INDEX idx_credit_transactions_to_user ON credit_transactions(to_user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_reference ON credit_transactions(reference_type, reference_id);

-- =============================================
-- 3. BADGES TABLE
-- =============================================
-- Defines available badges and their requirements
CREATE TABLE badges (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL, -- Emoji or icon identifier
    tier VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL, -- Tailwind color class
    credits_required INTEGER NOT NULL, -- Total credits received needed to earn
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_tier CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    CONSTRAINT positive_credits_required CHECK (credits_required >= 0)
);

-- Create indexes
CREATE INDEX idx_badges_tier ON badges(tier);
CREATE INDEX idx_badges_credits_required ON badges(credits_required);

-- =============================================
-- 4. BADGE ASSIGNMENTS TABLE
-- =============================================
-- Tracks which users have earned which badges
CREATE TABLE badge_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id BIGINT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- Create indexes
CREATE INDEX idx_badge_assignments_user ON badge_assignments(user_id);
CREATE INDEX idx_badge_assignments_badge ON badge_assignments(badge_id);
CREATE INDEX idx_badge_assignments_earned_at ON badge_assignments(earned_at DESC);

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_assignments ENABLE ROW LEVEL SECURITY;

-- User Credits Policies
-- Users can view all user credits (for leaderboard)
CREATE POLICY "Anyone can view user credits"
    ON user_credits FOR SELECT
    TO authenticated
    USING (true);

-- Users can only update their own credits through functions
-- Direct updates are restricted - use functions instead
CREATE POLICY "No direct credit updates"
    ON user_credits FOR UPDATE
    TO authenticated
    USING (false);

-- Credit Transactions Policies
-- Users can view transactions they're involved in
CREATE POLICY "Users can view their transactions"
    ON credit_transactions FOR SELECT
    TO authenticated
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Transactions are created through functions only
CREATE POLICY "No direct transaction inserts"
    ON credit_transactions FOR INSERT
    TO authenticated
    WITH CHECK (false);

-- Badges Policies
-- Anyone can view badges
CREATE POLICY "Anyone can view badges"
    ON badges FOR SELECT
    TO authenticated
    USING (true);

-- Badge Assignments Policies
-- Anyone can view badge assignments
CREATE POLICY "Anyone can view badge assignments"
    ON badge_assignments FOR SELECT
    TO authenticated
    USING (true);

-- Badge assignments are created through functions only
CREATE POLICY "No direct badge assignments"
    ON badge_assignments FOR INSERT
    TO authenticated
    WITH CHECK (false);

-- =============================================
-- 6. FUNCTIONS
-- =============================================

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id, balance, total_earned)
    VALUES (NEW.id, 100, 100) -- Start with 100 credits
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Record signup bonus transaction
    INSERT INTO credit_transactions (to_user_id, amount, transaction_type, reason)
    VALUES (NEW.id, 100, 'signup', 'Welcome bonus for joining the platform');
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to initialize credits for new users
CREATE TRIGGER initialize_credits_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_credits();

-- Function to give credits from one user to another
CREATE OR REPLACE FUNCTION give_credits(
    p_from_user_id UUID,
    p_to_user_id UUID,
    p_amount INTEGER,
    p_transaction_type VARCHAR(50),
    p_reason TEXT DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_from_balance INTEGER;
    v_result JSONB;
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
    END IF;
    
    -- Validate users are different
    IF p_from_user_id = p_to_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot give credits to yourself');
    END IF;
    
    -- Check sender has enough credits
    SELECT balance INTO v_from_balance
    FROM user_credits
    WHERE user_id = p_from_user_id
    FOR UPDATE;
    
    IF v_from_balance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sender credit account not found');
    END IF;
    
    IF v_from_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;
    
    -- Deduct from sender
    UPDATE user_credits
    SET 
        balance = balance - p_amount,
        total_spent = total_spent + p_amount,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_from_user_id;
    
    -- Add to receiver
    UPDATE user_credits
    SET 
        balance = balance + p_amount,
        total_received = total_received + p_amount,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_to_user_id;
    
    -- If receiver doesn't have credit account, create one
    IF NOT FOUND THEN
        INSERT INTO user_credits (user_id, balance, total_received)
        VALUES (p_to_user_id, p_amount, p_amount);
    END IF;
    
    -- Record transaction
    INSERT INTO credit_transactions (
        from_user_id, 
        to_user_id, 
        amount, 
        transaction_type, 
        reason,
        reference_type,
        reference_id
    )
    VALUES (
        p_from_user_id, 
        p_to_user_id, 
        p_amount, 
        p_transaction_type, 
        p_reason,
        p_reference_type,
        p_reference_id
    );
    
    -- Check if receiver earned any new badges
    PERFORM check_and_assign_badges(p_to_user_id);
    
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', (SELECT balance FROM user_credits WHERE user_id = p_from_user_id)
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check and assign badges based on total credits received
CREATE OR REPLACE FUNCTION check_and_assign_badges(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_total_received INTEGER;
    v_badge RECORD;
BEGIN
    -- Get user's total received credits
    SELECT total_received INTO v_total_received
    FROM user_credits
    WHERE user_id = p_user_id;
    
    -- Check each badge requirement
    FOR v_badge IN 
        SELECT id, credits_required 
        FROM badges 
        WHERE credits_required <= v_total_received
        ORDER BY credits_required DESC
    LOOP
        -- Assign badge if not already earned
        INSERT INTO badge_assignments (user_id, badge_id)
        VALUES (p_user_id, v_badge.id)
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END LOOP;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to award credits (for system actions like completing bookings)
CREATE OR REPLACE FUNCTION award_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_type VARCHAR(50),
    p_reason TEXT DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
    END IF;
    
    -- Add credits to user
    UPDATE user_credits
    SET 
        balance = balance + p_amount,
        total_earned = total_earned + p_amount,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;
    
    -- If user doesn't have credit account, create one
    IF NOT FOUND THEN
        INSERT INTO user_credits (user_id, balance, total_earned)
        VALUES (p_user_id, p_amount, p_amount);
    END IF;
    
    -- Record transaction
    INSERT INTO credit_transactions (
        to_user_id, 
        amount, 
        transaction_type, 
        reason,
        reference_type,
        reference_id
    )
    VALUES (
        p_user_id, 
        p_amount, 
        p_transaction_type, 
        p_reason,
        p_reference_type,
        p_reference_id
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'new_balance', (SELECT balance FROM user_credits WHERE user_id = p_user_id)
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on user_credits
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_credits_updated_at();

-- =============================================
-- 7. SEED INITIAL BADGES
-- =============================================

INSERT INTO badges (name, description, icon, tier, color, credits_required) VALUES
    ('Newcomer', 'Welcome to the community! You''ve received your first credits.', '🌟', 'bronze', 'gray', 0),
    ('Rising Star', 'You''re making an impact! Earned 100 credits from the community.', '⭐', 'bronze', 'amber', 100),
    ('Trusted Helper', 'People appreciate your help! Earned 250 credits.', '🤝', 'silver', 'blue', 250),
    ('Community Champion', 'You''re a valued member! Earned 500 credits.', '🏆', 'silver', 'purple', 500),
    ('Service Hero', 'Outstanding service provider! Earned 1000 credits.', '🦸', 'gold', 'yellow', 1000),
    ('Expert Provider', 'Your expertise shines! Earned 2500 credits.', '💎', 'gold', 'emerald', 2500),
    ('Master Contributor', 'Exceptional contributions! Earned 5000 credits.', '👑', 'platinum', 'cyan', 5000),
    ('Legend', 'You''re a legend in the community! Earned 10000 credits.', '🌠', 'diamond', 'pink', 10000);

-- =============================================
-- END OF MIGRATION
-- =============================================

-- Verify tables were created
SELECT 'Incentive System Migration completed successfully!' AS status;
SELECT 
    'user_credits' AS table_name,
    COUNT(*) AS row_count
FROM user_credits
UNION ALL
SELECT 
    'credit_transactions' AS table_name,
    COUNT(*) AS row_count
FROM credit_transactions
UNION ALL
SELECT 
    'badges' AS table_name,
    COUNT(*) AS row_count
FROM badges
UNION ALL
SELECT 
    'badge_assignments' AS table_name,
    COUNT(*) AS row_count
FROM badge_assignments;
