-- Migration: Remove patient concept from data uploads
-- This migration removes patient_id references and the patients table

-- 1. Drop foreign key constraint from data_uploads
ALTER TABLE public.data_uploads DROP CONSTRAINT IF EXISTS data_uploads_patient_id_fkey;

-- 2. Drop the patient_id column from data_uploads
ALTER TABLE public.data_uploads DROP COLUMN IF EXISTS patient_id;

-- 3. Drop the index on patient_id (if it exists)
DROP INDEX IF EXISTS idx_data_uploads_patient_id;

-- 4. Drop the index on patients.study_id (if it exists)
DROP INDEX IF EXISTS idx_patients_study_id;

-- 5. Drop policies on patients table
DROP POLICY IF EXISTS "Users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create patients" ON public.patients;

-- 6. Drop the patients table entirely
DROP TABLE IF EXISTS public.patients CASCADE;

-- Note: The data_uploads table now stands alone without patient references
-- Uploads are tracked by modality and user, not by patient

