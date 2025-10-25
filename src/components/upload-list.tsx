import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileIcon, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export type UploadStatus = 'pending' | 'uploading' | 'validating' | 'completed' | 'failed';
export type DataModality = 'clinical' | 'wearable' | 'neuropsychological' | 'mri' | 'genomic';

interface Upload {
  id: string;
  file_name: string;
  modality: DataModality;
  status: UploadStatus;
  progress: number;
  file_size: number;
  created_at: string;
}

interface UploadListProps {
  uploads?: Upload[];
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-500', label: 'En attente' },
  uploading: { icon: Clock, color: 'bg-blue-500', label: 'Téléchargement' },
  validating: { icon: AlertCircle, color: 'bg-purple-500', label: 'Validation' },
  completed: { icon: CheckCircle2, color: 'bg-green-500', label: 'Terminé' },
  failed: { icon: XCircle, color: 'bg-red-500', label: 'Échoué' },
};

const modalityColors = {
  clinical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  wearable: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  neuropsychological: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  mri: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  genomic: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export default function UploadList({ uploads = [] }: UploadListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Octets';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (uploads.length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun téléchargement pour le moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 bg-background">
      {uploads.map((upload) => {
        const StatusIcon = statusConfig[upload.status].icon;
        return (
          <Card key={upload.id} className="bg-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    {upload.file_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {formatFileSize(upload.file_size)} • {new Date(upload.created_at).toLocaleString('fr-FR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={modalityColors[upload.modality]}>
                    {upload.modality}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <StatusIcon className={`h-4 w-4 ${statusConfig[upload.status].color.replace('bg-', 'text-')}`} />
                    <span className="text-sm font-medium">{statusConfig[upload.status].label}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            {upload.status === 'uploading' && (
              <CardContent className="pt-0">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{upload.progress}% terminé</p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
