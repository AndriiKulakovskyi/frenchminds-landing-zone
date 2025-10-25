"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileIcon, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export type DataModality = 'clinical' | 'wearable' | 'neuropsychological' | 'mri' | 'genomic';

interface FileUploadProps {
  onUploadComplete?: (fileData: any) => void;
  patientId?: string;
  preselectedModality?: DataModality;
}

export default function FileUpload({ onUploadComplete, patientId, preselectedModality }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modality, setModality] = useState<DataModality | ''>(preselectedModality || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [patientIdentifier, setPatientIdentifier] = useState('');
  const [studyId, setStudyId] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !modality || !patientIdentifier || !studyId) {
      return;
    }

    setUploading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setUploading(false);
      setSelectedFile(null);
      setModality('');
      setPatientIdentifier('');
      setStudyId('');
      
      if (onUploadComplete) {
        onUploadComplete({
          file_name: selectedFile.name,
          modality,
          file_size: selectedFile.size,
          patient_identifier: patientIdentifier,
          study_id: studyId,
        });
      }
    }, 4000);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="patient-id">Identifiant Patient *</Label>
            <Input
              id="patient-id"
              placeholder="ex: PT-001"
              value={patientIdentifier}
              onChange={(e) => setPatientIdentifier(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="study-id">ID Étude *</Label>
            <Input
              id="study-id"
              placeholder="ex: ETUDE-2024-001"
              value={studyId}
              onChange={(e) => setStudyId(e.target.value)}
              disabled={uploading}
            />
          </div>
        </div>

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
          disabled={!selectedFile || !modality || !patientIdentifier || !studyId || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? 'Téléchargement...' : 'Télécharger le Fichier'}
        </Button>
      </CardContent>
    </Card>
  );
}
