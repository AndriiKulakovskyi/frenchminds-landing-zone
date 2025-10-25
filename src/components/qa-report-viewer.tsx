"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

interface QAReport {
  id: string;
  file_name: string;
  modality: string;
  status: string;
  validation_results: {
    checksum?: string;
    format?: string;
    integrity?: string;
    errors?: string[];
  };
  created_at: string;
}

interface QAReportViewerProps {
  reports?: QAReport[];
}

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900', label: 'Passed' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900', label: 'Failed' },
  validating: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900', label: 'Validating' },
  pending: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900', label: 'Pending' },
};

export default function QAReportViewer({ reports = [] }: QAReportViewerProps) {
  const mockReports: QAReport[] = reports.length > 0 ? reports : [
    {
      id: '1',
      file_name: 'patient_001_mri.dcm',
      modality: 'mri',
      status: 'completed',
      validation_results: {
        checksum: 'verified',
        format: 'valid',
        integrity: 'passed',
      },
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      file_name: 'patient_002_clinical.csv',
      modality: 'clinical',
      status: 'completed',
      validation_results: {
        checksum: 'verified',
        format: 'valid',
        integrity: 'passed',
      },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      file_name: 'patient_003_genomic.vcf',
      modality: 'genomic',
      status: 'failed',
      validation_results: {
        checksum: 'failed',
        format: 'invalid',
        errors: ['Invalid file format', 'Checksum mismatch'],
      },
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>QA Validation Reports</CardTitle>
        <CardDescription>
          Automated quality assurance results for uploaded files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">File Name</TableHead>
                <TableHead className="font-semibold">Modality</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Checksum</TableHead>
                <TableHead className="font-semibold">Format</TableHead>
                <TableHead className="font-semibold">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReports.map((report) => {
                const config = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <TableRow key={report.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{report.file_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {report.modality}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.validation_results.checksum === 'verified' ? 'default' : 'destructive'}>
                        {report.validation_results.checksum || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.validation_results.format === 'valid' ? 'default' : 'destructive'}>
                        {report.validation_results.format || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {mockReports.some(r => r.validation_results.errors) && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold text-destructive">Validation Errors:</h4>
            {mockReports.filter(r => r.validation_results.errors).map(report => (
              <div key={report.id} className="text-sm bg-destructive/10 p-3 rounded-lg">
                <p className="font-medium">{report.file_name}:</p>
                <ul className="list-disc list-inside ml-2 text-muted-foreground">
                  {report.validation_results.errors?.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
