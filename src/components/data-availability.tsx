"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface ModalityStats {
  modality: string;
  totalUploads: number;
  validated: number;
  pending: number;
  failed: number;
}

interface DataAvailabilityProps {
  modalityStats?: ModalityStats[];
}

const modalityLabels = {
  clinical: 'Clinical Data',
  wearable: 'Wearable Devices',
  neuropsychological: 'Neuropsych Tests',
  mri: 'MRI Scans',
  genomic: 'Genomic Data',
};

export default function DataAvailability({ modalityStats = [] }: DataAvailabilityProps) {
  const mockStats: ModalityStats[] = modalityStats.length > 0 ? modalityStats : [
    {
      modality: 'clinical',
      totalUploads: 45,
      validated: 43,
      pending: 2,
      failed: 0,
    },
    {
      modality: 'wearable',
      totalUploads: 38,
      validated: 35,
      pending: 2,
      failed: 1,
    },
    {
      modality: 'neuropsychological',
      totalUploads: 32,
      validated: 30,
      pending: 1,
      failed: 1,
    },
    {
      modality: 'mri',
      totalUploads: 28,
      validated: 26,
      pending: 1,
      failed: 1,
    },
    {
      modality: 'genomic',
      totalUploads: 15,
      validated: 14,
      pending: 1,
      failed: 0,
    },
  ];

  const calculateSuccessRate = (stats: ModalityStats) => {
    if (stats.totalUploads === 0) return 0;
    return Math.round((stats.validated / stats.totalUploads) * 100);
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Data Modality Overview</CardTitle>
        <CardDescription>
          Upload statistics across all data modalities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Data Modality</TableHead>
                <TableHead className="text-center font-semibold">Total Uploads</TableHead>
                <TableHead className="text-center font-semibold">Validated</TableHead>
                <TableHead className="text-center font-semibold">Pending</TableHead>
                <TableHead className="text-center font-semibold">Failed</TableHead>
                <TableHead className="text-center font-semibold">Success Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStats.map((stat, idx) => {
                const successRate = calculateSuccessRate(stat);
                return (
                  <TableRow key={idx} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {modalityLabels[stat.modality as keyof typeof modalityLabels] || stat.modality}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-normal">
                        {stat.totalUploads}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span>{stat.validated}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span>{stat.pending}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span>{stat.failed}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-sm">{successRate}%</span>
                        {successRate === 100 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : successRate >= 80 ? (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
