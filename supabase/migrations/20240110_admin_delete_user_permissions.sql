-- ============================================
-- Admin Delete Permissions for User Roles
-- ============================================
-- This migration grants admins the ability to delete user roles (for rejection)

-- Drop policy if it exists (to make migration idempotent)
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- Allow admins to delete any user role
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
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

-- Drop policy if it exists
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Allow admins to delete any user record
CREATE POLICY "Admins can delete users"
ON public.users
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
    RAISE NOTICE '✓ Admin delete permissions for user management completed successfully!';
    RAISE NOTICE '✓ Admins can now delete user roles and user records';
END $$;

