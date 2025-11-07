# Initial Database Setup - Complete Guide

## Overview

The `initial-setup.sql` script has been updated to include all features developed during the project lifecycle. This is the **definitive** database initialization script that sets up everything needed for the French Minds Landing Zone platform.

## What's Included

### 1. Database Schema

#### Tables Created:
- **users**: User profiles synced with auth.users
- **user_roles**: Role-based access control (admin, principal_investigator, research_staff)
- **data_uploads**: File upload metadata with QA tracking
- **audit_logs**: Compliance and activity tracking

#### New Columns in data_uploads:
- `file_type`: Detected file type (e.g., 'wearable-fitbit', 'clinical-generic')
- `qa_status`: QA validation status ('not_started', 'passed', 'failed', 'warning')
- `qa_report`: Full QA validation results (jsonb)
- `qa_score`: Numeric quality score (0-100)
- `qa_completed_at`: Timestamp of QA completion

### 2. Enums

- `data_modality`: clinical, wearable, neuropsychological, mri, genomic
- `upload_status`: pending, uploading, validating, completed, failed
- `user_role`: principal_investigator, research_staff, admin

### 3. Row-Level Security (RLS) Policies

#### Users Table:
- ✅ Users can view own data
- ✅ Users can update own data
- ✅ **Admins can delete users** (NEW)

#### User Roles Table:
- ✅ Everyone can view roles
- ✅ Admins can update roles (with approved check)
- ✅ Users can insert own role
- ✅ **Admins can delete user roles** (NEW)

#### Data Uploads Table:
- ✅ Everyone can view uploads
- ✅ Users can create uploads
- ✅ Users can update own uploads
- ✅ Admins can update all uploads (with approved check)
- ✅ **Admins can delete any upload** (NEW)

#### Storage Bucket Policies:
- ✅ Users can upload to their own folder
- ✅ Users can view their own files
- ✅ Users can update their own files
- ✅ Users can delete their own files
- ✅ Admins can view all files (with approved check)
- ✅ **Admins can delete all files** (NEW)

#### Audit Logs:
- ✅ Everyone can view audit logs
- ✅ System can insert audit logs

### 4. Indexes

Performance indexes on:
- User lookups (email, user_id)
- Role queries (user_id, role, approved)
- Upload queries (modality, status, uploaded_by, reviewed_by, created_at)
- **QA queries** (file_type, qa_status) - NEW
- Audit log queries (user_id, created_at, resource_type)

### 5. Storage Bucket

- **Bucket Name**: clinical-data-uploads
- **Size Limit**: 10 GB per file
- **Public Access**: Disabled
- **Allowed Types**: All (NULL = no restriction)

### 6. Triggers & Functions

- `handle_new_user()`: Automatically creates user profile when auth user is created
- `handle_user_update()`: Syncs user updates between auth.users and public.users

### 7. Realtime

Enabled for:
- `data_uploads` table
- `audit_logs` table

## Key Features

### Admin Delete Permissions

The script now includes comprehensive delete permissions for admins:

1. **Delete Users**: Admins can remove user records (for rejected sign-ups)
2. **Delete User Roles**: Admins can remove role assignments
3. **Delete Uploads**: Admins can permanently remove uploaded files
4. **Delete Storage Files**: Admins can remove files from S3 storage

All admin checks include `approved = true` to ensure only approved admins have these permissions.

### QA Pipeline Support

The database is fully configured to support the CSV QA validation pipeline:

- `qa_status`: Tracks validation state
- `qa_report`: Stores detailed validation results (errors, warnings, metrics)
- `qa_score`: Numeric quality indicator
- `qa_completed_at`: Audit timestamp
- `file_type`: Content-based file type detection

### Modality-Specific Features

- File type detection per modality (clinical, wearable, neuropsychological)
- Indexed for fast filtering by modality and file type
- Ready for modality-specific QA rules

## How to Use

### Fresh Installation

If you're setting up a new database:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `initial-setup.sql`
3. Execute the script
4. Verify success messages in the output

