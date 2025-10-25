# Setup Instructions for Radius

## Database Setup Required

If you're seeing errors about missing tables or relations, you need to run the database migrations in your Supabase project **in the correct order**.

⚠️ **IMPORTANT**: Run migrations in the order listed below! The profiles table must be created first as other tables depend on it.

---

## Migration Order

### Step 0: Profiles Table (REQUIRED - Run First!)

This is the **foundation table** that all other tables reference.

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy the entire content from: supabase-migrations/00-profiles-table.sql
```

**File location**: `supabase-migrations/00-profiles-table.sql`

**What it does**:

- Creates the `profiles` table for user information
- Sets up auto-profile creation when users sign up
- Enables RLS policies for data security

---

### Step 1: Community Projects Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy the entire content from: supabase-migrations/community-projects.sql
```

**File location**: `supabase-migrations/community-projects.sql`

**What it does**:

- Creates `community_projects`, `project_participants`, and `project_updates` tables
- References the `profiles` table (so profiles must exist first!)

---

### Step 2: Avatars Storage Bucket

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy the entire content from: supabase-migrations/avatars-storage.sql
```

**File location**: `supabase-migrations/avatars-storage.sql`

**What it does**:

- Creates storage bucket for profile photos
- Sets up upload policies

---

### Step 3: Incentive System

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy the entire content from: supabase-migrations/incentive-system.sql
```

**File location**: `supabase-migrations/incentive-system.sql`

**What it does**:

- Creates credits, badges, and achievements tables
- References the `profiles` table

---

## Quick Setup via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** from the left sidebar
3. Click **New Query**
4. Copy the content from each migration file **IN ORDER** (starting with 00-profiles-table.sql)
5. Paste into the SQL editor
6. Click **Run** (▶️ button)
7. Verify "Success" message appears
8. Repeat for each migration file

---

## Verify Setup

After running migrations, verify in Supabase:

### Tables (Go to Table Editor):

- ✅ `profiles` (MUST exist first!)
- ✅ `community_projects`
- ✅ `project_participants`
- ✅ `project_updates`
- ✅ `credits_transactions`
- ✅ `user_badges`
- ✅ `achievements`

### Storage (Go to Storage):

- ✅ `avatars` bucket should exist

### Policies (Go to Authentication > Policies):

- Each table should have RLS enabled
- Policies should appear for SELECT, INSERT, UPDATE, DELETE

---

## Troubleshooting

### "Could not find relation between projects and profiles"

- ❌ **Problem**: The `profiles` table doesn't exist
- ✅ **Solution**: Run `00-profiles-table.sql` FIRST before any other migrations
- The error occurs because `community_projects` tries to reference `profiles(id)` as a foreign key

### "Table does not exist" Error

- You haven't run the migration for that table yet
- Run the corresponding SQL file from `supabase-migrations/`

### "Relation already exists" Error

- The table already exists, you can skip that migration
- Or use `DROP TABLE IF EXISTS` statements (be careful with production data!)

### Storage Upload Errors

- Make sure avatars bucket exists (run avatars-storage.sql)
- Check RLS policies are enabled
- Verify you're authenticated when uploading

---

## Environment Variables

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Get these values from your Supabase project settings > API.

---

## Need More Help?

Check these documentation files:

- `COMMUNITY_PROJECTS_README.md` - Community projects feature
- `AVATAR_STORAGE_SETUP.md` - Profile photo uploads
- `INCENTIVE_SYSTEM_README.md` - Credits and badges system
- `ACCESSIBILITY_README.md` - Accessibility features
