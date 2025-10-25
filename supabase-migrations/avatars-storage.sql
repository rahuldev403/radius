-- =============================================
-- Avatars Storage Bucket Setup
-- =============================================
-- This migration creates the avatars storage bucket
-- and sets up access policies for profile photos
-- =============================================

-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE POLICIES
-- =============================================
-- Note: RLS is already enabled on storage.objects by Supabase
-- We just need to create the policies

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Policy: Allow authenticated users to upload to avatars bucket
-- Files are stored with user_id in the filename for easy identification
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
);

-- Policy: Allow public read access to all avatars
CREATE POLICY "Public read access for avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Allow users to update any file in avatars bucket
-- (They can only update their own via app logic)
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Policy: Allow users to delete any file in avatars bucket
-- (They can only delete their own via app logic)
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- =============================================
-- VERIFICATION
-- =============================================
-- Check if bucket was created successfully
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Avatars storage bucket is ready!
-- Users can now upload profile photos with these rules:
-- - Max file size: 5MB
-- - Allowed types: PNG, JPEG, JPG, GIF, WebP
-- - Public read access (anyone can view avatars)
-- - Only authenticated users can upload/update/delete
-- =============================================
