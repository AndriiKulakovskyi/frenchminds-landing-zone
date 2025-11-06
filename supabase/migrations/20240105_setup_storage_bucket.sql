-- Migration: Setup storage bucket for clinical data uploads
-- This creates the storage bucket and sets up Row Level Security policies

-- Note: Storage buckets are created via the Supabase Dashboard or API
-- This SQL provides the RLS policies needed after bucket creation

-- Create storage bucket policies for 'clinical-data-uploads' bucket

-- Policy 1: Allow authenticated users to upload files to their own folder
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-data-uploads',
  'clinical-data-uploads',
  false,
  10737418240, -- 10 GB in bytes
  NULL -- Allow all mime types
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10737418240,
  public = false;

-- Policy 2: Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clinical-data-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 3: Allow users to view their own uploaded files
CREATE POLICY IF NOT EXISTS "Allow users to view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'clinical-data-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 4: Allow users to update their own files
CREATE POLICY IF NOT EXISTS "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clinical-data-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 5: Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'clinical-data-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 6: Allow admins to view all files
CREATE POLICY IF NOT EXISTS "Allow admins to view all files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'clinical-data-uploads' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Note: File structure will be: modality/user_id/timestamp_filename
-- Example: clinical/uuid-here/1234567890_data.csv

