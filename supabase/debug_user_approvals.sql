-- ============================================
-- Debug Query for User Approvals
-- ============================================
-- Run this in Supabase SQL Editor to debug

-- Check pending user roles
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.approved,
    ur.created_at,
    u.email,
    u.full_name
FROM public.user_roles ur
LEFT JOIN public.users u ON u.id = ur.user_id
WHERE ur.approved = false
ORDER BY ur.created_at DESC;

-- Check if there are any unapproved roles
SELECT COUNT(*) as pending_count
FROM public.user_roles
WHERE approved = false;

-- Check all user roles (for admin debugging)
SELECT 
    ur.*,
    u.email
FROM public.user_roles ur
LEFT JOIN public.users u ON u.id = ur.user_id
ORDER BY ur.created_at DESC
LIMIT 20;

-- Check RLS policies on user_roles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_roles';

