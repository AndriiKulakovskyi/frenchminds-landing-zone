# Troubleshooting: Admin Cannot See Pending Approvals

## Issue
Administrator cannot see pending approval requests for new Principal Investigator accounts in the User Approvals tab.

## Root Causes

There are several possible causes for this issue:

### 1. Missing DELETE Permissions (Most Likely)
When we implemented the user rejection feature, we didn't add the necessary RLS policies to allow admins to delete from `user_roles` and `users` tables.

### 2. Data Inconsistency
Previous rejection attempts might have partially deleted data, leaving orphaned records.

### 3. RLS Policy Issues
The SELECT policy might not be working correctly for the admin user.

## Solutions

### Step 1: Apply Missing Migration

Apply the new migration file to grant admins delete permissions:

**File**: `supabase/migrations/20240110_admin_delete_user_permissions.sql`

This migration adds:
- DELETE policy for `user_roles` table (for admins)
- DELETE policy for `users` table (for admins)

**To apply:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of the migration file
3. Execute the query

### Step 2: Debug with Console Logs

The updated `user-approval.tsx` component now includes comprehensive logging:

1. Open your browser's Developer Console (F12)
2. Navigate to Admin Dashboard → User Approvals tab
3. Check the console for these logs:
   - `Current user: [user_id]` - Confirms you're authenticated
   - `Roles query result:` - Shows if the query succeeded
   - `Found X pending user roles` - Shows how many pending users were found
   - `Users query result:` - Shows if user details were fetched
   - `Formatted pending users:` - Shows the final data

### Step 3: Run Debug Queries

Use the provided debug SQL file to check your database directly:

**File**: `supabase/debug_user_approvals.sql`

Run these queries in Supabase SQL Editor:

```sql
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
```

This will show:
- If there are any pending users in the database
- If there are orphaned role records (role exists but user doesn't)
- User details for pending approvals

### Step 4: Verify Admin Role

Confirm your admin user has the proper role:

```sql
SELECT * FROM public.user_roles 
WHERE user_id = 'YOUR_USER_ID' 
AND role = 'admin' 
AND approved = true;
```

Replace `YOUR_USER_ID` with your actual user ID.

### Step 5: Check RLS Policies

Verify RLS policies are correctly set:

```sql
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
WHERE tablename IN ('user_roles', 'users');
```

Expected policies:
- `Users can view roles` (SELECT on user_roles)
- `Admins can update roles` (UPDATE on user_roles)
- `Users can insert own role` (INSERT on user_roles)
- `Admins can delete user roles` (DELETE on user_roles) ← NEW
- `Admins can delete users` (DELETE on users) ← NEW

## Testing the Fix

After applying the migration:

1. **Test with a new sign-up:**
   - Create a new test account
   - Check if it appears in Admin → User Approvals

2. **Test approval:**
   - Click "Approve" button
   - Verify user appears in approved list
   - Verify user can log in

3. **Test rejection:**
   - Create another test account
   - Click "Reject" button
   - Verify success toast appears
   - Verify user disappears from pending list
   - Verify counter decrements

## Common Issues

### Issue: "No pending approvals" but users can't log in
**Solution**: Users might be in auth.users but missing role records. Run:
```sql
SELECT au.id, au.email, ur.role, ur.approved
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.id IS NULL;
```

### Issue: Error in console about permissions
**Solution**: Make sure the migration is applied and RLS is enabled:
```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Issue: Orphaned role records
**Solution**: Clean up orphaned records:
```sql
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM public.users);
```

## Files Modified

1. `supabase/migrations/20240110_admin_delete_user_permissions.sql` - NEW migration
2. `src/components/user-approval.tsx` - Added debug logging
3. `supabase/debug_user_approvals.sql` - NEW debug queries file

## Next Steps

1. Apply the migration
2. Check browser console for debug logs
3. Run debug SQL queries
4. Report back with the console output and query results

This will help us identify the exact cause and fix the issue.

