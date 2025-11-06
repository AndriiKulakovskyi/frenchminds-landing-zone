# Modality-Specific QA Pipeline Implementation

## Summary

Successfully implemented modality-specific QA pipelines with content-based file type detection for CSV files. The system now identifies specific file types within modalities based on column headers.

## Key Features

### 1. File Type Detection

The QA pipeline now detects specific file types based on column structure:

- **Clinical Data**: `clinical-generic` - All CSV files in clinical modality
- **Wearable Data**: 
  - `wearable-fitbit` - Detected by columns: `id`, `num_jour`, `date_jour`, `heure_endor`, `duree_sommeil`, `score_sommeil`
  - `wearable-questionnaire` - Detected by columns: `identification.id`, `age`, `sex`, `height`, `weight`, `shaps_q1`, `isi_q1`
  - `wearable-unknown` - Falls back when signature doesn't match
- **Neuropsychological Data**: `neuropsychological-generic` - Reserved for future implementation

### 2. Detection Logic

The system uses signature-based detection:
- Normalizes column names (trim, lowercase)
- Matches at least 4 out of 6 signature columns
- Prioritizes Fitbit detection over questionnaire detection
- Falls back to modality-generic or unknown

## Changes Made

### 1. CSV QA Utility (`src/utils/csv-qa.ts`)

- Added `fileType` field to `CsvQaReport` interface
- Implemented `detectFileType()` function with column-based detection
- Modified `analyzeCsvFile()` to accept `modality` parameter
- Automatically detects and sets file type in QA report

### 2. File Upload Component (`src/components/file-upload.tsx`)

- Passes `modality` parameter to `analyzeCsvFile()`
- Saves `file_type` to database during upload

### 3. Database Schema

- Created migration: `20240108_add_file_type_tracking.sql`
- Added `file_type` column to `data_uploads` table
- Created index on `file_type` for query performance
- Updated existing records with default file types

### 4. TypeScript Types (`src/types/supabase.ts`)

- Added `file_type` field to `data_uploads` Row, Insert, and Update interfaces

### 5. QA Report Viewers

#### CSV QA Report Viewer (`src/components/csv-qa-report-viewer.tsx`)
- Displays file type badge in report header
- Shows alongside analysis timestamp

#### QA Reports Table (`src/components/qa-report-viewer.tsx`)
- Added "Type de Fichier" column
- Displays file type as badge with simplified names
- Fetches `file_type` from database
- Shows "-" for unknown or missing file types

## File Type Display

File types are displayed in a user-friendly format:
- `wearable-fitbit` → "fitbit"
- `wearable-questionnaire` → "questionnaire"
- `clinical-generic` → "generic"
- `neuropsychological-generic` → "generic"

## Testing

Test the implementation with:

1. **Fitbit file** (wearable modality):
   - Must have columns: `id`, `num_jour`, `date_jour`, `heure_endor`, `duree_sommeil`, `score_sommeil`
   - Should detect as `wearable-fitbit`

2. **Questionnaires file** (wearable modality):
   - Must have columns: `identification.id`, `age`, `sex`, `height`, `weight`, `shaps_q1`, `isi_q1`
   - Should detect as `wearable-questionnaire`

3. **Clinical CSV** (clinical modality):
   - Any CSV structure
   - Should detect as `clinical-generic`

## Future Extensions

### Neuropsychological Data

To add neuropsychological file type detection:

1. Update `detectFileType()` in `src/utils/csv-qa.ts`
2. Add signature columns for neuropsychological file types
3. Follow the same pattern as wearable files
4. No structural changes needed

### Adding New File Types

To add a new file type within any modality:

1. Define signature columns
2. Add detection logic in `detectFileType()`
3. Set minimum match threshold (e.g., 4 out of 6 columns)
4. File type will automatically appear in QA reports

## Benefits

1. **Independent Upload**: Users can upload fitbit and questionnaire files separately
2. **Automatic Detection**: No manual file type selection needed
3. **Content-Based**: Detection based on actual file structure, not filename
4. **Extensible**: Easy to add new file types within existing modalities
5. **Transparent**: File type visible in QA reports and upload history
6. **Future-Ready**: Structure supports neuropsychological and other modalities

## Technical Notes

- Detection is case-insensitive and whitespace-tolerant
- Requires at least 4 matching columns out of 6 signature columns
- File type is stored in database for auditing and reporting
- All existing QA metrics continue to apply regardless of file type
- The same QA validation rules apply to all file types within a modality

## Deployment

To deploy this update:

1. Apply database migration:
   ```sql
   -- Run supabase/migrations/20240108_add_file_type_tracking.sql
   ```

2. Deploy updated application code

3. Verify file type detection with test uploads

## Migration Details

The migration:
- Adds `file_type` column with default 'unknown'
- Creates index for performance
- Updates existing records with modality-based defaults
- Non-destructive and backward compatible

