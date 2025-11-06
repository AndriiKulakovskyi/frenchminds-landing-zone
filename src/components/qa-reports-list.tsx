"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { createClient } from "../../supabase/client";
import CsvQaReportViewer from "./csv-qa-report-viewer";
import { CsvQaReport, formatFileSize } from "@/utils/csv-qa";

interface QaUpload {
  id: string;
  file_name: string;
  file_size: number;
  modality: string;
  qa_status: string | null;
  qa_score: number | null;
  qa_report: any;
  qa_completed_at: string | null;
  created_at: string;
  uploaded_by: string;
}

export default function QaReportViewer() {
  const [uploads, setUploads] = useState<QaUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CsvQaReport | null>(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('data_uploads')
        .select('id, file_name, file_size, modality, qa_status, qa_score, qa_report, qa_completed_at, created_at, uploaded_by')
        .in('modality', ['clinical', 'wearable', 'neuropsychological'])
        .not('qa_report', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null, score: number | null) => {
    if (!status) {
      return <Badge variant="secondary">Not Started</Badge>;
    }

    switch (status) {
      case 'passed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Passed {score ? `(${score.toFixed(1)}%)` : ''}
          </Badge>
        );
      case 'passed_with_warnings':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warnings {score ? `(${score.toFixed(1)}%)` : ''}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getModalityBadge = (modality: string) => {
    const colors: Record<string, string> = {
      clinical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      wearable: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      neuropsychological: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    };
    
    return (
      <Badge className={colors[modality] || 'bg-gray-100 text-gray-800'}>
        {modality}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading QA Reports...</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CSV Quality Assurance Reports
        </CardTitle>
        <CardDescription>
          View quality analysis results for uploaded CSV files
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No QA reports available yet. Upload some CSV files to see their quality analysis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>QA Status</TableHead>
                  <TableHead>QA Score</TableHead>
                  <TableHead>Analyzed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">{upload.file_name}</TableCell>
                    <TableCell>{getModalityBadge(upload.modality)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(upload.file_size)}
                    </TableCell>
                    <TableCell>{getStatusBadge(upload.qa_status, upload.qa_score)}</TableCell>
                    <TableCell>
                      {upload.qa_score ? (
                        <span className={
                          upload.qa_score >= 90 ? 'text-green-600 dark:text-green-400 font-semibold' :
                          upload.qa_score >= 70 ? 'text-yellow-600 dark:text-yellow-400 font-semibold' :
                          'text-red-600 dark:text-red-400 font-semibold'
                        }>
                          {upload.qa_score.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {upload.qa_completed_at 
                        ? new Date(upload.qa_completed_at).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(upload.qa_report as CsvQaReport)}
                            disabled={!upload.qa_report}
                          >
                            View Report
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>QA Report: {upload.file_name}</DialogTitle>
                            <DialogDescription>
                              Quality analysis performed on {upload.qa_completed_at ? new Date(upload.qa_completed_at).toLocaleString() : 'N/A'}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedReport && <CsvQaReportViewer report={selectedReport} />}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

