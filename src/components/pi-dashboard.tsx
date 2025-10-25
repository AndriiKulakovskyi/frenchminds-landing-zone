"use client";

import { useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import FileUpload from "@/components/file-upload";
import UploadList from "@/components/upload-list";
import QAReportViewer from "@/components/qa-report-viewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileCheck } from "lucide-react";

export default function PIDashboard() {
  const [uploads, setUploads] = useState<any[]>([]);

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

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Principal Investigator Portal</h1>
            <p className="text-muted-foreground text-lg">
              Upload and manage clinical research data
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Uploads
                </CardTitle>
                <Upload className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{uploads.length}</div>
                <p className="text-xs text-muted-foreground">
                  Files uploaded this session
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  QA Status
                </CardTitle>
                <FileCheck className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">98.5%</div>
                <p className="text-xs text-muted-foreground">
                  Validation success rate
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <FileUpload onUploadComplete={handleUploadComplete} />
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upload History</h2>
              <UploadList uploads={uploads} />
            </div>

            <QAReportViewer />
          </div>
        </div>
      </main>
    </>
  );
}
