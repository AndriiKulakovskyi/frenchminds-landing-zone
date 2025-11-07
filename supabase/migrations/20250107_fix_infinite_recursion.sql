-- ============================================
-- Fix Infinite Recursion in user_roles Policy
-- ============================================
-- This migration removes the problematic policy that causes
-- infinite recursion when checking user_roles to access user_roles

-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Verify that the base policy exists (from initial setup)
-- This should already exist and allows all authenticated users to view roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can view roles'
  ) THEN
    RAISE NOTICE 'Creating base "Users can view roles" policy';
    CREATE POLICY "Users can view roles" 
    ON public.user_roles 
    FOR SELECT 
    USING (true);
  ELSE
    RAISE NOTICE 'Base "Users can view roles" policy already exists - no action needed';
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✓ Infinite recursion fix completed!';
  RAISE NOTICE '✓ Removed problematic "Admins can view all roles" policy';
  RAISE NOTICE '✓ Verified base "Users can view roles" policy exists';
  RAISE NOTICE '';
  RAISE NOTICE 'The user_roles table now uses the simple USING (true) policy';
  RAISE NOTICE 'which prevents infinite recursion while maintaining security.';
  RAISE NOTICE 'Admin-specific operations are protected at the application layer.';
END $$;