### Existing Database

If you already have a database and applied previous migrations:

**Option 1: Start Fresh** (Recommended for development)
1. Drop all tables (WARNING: loses all data)
2. Run `initial-setup.sql`

**Option 2: Keep Existing Data**
The script uses `IF NOT EXISTS` for tables and `DROP POLICY IF EXISTS` for policies, making it safe to run on existing databases. However:
- New columns will NOT be added to existing tables
- Apply individual migration files instead:
  - `20240107_add_csv_qa_pipeline.sql`
  - `20240108_add_file_type_tracking.sql`
  - `20240109_admin_delete_permissions.sql`
  - `20240110_admin_delete_user_permissions.sql`

## Verification Steps

After running the script, verify:

### 1. Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_roles', 'data_uploads', 'audit_logs');
```

### 2. QA Columns Exist
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'data_uploads' 
AND column_name IN ('file_type', 'qa_status', 'qa_report', 'qa_score', 'qa_completed_at');
```

### 3. RLS Policies Exist
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'user_roles', 'data_uploads');
```

Expected policies should include:
- `Admins can delete users`
- `Admins can delete user roles`
- `Admins can delete any upload`

### 4. Storage Bucket Exists
```sql
SELECT id, name, file_size_limit 
FROM storage.buckets 
WHERE id = 'clinical-data-uploads';
```

### 5. Indexes Exist
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'data_uploads' 
AND indexname IN ('idx_data_uploads_file_type', 'idx_data_uploads_qa_status');
```

## Common Issues & Solutions

### Issue: "already exists" errors
**Solution**: The script is idempotent. These warnings are safe to ignore.

### Issue: Missing QA columns in existing database
**Solution**: Run the QA migrations separately:
```sql
-- Add QA columns
ALTER TABLE public.data_uploads 
ADD COLUMN IF NOT EXISTS qa_status text DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS qa_report jsonb,
ADD COLUMN IF NOT EXISTS qa_score numeric,
ADD COLUMN IF NOT EXISTS qa_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'unknown';
```

### Issue: Admin can't delete uploads
**Solution**: Verify admin is approved:
```sql
UPDATE public.user_roles 
SET approved = true, approved_at = now() 
WHERE role = 'admin' AND user_id = 'YOUR_ADMIN_USER_ID';
```

### Issue: Storage policies not working
**Solution**: Check if policies exist:
```sql
SELECT * FROM storage.policies 
WHERE bucket_id = 'clinical-data-uploads';
```

## Migration History

This script consolidates all migrations:
- Initial schema setup
- QA pipeline addition (20240107)
- File type tracking (20240108)
- Admin delete permissions for uploads (20240109)
- Admin delete permissions for users (20240110)

## Security Notes

1. **RLS is ENABLED** on all tables - data is protected by default
2. **Admin approval required** - admins must have `approved = true` to delete
3. **Storage is PRIVATE** - files are not publicly accessible
4. **Audit logging** - all actions should be logged for compliance

## Next Steps After Setup

1. **Create First Admin**:
```sql
-- Insert into users table first (if not auto-created by trigger)
INSERT INTO public.users (id, email, full_name, user_id, token_identifier, created_at)
VALUES ('USER_UUID', 'admin@example.com', 'Admin User', 'USER_UUID', 'admin@example.com', now());

-- Assign admin role with approval
INSERT INTO public.user_roles (user_id, role, approved, approved_at, created_at, updated_at)
VALUES ('USER_UUID', 'admin', true, now(), now(), now())
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', approved = true, approved_at = now();
```

2. **Test Upload**: Upload a file through the application
3. **Test QA**: Upload a CSV file and verify QA runs
4. **Test Admin Functions**: Try approving/rejecting users, deleting uploads

## Support

For issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify RLS policies are enabled
3. Confirm user has proper role and approval status
4. Check browser console for client-side errors

## Version

- **Script Version**: 1.1.0
- **Last Updated**: 2024-01-10
- **Compatible With**: Supabase PostgreSQL 15+

