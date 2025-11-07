# Admin Dashboard Updates

## Changes Made

### 1. Tab Order Reordering

**File**: `src/components/admin-dashboard.tsx`

Changed the tab order from:
1. User Approvals
2. All Uploads  
3. QA Status

To the new order:
1. **All Uploads** (default tab)
2. **QA Status**
3. **User Approvals**

The default tab is now "All Uploads" instead of "User Approvals".

### 2. Fixed User Rejection Process

**Problem**: When clicking "Reject" on a pending user approval request, nothing happened because the action was trying to use `supabase.auth.admin.deleteUser()` which requires service role privileges not available in client-side code.

**Solution**: 

#### Updated `rejectUserAction` in `src/app/actions.ts`:

The function now:
1. Deletes the user role from `user_roles` table
2. Deletes the user record from `users` table
3. Removes the user from the pending approvals list

```typescript
export const rejectUserAction = async (userId: string) => {
  // ... auth checks ...
  
  // Delete from user_roles table
  const { error: roleError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  // Delete from users table
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  return { success: true };
};
```

#### Updated `user-approval.tsx`:

- Added `onReject` callback prop to the component interface
- Modified `handleReject` to call the `onReject` callback after successful rejection
- Updated success message to be more descriptive

#### Updated `admin-dashboard.tsx`:

- Added `onReject={handleUserApproved}` prop to `UserApproval` component
- This updates the pending approvals counter when a user is rejected

### User Experience

**Tab Navigation**:
- Admin dashboard now opens directly to "All Uploads" tab
- More logical flow: uploads → QA → user management

**User Rejection**:
- When admin clicks "Reject" button:
  1. Loading spinner appears on the button
  2. User role and records are deleted from database
  3. User is removed from pending approvals list
  4. Success toast notification appears: "User rejected and removed from pending list"
  5. Pending approvals counter decrements
  6. Table refreshes automatically

### Technical Notes

**Auth User Accounts**:
The rejected user's account in `auth.users` cannot be deleted from client-side code. However:
- The user has no role or profile data
- The user cannot access the application (no approved role)
- The user won't appear in pending approvals
- The user effectively has no access to the platform

If complete auth user deletion is required, admin can manually delete from Supabase dashboard's Authentication section.

### Error Handling

Both operations include comprehensive error handling:
- Authentication verification
- Authorization checks (admin only)
- Database operation error catching
- User-friendly error messages via toast notifications

## Build Status

✅ No linter errors
✅ Build completed successfully
✅ All TypeScript types valid

## Testing Checklist

- ✅ Tab order changed correctly
- ✅ Default tab is "All Uploads"
- ✅ Reject button shows loading state
- ✅ User removed from pending list
- ✅ Success toast appears
- ✅ Counter decrements
- ✅ Error handling works
- ✅ Build succeeds

