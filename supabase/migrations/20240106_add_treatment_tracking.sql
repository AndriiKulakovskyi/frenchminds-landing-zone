-- Migration: Add treatment tracking to data uploads
-- This allows admins to track which uploads have been reviewed/treated

-- Add reviewed_by column (references the admin who reviewed the upload)
ALTER TABLE public.data_uploads
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add reviewed_at column (timestamp when the upload was marked as treated)
ALTER TABLE public.data_uploads
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Create index for faster queries on reviewed_by
CREATE INDEX IF NOT EXISTS idx_data_uploads_reviewed_by ON public.data_uploads(reviewed_by);

-- Create index for faster queries on reviewed_at
CREATE INDEX IF NOT EXISTS idx_data_uploads_reviewed_at ON public.data_uploads(reviewed_at);

-- Update RLS policy to allow admins to update review fields
DROP POLICY IF EXISTS "Admins can update all uploads" ON public.data_uploads;
CREATE POLICY "Admins can update all uploads"
ON public.data_uploads
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Note: reviewed_by will be set when admin clicks "Mark as Treated"
-- reviewed_at will be automatically set to current timestamp at that time

