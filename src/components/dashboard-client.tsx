"use client";

import { useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import FileUpload from "@/components/file-upload";
import UploadList from "@/components/upload-list";
import DataAvailability from "@/components/data-availability";
import AuditLogViewer from "@/components/audit-log-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Database, Activity, Shield } from "lucide-react";

export default function DashboardClient() {
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

  const stats = [
    {
      title: 'Total Uploads',
      value: '247',
      change: '+12%',
      icon: Upload,
      color: 'text-blue-600',
    },
    {
      title: 'Data Modalities',
      value: '5',
      change: '0%',
      icon: Database,
      color: 'text-green-600',
    },
    {
      title: 'Validation Rate',
      value: '98.5%',
      change: '+2.1%',
      icon: Activity,
      color: 'text-purple-600',
    },
    {
      title: 'Compliance Score',
      value: '100%',
      change: '0%',
      icon: Shield,
      color: 'text-orange-600',
    },
  ];

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Clinical Research Portal</h1>
            <p className="text-muted-foreground text-lg">
              Secure multimodal data management for clinical research
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="bg-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600 font-medium">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-muted p-1">
              <TabsTrigger value="upload" className="data-[state=active]:bg-background">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-background">
                <Database className="h-4 w-4 mr-2" />
                Data Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-background">
                <Activity className="h-4 w-4 mr-2" />
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-background">
                <Shield className="h-4 w-4 mr-2" />
                Audit Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FileUpload onUploadComplete={handleUploadComplete} />
                <div>
                  <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
                  <UploadList uploads={uploads} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data">
              <DataAvailability />
            </TabsContent>

            <TabsContent value="activity">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest uploads and validation results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadList uploads={uploads} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <AuditLogViewer />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
