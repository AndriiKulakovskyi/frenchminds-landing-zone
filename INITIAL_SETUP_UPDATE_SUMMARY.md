# Updated Initial Setup Script - Summary

## What Was Updated

The `supabase/migrations/initial-setup.sql` script has been **completely updated** to include all features and fixes developed throughout the project.

## Key Additions

### 1. QA Pipeline Columns (data_uploads table)
```sql
file_type text DEFAULT 'unknown'           -- Detected file type
qa_status text DEFAULT 'not_started'       -- QA validation status
qa_report jsonb                            -- Full QA results
qa_score numeric                           -- Quality score (0-100)
qa_completed_at timestamp with time zone   -- QA completion time
```

### 2. Additional Indexes
```sql
idx_data_uploads_file_type    -- For file type queries
idx_data_uploads_qa_status    -- For QA status filtering
```

### 3. Admin Delete Permissions

#### Users Table
- **NEW**: `Admins can delete users` policy

#### User Roles Table  
- **NEW**: `Admins can delete user roles` policy
- **UPDATED**: `Admins can update roles` now requires `approved = true`

#### Data Uploads Table
- **NEW**: `Admins can delete any upload` policy
- **UPDATED**: `Admins can update all uploads` now requires `approved = true`

#### Storage Bucket
- **NEW**: `Allow admins to delete all files` policy
- **UPDATED**: `Allow admins to view all files` now requires `approved = true`

### 4. Enhanced Security

All admin-only policies now check for `approved = true`:
```sql
EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND approved = true  -- <-- IMPORTANT
)
```

This prevents unapproved admin accounts from having elevated privileges.

## What This Fixes

### ✅ Pending User Approvals Issue
- Admins can now properly delete user roles when rejecting sign-ups
- Admins can delete user records for rejected accounts

### ✅ Upload Deletion Issue  
- Admins can delete uploads from both database and S3 storage
- Proper RLS policies in place for secure deletion

### ✅ QA Pipeline Support
- Database fully configured for CSV QA validation
- File type tracking and modality-specific QA

### ✅ Security Hardening
- All admin operations require approval
- Prevents privilege escalation
- Follows principle of least privilege

## Files Modified

1. **supabase/migrations/initial-setup.sql**
   - 446 lines (up from 380)
   - Added QA columns
   - Added delete policies
   - Enhanced security checks
   - Updated success messages

## How to Apply

### For New Installations
```sql
-- Simply run the entire script in Supabase SQL Editor
-- File: supabase/migrations/initial-setup.sql
```

### For Existing Databases

**Option 1**: Apply individual migrations (safer)
1. `20240107_add_csv_qa_pipeline.sql`
2. `20240108_add_file_type_tracking.sql`
3. `20240109_admin_delete_permissions.sql`
4. `20240110_admin_delete_user_permissions.sql`

**Option 2**: Manual update (if migrations not available)
```sql
-- Add QA columns
ALTER TABLE public.data_uploads 
ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS qa_status text DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS qa_report jsonb,
ADD COLUMN IF NOT EXISTS qa_score numeric,
ADD COLUMN IF NOT EXISTS qa_completed_at timestamp with time zone;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_data_uploads_file_type 
ON public.data_uploads(file_type);

CREATE INDEX IF NOT EXISTS idx_data_uploads_qa_status 
ON public.data_uploads(qa_status);

-- Then run all the policy updates from initial-setup.sql
```

## Verification

After applying, check:

```sql
-- 1. Verify QA columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'data_uploads' 
AND column_name IN ('file_type', 'qa_status', 'qa_report', 'qa_score', 'qa_completed_at');

-- 2. Verify delete policies exist
SELECT policyname 
FROM pg_policies 
WHERE policyname IN (
    'Admins can delete users',
    'Admins can delete user roles', 
    'Admins can delete any upload',
    'Allow admins to delete all files'
);

-- 3. Verify admin approval checks
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename IN ('user_roles', 'data_uploads') 
AND cmd = 'UPDATE';
-- Should see "approved = true" in the qual column
```

## Benefits

1. **Single Source of Truth**: One script sets up everything
2. **Production Ready**: Includes all security hardening
3. **Feature Complete**: QA pipeline, file types, admin permissions
4. **Idempotent**: Safe to run multiple times
5. **Well Documented**: Comprehensive comments and messages

## Testing Checklist

After applying the updated script:

- [ ] Admin can approve user sign-ups
- [ ] Admin can reject user sign-ups (delete user roles)
- [ ] Admin can delete uploaded files (database + storage)
- [ ] QA validation runs for CSV uploads
- [ ] QA results are stored in database
- [ ] File types are detected and stored
- [ ] Only approved admins can delete
- [ ] Regular users cannot delete others' data

## Next Actions

1. ✅ Apply the updated script to your database
2. ✅ Verify all policies are in place
3. ✅ Test admin deletion functionality
4. ✅ Test QA pipeline with CSV uploads
5. ✅ Confirm user approval/rejection works

The database is now fully configured with all features and security measures!

