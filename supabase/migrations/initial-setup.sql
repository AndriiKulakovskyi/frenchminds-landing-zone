-- ============================================
-- Complete Database Setup Script
-- French Minds Landing Zone
-- ============================================
-- This script creates all necessary tables, types, policies, and triggers
-- Run this once to set up the entire database schema

-- ============================================
-- STEP 1: CREATE ENUMS
-- ============================================

CREATE TYPE IF NOT EXISTS data_modality AS ENUM (
    'clinical', 
    'wearable', 
    'neuropsychological', 
    'mri', 
    'genomic'
);

CREATE TYPE IF NOT EXISTS upload_status AS ENUM (
    'pending', 
    'uploading', 
    'validating', 
    'completed', 
    'failed'
);

CREATE TYPE IF NOT EXISTS user_role AS ENUM (
    'principal_investigator', 
    'research_staff', 
    'admin'
);

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- Users table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY NOT NULL,
    avatar_url text,
    user_id text UNIQUE,
    token_identifier text NOT NULL,
    image text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    email text,
    name text,
    full_name text
);

-- User roles table (for role-based access control)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'research_staff',
    permissions jsonb DEFAULT '{}',
    approved boolean DEFAULT false,
    approved_at timestamp with time zone,
    approved_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Data uploads table (stores file upload metadata and tracking)
CREATE TABLE IF NOT EXISTS public.data_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by uuid REFERENCES auth.users(id),
    modality data_modality NOT NULL,
    file_name text NOT NULL,
    file_size bigint NOT NULL,
    file_path text,
    checksum text,
    status upload_status DEFAULT 'pending',
    progress integer DEFAULT 0,
    validation_results jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    completed_at timestamp with time zone
);

-- Audit logs table (for compliance and tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    details jsonb DEFAULT '{}',
    outcome text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_approved ON public.user_roles(approved);

-- Data uploads indexes
CREATE INDEX IF NOT EXISTS idx_data_uploads_modality ON public.data_uploads(modality);
CREATE INDEX IF NOT EXISTS idx_data_uploads_status ON public.data_uploads(status);
CREATE INDEX IF NOT EXISTS idx_data_uploads_uploaded_by ON public.data_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_data_uploads_reviewed_by ON public.data_uploads(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_data_uploads_reviewed_at ON public.data_uploads(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_data_uploads_created_at ON public.data_uploads(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" 
ON public.users 
FOR SELECT 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = user_id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
CREATE POLICY "Users can view roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Data uploads policies
DROP POLICY IF EXISTS "Users can view uploads" ON public.data_uploads;
CREATE POLICY "Users can view uploads" 
ON public.data_uploads 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can create uploads" ON public.data_uploads;
CREATE POLICY "Users can create uploads" 
ON public.data_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can update own uploads" ON public.data_uploads;
CREATE POLICY "Users can update own uploads" 
ON public.data_uploads 
FOR UPDATE 
USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Admins can update all uploads" ON public.data_uploads;
CREATE POLICY "Admins can update all uploads"
ON public.data_uploads
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Audit logs policies
DROP POLICY IF EXISTS "Users can view audit logs" ON public.audit_logs;
CREATE POLICY "Users can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- ============================================
-- STEP 6: CREATE STORAGE BUCKET AND POLICIES
-- ============================================

-- Create storage bucket for clinical data uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'clinical-data-uploads',
    'clinical-data-uploads',
    false,
    10737418240, -- 10 GB
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 10737418240,
    public = false;

-- Storage policies: Allow authenticated users to upload files to their own folder
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'clinical-data-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to view their own uploaded files
DROP POLICY IF EXISTS "Allow users to view their own files" ON storage.objects;
CREATE POLICY "Allow users to view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'clinical-data-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to update their own files
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'clinical-data-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'clinical-data-uploads' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow admins to view all files
DROP POLICY IF EXISTS "Allow admins to view all files" ON storage.objects;
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

-- ============================================
-- STEP 7: CREATE TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        user_id,
        email,
        name,
        full_name,
        avatar_url,
        token_identifier,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.id::text,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        NEW.created_at,
        NEW.updated_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET
        email = NEW.email,
        name = NEW.raw_user_meta_data->>'name',
        full_name = NEW.raw_user_meta_data->>'full_name',
        avatar_url = NEW.raw_user_meta_data->>'avatar_url',
        updated_at = NEW.updated_at
    WHERE user_id = NEW.id::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ============================================
-- STEP 8: ENABLE REALTIME
-- ============================================

-- Enable realtime for data_uploads and audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE data_uploads;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Database setup completed successfully!';
    RAISE NOTICE '✓ Tables created: users, user_roles, data_uploads, audit_logs';
    RAISE NOTICE '✓ Storage bucket created: clinical-data-uploads';
    RAISE NOTICE '✓ RLS policies configured';
    RAISE NOTICE '✓ Triggers and functions set up';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create admin users in the users table';
    RAISE NOTICE '2. Assign admin roles in user_roles table';
    RAISE NOTICE '3. Test file uploads through the application';
END $$; 