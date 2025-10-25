# Avatar Storage Setup Guide

## Problem

The profile photo upload feature wasn't working because the Supabase storage bucket "avatars" either didn't exist or wasn't configured properly.

## Solution

### Step 1: Run the SQL Migration

Execute the SQL file in your Supabase project:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `supabase-migrations/avatars-storage.sql`
6. Click **Run** or press `Ctrl+Enter`

### Step 2: Verify Storage Bucket

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. You should see an "avatars" bucket listed
3. Click on it to verify it's public and has the correct policies

### Step 3: Check Storage Policies

In the **Storage** section, click on **Policies** tab. You should see these policies for the `avatars` bucket:

- ✅ **Public read access for avatars** (SELECT for public)
- ✅ **Users can upload their own avatar** (INSERT for authenticated)
- ✅ **Users can update their own avatar** (UPDATE for authenticated)
- ✅ **Users can delete their own avatar** (DELETE for authenticated)

### Alternative: Manual Setup

If the SQL migration doesn't work, you can set up the bucket manually:

1. **Create Bucket:**

   - Go to Storage → Create New Bucket
   - Name: `avatars`
   - Public: ✅ Yes
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: `image/png, image/jpeg, image/jpg, image/gif, image/webp`

2. **Set Policies:**
   - Click on the bucket → Policies tab → New Policy
   - Add the four policies as shown in the SQL file

## What Was Fixed

1. **Enhanced Error Handling:**

   - Added detailed console logging for debugging
   - Better error messages that tell users what went wrong
   - Added authentication checks before upload

2. **Fixed File Path:**

   - Changed from `avatars/filename.ext` to just `filename.ext` (bucket path is implicit)
   - Fixed old avatar deletion logic to extract filename correctly from URL

3. **Added Validation:**
   - Checks if user is authenticated before uploading
   - Validates file size and type
   - Better handling of old avatar cleanup

## Testing

After setup, test the upload:

1. Go to `/account` page
2. Click the camera icon on the avatar
3. Select an image (under 5MB)
4. Check browser console (F12) for detailed logs
5. You should see "Avatar uploaded!" success message

## Troubleshooting

If upload still fails, check the browser console (F12) for error messages:

- **"Storage bucket not found"** → Run the SQL migration
- **"Policy violation"** → Check storage policies are set correctly
- **"File too large"** → Image must be under 5MB
- **"Invalid file type"** → Must be an image file (jpg, png, gif, webp)
- **"User not authenticated"** → Sign out and sign in again

## Technical Details

- **Bucket Name:** `avatars`
- **File Naming:** `{user_id}-{timestamp}.{extension}`
- **Max Size:** 5MB
- **Supported Formats:** PNG, JPEG, JPG, GIF, WebP
- **Public Access:** Yes (read-only)
- **User Permissions:** Users can only manage their own avatars
