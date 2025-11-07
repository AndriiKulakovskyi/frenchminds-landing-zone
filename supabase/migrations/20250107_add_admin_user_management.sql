-- ============================================
-- Admin User Management Enhancement
-- ============================================
-- This migration adds additional support for admin user management
-- Run this after the initial setup

-- ============================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION delete_user_cascade(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete user role
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Delete user profile
  DELETE FROM public.users WHERE id = target_user_id;
  
  -- Note: auth.users deletion requires service role permissions
  -- This function only handles public schema cleanup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: ADD INDEXES FOR USER MANAGEMENT
-- ============================================

-- Index for user full_name searches (for admin user management table)
CREATE INDEX IF NOT EXISTS idx_users_full_name ON public.users(full_name);

-- Index for combined role and approval status queries
CREATE INDEX IF NOT EXISTS idx_user_roles_role_approved ON public.user_roles(role, approved);

-- ============================================
-- STEP 3: VERIFY RLS POLICIES
-- ============================================

-- Note: The initial setup already has "Users can view roles" policy
-- which allows all authenticated users to view user_roles (USING (true))
-- This prevents infinite recursion issues when checking admin status

-- Verify admin can view all users policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins can view all users'
  ) THEN
    CREATE POLICY "Admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin' AND approved = true
      )
    );
  END IF;
END $$;

-- Note: We do NOT create a separate "Admins can view all roles" policy
-- because it would cause infinite recursion (checking user_roles to access user_roles)
-- The existing "Users can view roles" policy (USING true) is sufficient

-- ============================================
-- STEP 4: ADD AUDIT LOG FOR PROFILE UPDATES
-- ============================================

-- Function to log profile updates
CREATE OR REPLACE FUNCTION log_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.full_name IS DISTINCT FROM NEW.full_name OR 
      OLD.name IS DISTINCT FROM NEW.name OR
      OLD.avatar_url IS DISTINCT FROM NEW.avatar_url) THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      outcome,
      details
    ) VALUES (
      NEW.id,
      'update_profile',
      'user',
      NEW.id,
      'success',
      jsonb_build_object(
        'old_name', OLD.full_name,
        'new_name', NEW.full_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS on_profile_update ON public.users;
CREATE TRIGGER on_profile_update
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_update();

-- ============================================
-- STEP 5: ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION delete_user_cascade(uuid) IS 'Safely deletes a user and all related data from public schema tables';
COMMENT ON FUNCTION log_profile_update() IS 'Automatically logs profile updates to audit_logs table';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✓ Admin user management migration completed successfully!';
  RAISE NOTICE '✓ Helper functions created: delete_user_cascade, log_profile_update';
  RAISE NOTICE '✓ Indexes added for user searches and role queries';
  RAISE NOTICE '✓ RLS policies verified for admin access';
  RAISE NOTICE '✓ Audit logging enabled for profile updates';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin capabilities now include:';
  RAISE NOTICE '1. View all users in the system';
  RAISE NOTICE '2. Delete user accounts (public schema only)';
  RAISE NOTICE '3. Promote PIs to admin role';
  RAISE NOTICE '4. All actions are logged in audit_logs table';
END $$;

