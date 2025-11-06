# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage to store uploaded clinical data files.

## Step 1: Create Storage Bucket

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at [supabase.com](https://supabase.com)
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `clinical-data-uploads`
   - **Public**: Uncheck (keep it private)
   - **File size limit**: `10737418240` (10 GB)
   - **Allowed MIME types**: Leave empty (allow all types)
5. Click **Create bucket**

### Option B: Using SQL Editor

Alternatively, you can run this SQL in the SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinical-data-uploads',
  'clinical-data-uploads',
  false,
  10737418240,
  NULL
);
```

## Step 2: Apply Storage Policies

Run the migration file in the SQL Editor to set up Row Level Security policies:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Copy and paste the contents of `supabase/migrations/20240105_setup_storage_bucket.sql`
4. Click **Run** or press `Ctrl/Cmd + Enter`

Or manually run these policies:

```sql
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clinical-data-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to view their own uploaded files
CREATE POLICY "Allow users to view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'clinical-data-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'clinical-data-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'clinical-data-uploads' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow admins to view all files
CREATE POLICY "Allow admins to view all files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'clinical-data-uploads' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

## Step 3: Verify Setup

1. Log in to your application
2. Navigate to the upload form
3. Try uploading a test file
4. Check the Supabase Storage dashboard to see the uploaded file
5. Check the `data_uploads` table to see the database record

## File Storage Structure

Files are stored with the following path structure:

```
clinical-data-uploads/
  ├── clinical/
  │   └── {user_id}/
  │       └── {timestamp}_{filename}
  ├── wearable/
  │   └── {user_id}/
  │       └── {timestamp}_{filename}
  ├── neuropsychological/
  │   └── {user_id}/
  │       └── {timestamp}_{filename}
  ├── mri/
  │   └── {user_id}/
  │       └── {timestamp}_{filename}
  └── genomic/
      └── {user_id}/
          └── {timestamp}_{filename}
```

Example: `clinical/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1704567890123_patient_data.csv`

## Security

- Files are **private by default** (not publicly accessible)
- Users can only access their own uploaded files
- Admin users can view all files
- All file operations require authentication

## Troubleshooting

### Error: "Failed to upload file: new row violates row-level security policy"

This means the storage policies are not set up correctly. Make sure you've run the SQL policies from Step 2.

### Error: "Bucket not found"

The storage bucket `clinical-data-uploads` doesn't exist. Complete Step 1 to create it.

### Files not appearing in Storage

1. Check browser console for errors
2. Verify you're logged in as an authenticated user
3. Check the `data_uploads` table to see if the record was created
4. Verify the bucket name matches exactly: `clinical-data-uploads`

## Viewing Uploaded Files

### From Supabase Dashboard:
1. Go to **Storage** → `clinical-data-uploads`
2. Navigate through the folder structure
3. Click on any file to view/download

### From Your Application:
Files are tracked in the `data_uploads` table with:
- `file_name`: Original filename
- `file_path`: Storage path
- `file_size`: Size in bytes
- `modality`: Data type (clinical, wearable, etc.)
- `uploaded_by`: User ID who uploaded
- `status`: Upload status
- `checksum`: File checksum for integrity

## Next Steps

- Configure backup policies for the storage bucket
- Set up file retention policies if needed
- Consider adding virus scanning for uploaded files
- Implement file download functionality in the UI

