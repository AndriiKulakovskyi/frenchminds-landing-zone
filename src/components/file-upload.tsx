"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileIcon, X, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "../../supabase/client";
import { analyzeCsvFile, CsvQaReport } from "@/utils/csv-qa";
import CsvQaReportViewer from "@/components/csv-qa-report-viewer";

export type DataModality = 'clinical' | 'wearable' | 'neuropsychological' | 'mri' | 'genomic';

interface FileUploadProps {
  onUploadComplete?: (fileData: any) => void;
  preselectedModality?: DataModality;
}

export default function FileUpload({ onUploadComplete, preselectedModality }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modality, setModality] = useState<DataModality | ''>(preselectedModality || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [qaReport, setQaReport] = useState<CsvQaReport | null>(null);
  const [showQaReport, setShowQaReport] = useState(false);
  const [runningQa, setRunningQa] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setUploadSuccess(false);
      setQaReport(null);
    }
  };

  const isCsvFile = (fileName: string, modalityType: DataModality | ''): boolean => {
    const csvModalities: DataModality[] = ['clinical', 'wearable', 'neuropsychological'];
    return csvModalities.includes(modalityType as DataModality) && 
           (fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.txt'));
  };

  const runQaAnalysis = async (): Promise<boolean> => {
    if (!selectedFile) return false;

    console.log('runQaAnalysis started for file:', selectedFile.name);
    setRunningQa(true);
    setError(null);
    setProgress(10); // Show initial progress

    try {
      // Simulate progress during analysis
      setProgress(30);
      console.log('Calling analyzeCsvFile...');
      const report = await analyzeCsvFile(selectedFile);
      console.log('QA report received:', report);
      setProgress(90);
      setQaReport(report);
      setProgress(100);
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // ALWAYS show the QA report so user can review it
      console.log('QA analysis complete, showing report to user');
      setShowQaReport(true);
      return false; // Wait for user to review and approve
      
    } catch (err: any) {
      console.error('QA Analysis error:', err);
      setError(`QA Analysis failed: ${err.message}`);
      return false;
    } finally {
      setRunningQa(false);
    }
  };

  const handleQaApprove = () => {
    setShowQaReport(false);
    performUpload();
  };

  const handleQaReject = () => {
    setShowQaReport(false);
    setSelectedFile(null);
    setQaReport(null);
    setError('Upload cancelled due to QA issues');
  };

  const handleUpload = async () => {
    if (!selectedFile || !modality) {
      return;
    }

    console.log('Starting upload for:', selectedFile.name, 'modality:', modality);
    console.log('Is CSV file?', isCsvFile(selectedFile.name, modality));

    // For CSV files (clinical, wearable, neuropsychological), run QA first
    if (isCsvFile(selectedFile.name, modality)) {
      console.log('Running QA analysis for CSV file');
      const qaPass = await runQaAnalysis();
      console.log('QA analysis result:', qaPass, 'QA Report:', qaReport);
      if (!qaPass) {
        console.log('QA did not pass, stopping upload');
        return; // QA failed or needs review, stop here
      }
    } else {
      console.log('Not a CSV file, skipping QA');
    }

    // If QA passed or not a CSV file, proceed with upload
    console.log('Proceeding with upload, qaReport:', qaReport);
    await performUpload();
  };

  const performUpload = async () => {
    if (!selectedFile || !modality) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setUploadSuccess(false);

    try {
      const supabase = createClient();
      
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to upload files');
      }

      // Generate unique file path: modality/user_id/timestamp_filename
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${modality}/${user.id}/${timestamp}_${sanitizedFileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('clinical-data-uploads')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      setProgress(50);

      // Calculate file checksum (simple hash using file size and name)
      const checksum = `${selectedFile.size}-${selectedFile.name}-${timestamp}`;

      // Prepare validation results from QA report
      const validationResults = qaReport ? {
        qa_passed: qaReport.isValid,
        qa_score: qaReport.isValid ? ((100 - qaReport.missingValuesPercentage + 100 - qaReport.duplicateRowsPercentage) / 2) : 0,
        total_rows: qaReport.totalRows,
        total_columns: qaReport.totalColumns,
        missing_values_percentage: qaReport.missingValuesPercentage,
        duplicate_rows_count: qaReport.duplicateRowsCount,
        errors_count: qaReport.errors.length,
        warnings_count: qaReport.warnings.length,
        analyzed_at: qaReport.analyzedAt
      } : {};

      // Determine QA status
      const qaStatus = qaReport 
        ? (qaReport.errors.length > 0 ? 'failed' : 
           qaReport.warnings.length > 0 ? 'passed_with_warnings' : 'passed')
        : 'not_started';

      const qaScore = qaReport && qaReport.isValid
        ? (100 - qaReport.missingValuesPercentage + 100 - qaReport.duplicateRowsPercentage) / 2
        : null;

      console.log('Saving to database with QA data:', {
        qaStatus,
        qaScore,
        hasQaReport: !!qaReport
      });

      // Insert record into data_uploads table
      const { data: dbData, error: dbError } = await supabase
        .from('data_uploads')
        .insert({
          uploaded_by: user.id,
          modality: modality,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_path: uploadData.path,
          checksum: checksum,
          status: 'completed',
          progress: 100,
          validation_results: validationResults,
          qa_status: qaStatus,
          qa_score: qaScore,
          qa_report: qaReport || null,
          qa_completed_at: qaReport ? new Date().toISOString() : null,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Try to clean up uploaded file
        await supabase.storage.from('clinical-data-uploads').remove([uploadData.path]);
        throw new Error(`Failed to save upload record: ${dbError.message}`);
      }

      console.log('Database record created successfully:', dbData);

      setProgress(100);
      setUploadSuccess(true);
      
      // Reset form after short delay
      setTimeout(() => {
        setSelectedFile(null);
        setModality(preselectedModality || '');
        setUploading(false);
        setUploadSuccess(false);
        setQaReport(null);
        
        if (onUploadComplete) {
          onUploadComplete(dbData);
        }
      }, 2000);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
      setUploading(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Télécharger des Données Cliniques
        </CardTitle>
        <CardDescription>
          {preselectedModality && modality === 'clinical' && 'Fichiers CSV regroupant les données de plusieurs patients collectées sur environ un mois'}
          {preselectedModality && modality === 'wearable' && 'Données de smartwatch/wearables pour plusieurs patients sur environ un mois'}
          {preselectedModality && modality === 'neuropsychological' && 'Données de tablette neuropsychologique pour plusieurs patients sur environ un mois'}
          {preselectedModality && modality === 'mri' && 'Images fMRI au format DICOM ou NIfTI'}
          {preselectedModality && modality === 'genomic' && 'Données génomiques au format FASTA ou FASTQ'}
          {!preselectedModality && 'Téléchargez des fichiers de recherche jusqu\'à 10 Go avec validation automatique'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!preselectedModality && (
          <div className="space-y-2">
            <Label htmlFor="modality">Modalité de Données *</Label>
            <Select value={modality} onValueChange={(value) => setModality(value as DataModality)} disabled={uploading}>
              <SelectTrigger id="modality">
                <SelectValue placeholder="Sélectionnez le type de données" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinical">Clinique (CSV)</SelectItem>
                <SelectItem value="wearable">Objets Connectés (CSV)</SelectItem>
                <SelectItem value="neuropsychological">Neuropsychologique (CSV)</SelectItem>
                <SelectItem value="mri">IRM (DICOM/NIfTI)</SelectItem>
                <SelectItem value="genomic">Génomique (FASTA/FASTQ)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {preselectedModality && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-1">Modalité sélectionnée:</p>
            <p className="text-lg font-semibold">
              {modality === 'clinical' && 'Données Cliniques (CSV)'}
              {modality === 'wearable' && 'Objets Connectés (CSV)'}
              {modality === 'neuropsychological' && 'Données Neuropsychologiques (CSV)'}
              {modality === 'mri' && 'IRM Fonctionnelle (DICOM/NIfTI)'}
              {modality === 'genomic' && 'Données Génomiques (FASTA/FASTQ)'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Sélection du Fichier *</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors bg-muted/20">
            {!selectedFile ? (
              <label htmlFor="file-input" className="cursor-pointer">
                <FileIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Cliquez pour sélectionner un fichier ou glissez-déposez
                </p>
                <p className="text-xs text-muted-foreground">
                  Taille maximale du fichier : 10 Go
                </p>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-background p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadSuccess && (
          <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>File uploaded successfully!</AlertDescription>
          </Alert>
        )}

        {runningQa && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Analyse CQ en cours...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Vérification de la qualité des données CSV
            </p>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Téléchargement en cours...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !modality || uploading || runningQa}
          className="w-full"
          size="lg"
        >
          {runningQa ? 'Analyse CQ en cours...' : uploading ? 'Téléchargement...' : 'Télécharger le Fichier'}
        </Button>
      </CardContent>

      {/* QA Report Dialog */}
      <Dialog open={showQaReport} onOpenChange={setShowQaReport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CSV Quality Assurance Report</DialogTitle>
            <DialogDescription>
              Review the quality analysis results before uploading
            </DialogDescription>
          </DialogHeader>
          
          {qaReport && <CsvQaReportViewer report={qaReport} />}
          
          <DialogFooter className="flex justify-between gap-2">
            <Button variant="outline" onClick={handleQaReject} disabled={uploading}>
              Cancel Upload
            </Button>
            <Button 
              onClick={handleQaApprove} 
              disabled={uploading || (qaReport ? !qaReport.isValid : false)}
            >
              {qaReport && !qaReport.isValid ? 'Cannot Upload (QA Failed)' : 'Proceed with Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
