# Database Migration Quick Reference

## ⚠️ CRITICAL: Migration Order

Run these migrations in **EXACT ORDER**. Do not skip or rearrange!

```
1. 00-profiles-table.sql          ← MUST RUN FIRST
2. community-projects.sql         ← Depends on profiles
3. avatars-storage.sql           ← Independent
4. incentive-system.sql          ← Depends on profiles
```

---

## Why Order Matters

### Profiles Table (Foundation)

```sql
-- Other tables reference profiles:
creator_id UUID REFERENCES profiles(id)
user_id UUID REFERENCES profiles(id)
from_user_id UUID REFERENCES profiles(id)
to_user_id UUID REFERENCES profiles(id)
```

If profiles doesn't exist, you'll get errors like:

- ❌ "relation profiles does not exist"
- ❌ "could not find relation between projects and profiles"
- ❌ "foreign key constraint violation"

---

## Quick Migration Commands

### Option 1: Supabase Dashboard (Recommended)

1. Go to SQL Editor in Supabase dashboard
2. Copy entire content of each .sql file
3. Paste and click Run
4. Verify "Success" message

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL

```bash
# Connect to your database and run:
psql [your-connection-string] < supabase-migrations/00-profiles-table.sql
psql [your-connection-string] < supabase-migrations/community-projects.sql
psql [your-connection-string] < supabase-migrations/avatars-storage.sql
psql [your-connection-string] < supabase-migrations/incentive-system.sql
```

---

## Verification Checklist

After running ALL migrations, verify:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- ✅ profiles
-- ✅ community_projects
-- ✅ project_participants
-- ✅ project_updates
-- ✅ credits_transactions
-- ✅ user_badges
-- ✅ achievements

-- Check foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

## Common Errors & Solutions

### Error: "relation profiles does not exist"

**Solution**: Run `00-profiles-table.sql` first

### Error: "duplicate key value violates unique constraint"

**Solution**: Table already exists, skip that migration or drop table first

### Error: "permission denied for table"

**Solution**: Check RLS policies are set up correctly

### Error: "could not open extension control file"

**Solution**: Ignore if using Supabase (extensions managed automatically)

---

## Rolling Back

If you need to start fresh:

```sql
-- ⚠️ WARNING: This will DELETE ALL DATA!
-- Only run in development!

DROP TABLE IF EXISTS project_updates CASCADE;
DROP TABLE IF EXISTS project_participants CASCADE;
DROP TABLE IF EXISTS community_projects CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS credits_transactions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Then re-run migrations in order
```

---

## Next Steps After Migration

1. ✅ Verify tables exist in Supabase dashboard
2. ✅ Check RLS policies are enabled
3. ✅ Test creating a user (profile should auto-create)
4. ✅ Refresh your app and test features
5. ✅ Check browser console for errors

---

## Need Help?

- 📖 Read full guide: `SETUP_INSTRUCTIONS.md`
- 🐛 Check errors: Browser DevTools → Console
- 📊 View data: Supabase Dashboard → Table Editor
- 🔒 Check policies: Supabase Dashboard → Authentication → Policies
