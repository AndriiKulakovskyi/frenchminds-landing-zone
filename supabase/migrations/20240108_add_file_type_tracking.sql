-- ============================================
-- Add File Type Tracking for Modality-Specific QA
-- ============================================
-- This migration adds file type detection within modalities

-- Add file_type column to data_uploads table
ALTER TABLE public.data_uploads 
ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'unknown';

-- Create index for file_type
CREATE INDEX IF NOT EXISTS idx_data_uploads_file_type 
ON public.data_uploads(file_type);

-- Add comment
COMMENT ON COLUMN public.data_uploads.file_type IS 
'Specific file type within modality (e.g., wearable-fitbit, wearable-questionnaire, clinical-generic)';

-- Update existing records to have a file type
UPDATE public.data_uploads 
SET file_type = CASE 
  WHEN modality = 'clinical' THEN 'clinical-generic'
  WHEN modality = 'wearable' THEN 'wearable-unknown'
  WHEN modality = 'neuropsychological' THEN 'neuropsychological-generic'
  ELSE 'unknown'
END
WHERE file_type = 'unknown' OR file_type IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ File type tracking migration completed successfully!';
    RAISE NOTICE '✓ Added file_type column to data_uploads';
    RAISE NOTICE '✓ Created index on file_type';
    RAISE NOTICE '✓ Updated existing records with default file types';
END $$;

