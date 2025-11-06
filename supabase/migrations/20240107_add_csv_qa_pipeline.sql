-- ============================================
-- CSV QA Pipeline Extension
-- ============================================
-- This migration adds QA tracking capabilities to the database

-- Add QA-related columns to data_uploads table if they don't exist
DO $$ 
BEGIN
    -- Check if qa_status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_uploads' 
        AND column_name = 'qa_status'
    ) THEN
        -- Add qa_status column
        ALTER TABLE public.data_uploads 
        ADD COLUMN qa_status text DEFAULT 'not_started';
        
        RAISE NOTICE 'Added qa_status column to data_uploads';
    END IF;

    -- Check if qa_report column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_uploads' 
        AND column_name = 'qa_report'
    ) THEN
        -- Add qa_report column to store full QA report
        ALTER TABLE public.data_uploads 
        ADD COLUMN qa_report jsonb DEFAULT '{}';
        
        RAISE NOTICE 'Added qa_report column to data_uploads';
    END IF;

    -- Check if qa_score column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_uploads' 
        AND column_name = 'qa_score'
    ) THEN
        -- Add qa_score column
        ALTER TABLE public.data_uploads 
        ADD COLUMN qa_score numeric(5,2) DEFAULT 0;
        
        RAISE NOTICE 'Added qa_score column to data_uploads';
    END IF;

    -- Check if qa_completed_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'data_uploads' 
        AND column_name = 'qa_completed_at'
    ) THEN
        -- Add qa_completed_at timestamp
        ALTER TABLE public.data_uploads 
        ADD COLUMN qa_completed_at timestamp with time zone;
        
        RAISE NOTICE 'Added qa_completed_at column to data_uploads';
    END IF;

    RAISE NOTICE 'QA columns migration completed successfully';
END $$;

-- Create indexes for QA-related columns
CREATE INDEX IF NOT EXISTS idx_data_uploads_qa_status ON public.data_uploads(qa_status);
CREATE INDEX IF NOT EXISTS idx_data_uploads_qa_score ON public.data_uploads(qa_score);
CREATE INDEX IF NOT EXISTS idx_data_uploads_qa_completed_at ON public.data_uploads(qa_completed_at);

-- Create a view for QA statistics
CREATE OR REPLACE VIEW public.qa_statistics AS
SELECT 
    modality,
    COUNT(*) as total_uploads,
    COUNT(CASE WHEN qa_status = 'passed' THEN 1 END) as qa_passed_count,
    COUNT(CASE WHEN qa_status = 'failed' THEN 1 END) as qa_failed_count,
    COUNT(CASE WHEN qa_status = 'passed_with_warnings' THEN 1 END) as qa_warning_count,
    AVG(qa_score) as avg_qa_score,
    AVG(CASE WHEN (validation_results->>'total_rows')::int IS NOT NULL 
        THEN (validation_results->>'total_rows')::int END) as avg_rows,
    AVG(CASE WHEN (validation_results->>'total_columns')::int IS NOT NULL 
        THEN (validation_results->>'total_columns')::int END) as avg_columns,
    AVG(CASE WHEN (validation_results->>'missing_values_percentage')::numeric IS NOT NULL 
        THEN (validation_results->>'missing_values_percentage')::numeric END) as avg_missing_percentage
FROM public.data_uploads
WHERE modality IN ('clinical', 'wearable', 'neuropsychological')
GROUP BY modality;

-- Grant permissions
GRANT SELECT ON public.qa_statistics TO authenticated;

-- Add comment to explain the view
COMMENT ON VIEW public.qa_statistics IS 'Statistical summary of QA results for CSV uploads by modality';

-- Update existing uploads to set qa_status to 'not_started' if null
UPDATE public.data_uploads 
SET qa_status = 'not_started'
WHERE qa_status IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ CSV QA Pipeline migration completed successfully!';
    RAISE NOTICE '✓ Added columns: qa_status, qa_report, qa_score, qa_completed_at';
    RAISE NOTICE '✓ Created indexes for QA columns';
    RAISE NOTICE '✓ Created qa_statistics view';
END $$;

