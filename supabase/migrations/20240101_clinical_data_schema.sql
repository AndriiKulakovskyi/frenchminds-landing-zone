CREATE TYPE data_modality AS ENUM ('clinical', 'wearable', 'neuropsychological', 'mri', 'genomic');
CREATE TYPE upload_status AS ENUM ('pending', 'uploading', 'validating', 'completed', 'failed');
CREATE TYPE user_role AS ENUM ('principal_investigator', 'research_staff', 'admin');

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'research_staff',
    permissions jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.patients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_identifier text UNIQUE NOT NULL,
    study_id text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.data_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
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
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    completed_at timestamp with time zone
);

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

CREATE INDEX IF NOT EXISTS idx_data_uploads_patient_id ON public.data_uploads(patient_id);
CREATE INDEX IF NOT EXISTS idx_data_uploads_modality ON public.data_uploads(modality);
CREATE INDEX IF NOT EXISTS idx_data_uploads_status ON public.data_uploads(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_patients_study_id ON public.patients(study_id);

DROP POLICY IF EXISTS "Users can view uploads" ON public.data_uploads;
CREATE POLICY "Users can view uploads" ON public.data_uploads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create uploads" ON public.data_uploads;
CREATE POLICY "Users can create uploads" ON public.data_uploads FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can update own uploads" ON public.data_uploads;
CREATE POLICY "Users can update own uploads" ON public.data_uploads FOR UPDATE USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Users can view patients" ON public.patients;
CREATE POLICY "Users can view patients" ON public.patients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create patients" ON public.patients;
CREATE POLICY "Users can create patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view audit logs" ON public.audit_logs;
CREATE POLICY "Users can view audit logs" ON public.audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT USING (true);

alter publication supabase_realtime add table data_uploads;
alter publication supabase_realtime add table audit_logs;
