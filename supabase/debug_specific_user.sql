-- ============================================
-- Debug Specific User Issue
-- ============================================
-- Run these queries to debug why ons.sansa@fondation-fondamental.org is not showing

-- 1. Check if user exists in users table
SELECT 
    id,
    email,
    full_name,
    created_at,
    user_id
FROM public.users 
WHERE email = 'ons.sansa@fondation-fondamental.org';

-- 2. Check if user has a role record
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.approved,
    ur.created_at,
    ur.approved_at,
    ur.approved_by
FROM public.user_roles ur
JOIN public.users u ON u.id = ur.user_id
WHERE u.email = 'ons.sansa@fondation-fondamental.org';

-- 3. Check auth.users table
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmed_at
FROM auth.users
WHERE email = 'ons.sansa@fondation-fondamental.org';

-- 4. Find if there's a mismatch between tables
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    u.id as users_id,
    u.email as users_email,
    ur.id as role_id,
    ur.approved as role_approved
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'ons.sansa@fondation-fondamental.org';

-- 5. Check all pending user roles with full details
SELECT 
    ur.id as role_id,
    ur.user_id,
    ur.role,
    ur.approved,
    ur.created_at as role_created_at,
    u.email,
    u.full_name,
    au.email as auth_email,
    au.confirmed_at as email_confirmed
FROM public.user_roles ur
LEFT JOIN public.users u ON u.id = ur.user_id
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.approved = false
ORDER BY ur.created_at DESC;

-- 6. Check if there are orphaned records (role without user)
SELECT ur.*
FROM public.user_roles ur
LEFT JOIN public.users u ON u.id = ur.user_id
WHERE u.id IS NULL;

-- 7. Check if user_id in user_roles matches auth.users.id
SELECT 
    ur.user_id as role_user_id,
    u.user_id as users_user_id,
    au.id as auth_user_id,
    u.email
FROM public.user_roles ur
LEFT JOIN public.users u ON u.id = ur.user_id
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE u.email = 'ons.sansa@fondation-fondamental.org';

