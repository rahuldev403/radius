-- =============================================
-- Initialize Profiles for Existing Users
-- =============================================
-- This migration creates profile entries for users that
-- existed BEFORE the profiles table was created.
-- Run this AFTER 00-profiles-table.sql
-- =============================================

-- Insert profiles for existing auth.users who don't have profiles yet
INSERT INTO profiles (
    id,
    full_name,
    email_notifications,
    push_notifications,
    credits,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User') as full_name,
    true as email_notifications,
    true as push_notifications,
    0 as credits,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Also initialize user_credits for existing users if incentive system is installed
-- This will only work if user_credits table exists (run after incentive-system.sql)
DO $$
BEGIN
    -- Check if user_credits table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        -- Insert credits for existing profiles who don't have credit accounts
        INSERT INTO user_credits (
            user_id,
            balance,
            total_earned,
            created_at,
            updated_at
        )
        SELECT 
            p.id,
            100 as balance,
            100 as total_earned,
            p.created_at,
            NOW() as updated_at
        FROM profiles p
        WHERE NOT EXISTS (
            SELECT 1 FROM user_credits uc WHERE uc.user_id = p.id
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Initialized user_credits for existing users';
    ELSE
        RAISE NOTICE 'user_credits table does not exist yet - skip credit initialization';
    END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Show count of profiles created
SELECT 
    'Profiles created' as description,
    COUNT(*) as count
FROM profiles;

-- Show count of auth users
SELECT 
    'Auth users' as description,
    COUNT(*) as count
FROM auth.users;

-- Show users without profiles (should be 0)
SELECT 
    'Users without profiles (should be 0)' as description,
    COUNT(*) as count
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- All existing users now have profiles!
-- New users will automatically get profiles via trigger
-- =============================================
