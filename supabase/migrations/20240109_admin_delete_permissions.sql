-- ============================================
-- Admin Delete Permissions for Data Uploads
-- ============================================
-- This migration grants admins the ability to delete uploads

-- Drop policy if it exists (to make migration idempotent)
DROP POLICY IF EXISTS "Admins can delete any upload" ON public.data_uploads;

-- Allow admins to delete any upload
CREATE POLICY "Admins can delete any upload"
ON public.data_uploads
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.approved = true
  )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Admin delete permissions migration completed successfully!';
    RAISE NOTICE '✓ Admins can now delete any upload';
END $$;

