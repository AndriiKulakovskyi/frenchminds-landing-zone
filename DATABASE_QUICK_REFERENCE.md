# Database Setup - Quick Reference

## 🚀 Quick Start

### New Database
```sql
-- Run this in Supabase SQL Editor:
-- Copy entire contents of: supabase/migrations/initial-setup.sql
```

### Existing Database
```sql
-- Apply these migrations in order:
-- 1. supabase/migrations/20240107_add_csv_qa_pipeline.sql
-- 2. supabase/migrations/20240108_add_file_type_tracking.sql  
-- 3. supabase/migrations/20240109_admin_delete_permissions.sql
-- 4. supabase/migrations/20240110_admin_delete_user_permissions.sql
```

## ✅ What's Included

| Feature | Status |
|---------|--------|
| User management | ✅ |
| Role-based access (admin, PI, staff) | ✅ |
| File uploads with metadata | ✅ |
| QA validation pipeline | ✅ |
| File type detection | ✅ |
| Admin delete permissions | ✅ |
| Storage bucket (10GB limit) | ✅ |
| RLS security policies | ✅ |
| Audit logging | ✅ |
| Realtime subscriptions | ✅ |

## 🔐 Admin Permissions

Admins (with `approved = true`) can:
- ✅ Approve/reject user sign-ups
- ✅ Delete user accounts
- ✅ Delete uploaded files (DB + S3)
- ✅ Update any upload metadata
- ✅ View all files in storage
- ✅ Access audit logs

## 📊 Database Schema

### Tables
- `users` - User profiles
- `user_roles` - RBAC with approval workflow
- `data_uploads` - Upload metadata + QA results
- `audit_logs` - Activity tracking

### Key Columns (data_uploads)
- `file_type` - Auto-detected (e.g., 'wearable-fitbit')
- `qa_status` - 'not_started' | 'passed' | 'failed' | 'warning'
- `qa_report` - Full validation results (jsonb)
- `qa_score` - Quality score 0-100
- `modality` - 'clinical' | 'wearable' | 'neuropsychological' | 'mri' | 'genomic'

## 🛠️ Post-Setup Commands

### Create First Admin
```sql
-- Insert admin role (use actual user UUID from auth.users)
INSERT INTO public.user_roles (user_id, role, approved, approved_at, created_at, updated_at)
VALUES ('YOUR_USER_UUID', 'admin', true, now(), now(), now())
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', approved = true, approved_at = now();
```

### Verify Setup
```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('users', 'user_roles', 'data_uploads');

-- Check storage
SELECT * FROM storage.buckets WHERE id = 'clinical-data-uploads';
```

### Check Admin Status
```sql
SELECT u.email, ur.role, ur.approved 
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

## 🐛 Troubleshooting

### "No pending approvals" showing
```sql
-- Check if there are actually pending users
SELECT COUNT(*) FROM public.user_roles WHERE approved = false;

-- If count > 0 but not showing, check browser console logs
```

### Admin can't delete
```sql
-- Verify admin is approved
UPDATE public.user_roles 
SET approved = true, approved_at = now()
WHERE role = 'admin' AND user_id = 'YOUR_USER_UUID';
```

### QA not running
```sql
-- Check if QA columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'data_uploads' 
AND column_name LIKE 'qa_%';
```

## 📝 Documentation Files

- `DATABASE_SETUP_GUIDE.md` - Complete setup guide
- `INITIAL_SETUP_UPDATE_SUMMARY.md` - What changed
- `TROUBLESHOOT_PENDING_APPROVALS.md` - Debug pending users
- `ADMIN_DELETE_IMPLEMENTATION.md` - Delete feature docs
- `MODALITY_SPECIFIC_QA_IMPLEMENTATION.md` - QA pipeline docs

## 🔗 Key Features by Role

### Admin
- Approve/reject PI accounts
- Delete any upload
- View all data
- Manage user roles

### Principal Investigator (PI)
- Upload files
- View own uploads
- See QA reports
- Cannot delete uploads (contact admin)

### Research Staff
- Limited upload permissions
- View assigned data only

## 🎯 Next Steps

1. ✅ Run initial-setup.sql
2. ✅ Create admin account
3. ✅ Test sign-up flow
4. ✅ Test file upload
5. ✅ Test QA validation
6. ✅ Test admin delete

## 📞 Support

If issues persist:
1. Check Supabase Dashboard → Logs
2. Check browser console (F12)
3. Verify RLS is enabled
4. Run debug queries from `debug_user_approvals.sql`

