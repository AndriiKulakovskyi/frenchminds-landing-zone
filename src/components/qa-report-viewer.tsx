"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertCircle, Clock, FileText, Eye } from "lucide-react";
import { createClient } from "../../supabase/client";
import CsvQaReportViewer from "./csv-qa-report-viewer";
import { CsvQaReport, formatFileSize } from "@/utils/csv-qa";

interface QAReport {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  modality: string;
  status: string;
  qa_status: string | null;
  qa_score: number | null;
  qa_report: any;
  qa_completed_at: string | null;
  validation_results: {
    checksum?: string;
    format?: string;
    integrity?: string;
    errors?: string[];
    qa_passed?: boolean;
    total_rows?: number;
    total_columns?: number;
  };
  created_at: string;
  uploaded_by: string;
}

interface QAReportViewerProps {
  userId?: string;
  reports?: QAReport[];
}

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900', label: 'Réussi' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900', label: 'Échoué' },
  validating: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900', label: 'En validation' },
  pending: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900', label: 'En attente' },
};

const qaStatusConfig = {
  passed: { icon: CheckCircle2, color: 'text-green-600', label: 'CQ Réussie' },
  passed_with_warnings: { icon: AlertCircle, color: 'text-yellow-600', label: 'CQ Avertissements' },
  failed: { icon: XCircle, color: 'text-red-600', label: 'CQ Échouée' },
  not_started: { icon: Clock, color: 'text-gray-600', label: 'Non analysé' },
};

export default function QAReportViewer({ userId, reports = [] }: QAReportViewerProps) {
  const [uploadsData, setUploadsData] = useState<QAReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CsvQaReport | null>(null);

  useEffect(() => {
    if (reports.length === 0) {
      fetchUploads();
    } else {
      setUploadsData(reports);
      setLoading(false);
    }
  }, [reports, userId]);

  const fetchUploads = async () => {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('data_uploads')
        .select('id, file_name, file_size, file_type, modality, status, qa_status, qa_score, qa_report, qa_completed_at, validation_results, created_at, uploaded_by')
        .order('created_at', { ascending: false })
        .limit(20);

      // If userId is provided, filter by user (for PI dashboard)
      if (userId) {
        query = query.eq('uploaded_by', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setUploadsData(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalityBadge = (modality: string) => {
    const colors: Record<string, string> = {
      clinical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      wearable: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      neuropsychological: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      mri: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      genomic: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
    };
    
    return (
      <Badge className={colors[modality] || 'bg-gray-100 text-gray-800'}>
        {modality}
      </Badge>
    );
  };

  const getQaScoreBadge = (score: number | null, qaStatus: string | null) => {
    if (!score || !qaStatus || qaStatus === 'not_started') {
      return <span className="text-sm text-muted-foreground">N/A</span>;
    }

    const color = score >= 90 ? 'text-green-600 dark:text-green-400' :
                  score >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400';

    return <span className={`font-semibold ${color}`}>{score.toFixed(1)}%</span>;
  };

  if (loading) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Rapports de Validation CQ</CardTitle>
          <CardDescription>
            Chargement des résultats de contrôle qualité...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Rapports de Validation CQ
        </CardTitle>
        <CardDescription>
          Résultats de contrôle qualité automatisé pour les fichiers téléchargés
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadsData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun fichier téléchargé pour le moment.
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nom du Fichier</TableHead>
                    <TableHead className="font-semibold">Modalité</TableHead>
                    <TableHead className="font-semibold">Type de Fichier</TableHead>
                    <TableHead className="font-semibold">Taille</TableHead>
                    <TableHead className="font-semibold">Statut CQ</TableHead>
                    <TableHead className="font-semibold">Score CQ</TableHead>
                    <TableHead className="font-semibold">Détails</TableHead>
                    <TableHead className="font-semibold">Horodatage</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadsData.map((report) => {
                    const qaConfig = qaStatusConfig[report.qa_status as keyof typeof qaStatusConfig] || qaStatusConfig.not_started;
                    const QAIcon = qaConfig.icon;
                    
                    return (
                      <TableRow key={report.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium max-w-xs truncate">
                          {report.file_name}
                        </TableCell>
                        <TableCell>
                          {getModalityBadge(report.modality)}
                        </TableCell>
                        <TableCell>
                          {report.file_type ? (
                            <Badge variant="secondary" className="text-xs">
                              {report.file_type.replace('wearable-', '').replace('clinical-', '').replace('neuropsychological-', '')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(report.file_size)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <QAIcon className={`h-4 w-4 ${qaConfig.color}`} />
                            <span className="text-sm font-medium">{qaConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getQaScoreBadge(report.qa_score, report.qa_status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {report.validation_results?.total_rows ? (
                            <div className="space-y-1">
                              <div>{report.validation_results.total_rows.toLocaleString()} lignes</div>
                              <div>{report.validation_results.total_columns} colonnes</div>
                            </div>
                          ) : (
                            <span>-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleString('fr-FR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {report.qa_report && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedReport(report.qa_report as CsvQaReport)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir CQ
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Rapport CQ: {report.file_name}</DialogTitle>
                                  <DialogDescription>
                                    Analyse effectuée le {report.qa_completed_at ? new Date(report.qa_completed_at).toLocaleString('fr-FR') : 'N/A'}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedReport && <CsvQaReportViewer report={selectedReport} />}
                              </DialogContent>
                            </Dialog>
                          )}
                          {!report.qa_report && report.qa_status === 'not_started' && (
                            <Badge variant="outline" className="text-xs">
                              Pas de CQ
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {uploadsData.some(r => r.validation_results?.errors) && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-destructive">Erreurs de Validation :</h4>
                {uploadsData.filter(r => r.validation_results?.errors).map(report => (
                  <div key={report.id} className="text-sm bg-destructive/10 p-3 rounded-lg">
                    <p className="font-medium">{report.file_name} :</p>
                    <ul className="list-disc list-inside ml-2 text-muted-foreground">
                      {report.validation_results.errors?.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
