"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface PatientData {
  patient_identifier: string;
  study_id: string;
  clinical: boolean;
  wearable: boolean;
  neuropsychological: boolean;
  mri: boolean;
  genomic: boolean;
}

interface DataAvailabilityProps {
  patients?: PatientData[];
}

const modalities = [
  { key: 'clinical', label: 'Clinical' },
  { key: 'wearable', label: 'Wearable' },
  { key: 'neuropsychological', label: 'Neuropsych' },
  { key: 'mri', label: 'MRI' },
  { key: 'genomic', label: 'Genomic' },
];

export default function DataAvailability({ patients = [] }: DataAvailabilityProps) {
  const mockPatients: PatientData[] = patients.length > 0 ? patients : [
    {
      patient_identifier: 'PT-001',
      study_id: 'STUDY-2024-001',
      clinical: true,
      wearable: true,
      neuropsychological: true,
      mri: false,
      genomic: true,
    },
    {
      patient_identifier: 'PT-002',
      study_id: 'STUDY-2024-001',
      clinical: true,
      wearable: false,
      neuropsychological: true,
      mri: true,
      genomic: false,
    },
    {
      patient_identifier: 'PT-003',
      study_id: 'STUDY-2024-002',
      clinical: true,
      wearable: true,
      neuropsychological: false,
      mri: true,
      genomic: true,
    },
  ];

  const calculateCompleteness = (patient: PatientData) => {
    const total = modalities.length;
    const available = modalities.filter(m => patient[m.key as keyof PatientData]).length;
    return Math.round((available / total) * 100);
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Patient Data Availability</CardTitle>
        <CardDescription>
          Overview of validated data across all modalities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Patient ID</TableHead>
                <TableHead className="font-semibold">Study</TableHead>
                {modalities.map(m => (
                  <TableHead key={m.key} className="text-center font-semibold">
                    {m.label}
                  </TableHead>
                ))}
                <TableHead className="text-center font-semibold">Complete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPatients.map((patient, idx) => {
                const completeness = calculateCompleteness(patient);
                return (
                  <TableRow key={idx} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{patient.patient_identifier}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {patient.study_id}
                      </Badge>
                    </TableCell>
                    {modalities.map(m => (
                      <TableCell key={m.key} className="text-center">
                        {patient[m.key as keyof PatientData] ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-sm">{completeness}%</span>
                        {completeness === 100 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : completeness >= 60 ? (
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
