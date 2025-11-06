"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import FileUpload, { DataModality } from "@/components/file-upload";
import UploadList from "@/components/upload-list";
import QAReportViewer from "@/components/qa-report-viewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileCheck, Activity, Brain, Dna, Scan, FileSpreadsheet, ArrowLeft } from "lucide-react";
import { createClient } from "../../supabase/client";

interface ModalityInfo {
  id: DataModality;
  title: string;
  description: string;
  formats: string;
  icon: any;
  color: string;
  bgColor: string;
  details: string;
}

const modalities: ModalityInfo[] = [
  {
    id: 'clinical',
    title: 'Données Cliniques',
    description: 'Données cliniques collectées pour plusieurs patients',
    formats: 'Format: CSV',
    icon: FileSpreadsheet,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    details: 'Fichiers CSV regroupant les données de plusieurs patients collectées sur environ un mois'
  },
  {
    id: 'wearable',
    title: 'Objets Connectés',
    description: 'Données de montres intelligentes et capteurs portables',
    formats: 'Format: CSV',
    icon: Activity,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    details: 'Données de smartwatch/wearables pour plusieurs patients sur environ un mois'
  },
  {
    id: 'neuropsychological',
    title: 'Données Neuropsychologiques',
    description: 'Résultats des tests neuropsychologiques sur tablette',
    formats: 'Format: CSV',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    details: 'Données de tablette neuropsychologique pour plusieurs patients sur environ un mois'
  },
  {
    id: 'mri',
    title: 'IRM Fonctionnelle',
    description: 'Images d\'IRM fonctionnelle (fMRI)',
    formats: 'Formats: DICOM / NIfTI',
    icon: Scan,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    details: 'Images fMRI au format DICOM ou NIfTI'
  },
  {
    id: 'genomic',
    title: 'Données Génomiques',
    description: 'Séquences et données génomiques',
    formats: 'Formats: FASTA / FASTQ',
    icon: Dna,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    details: 'Données génomiques au format FASTA ou FASTQ'
  },
];

export default function PIDashboard() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [selectedModality, setSelectedModality] = useState<DataModality | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const handleUploadComplete = (fileData: any) => {
    const newUpload = {
      id: Math.random().toString(36).substr(2, 9),
      file_name: fileData.file_name,
      modality: fileData.modality,
      status: 'completed' as const,
      progress: 100,
      file_size: fileData.file_size,
      created_at: new Date().toISOString(),
    };
    setUploads([newUpload, ...uploads]);
  };

  const handleModalitySelect = (modality: DataModality) => {
    setSelectedModality(modality);
  };

  const handleBack = () => {
    setSelectedModality(null);
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Portail Investigateur Principal</h1>
            <p className="text-muted-foreground text-lg">
              {selectedModality ? 'Téléchargez vos données de recherche' : 'Sélectionnez la modalité de données à télécharger'}
            </p>
          </div>

          {!selectedModality ? (
            <>
              {/* Modality Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {modalities.map((modality) => {
                  const Icon = modality.icon;
                  return (
                    <Card 
                      key={modality.id}
                      className="bg-card hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary"
                      onClick={() => handleModalitySelect(modality.id)}
                    >
                      <CardHeader>
                        <div className={`w-16 h-16 rounded-lg ${modality.bgColor} flex items-center justify-center mb-4`}>
                          <Icon className={`h-8 w-8 ${modality.color}`} />
                        </div>
                        <CardTitle className="text-xl">{modality.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {modality.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">{modality.formats}</p>
                          <p className="text-xs text-muted-foreground">{modality.details}</p>
                          <Button className="w-full mt-4" variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Sélectionner
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-card hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total des Téléchargements
                    </CardTitle>
                    <Upload className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{uploads.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Fichiers téléchargés cette session
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Statut Contrôle Qualité
                    </CardTitle>
                    <FileCheck className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">98.5%</div>
                    <p className="text-xs text-muted-foreground">
                      Taux de validation réussie
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Upload History */}
              {uploads.length > 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Historique des Téléchargements</h2>
                    <UploadList uploads={uploads} />
                  </div>
                  <QAReportViewer userId={userId || undefined} />
                </div>
              )}
              
              {/* Show QA Report even without uploads */}
              {uploads.length === 0 && userId && (
                <QAReportViewer userId={userId} />
              )}
            </>
          ) : (
            <>
              {/* Back Button */}
              <Button 
                variant="ghost" 
                className="mb-6"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la sélection
              </Button>

              {/* Upload Section for Selected Modality */}
              <div className="space-y-6">
                <FileUpload 
                  onUploadComplete={handleUploadComplete}
                  preselectedModality={selectedModality}
                />
                
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Historique des Téléchargements</h2>
                  <UploadList uploads={uploads} />
                </div>

                {userId && <QAReportViewer userId={userId} />}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
