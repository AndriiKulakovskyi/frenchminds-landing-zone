"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import UserApproval from "@/components/user-approval";
import UploadList from "@/components/upload-list";
import QAReportViewer from "@/components/qa-report-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, UserCheck, FileCheck, Shield } from "lucide-react";
import { createClient } from "../../supabase/client";

export default function AdminDashboard() {
  const [allUploads] = useState<any[]>([
    {
      id: '1',
      file_name: 'patient_001_mri.dcm',
      modality: 'mri',
      status: 'completed',
      progress: 100,
      file_size: 524288000,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      file_name: 'patient_002_clinical.csv',
      modality: 'clinical',
      status: 'completed',
      progress: 100,
      file_size: 2048000,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      file_name: 'patient_003_genomic.vcf',
      modality: 'genomic',
      status: 'failed',
      progress: 0,
      file_size: 10485760,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch pending approvals count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('approved', false);

        if (error) {
          console.error('Error fetching pending count:', error);
          return;
        }

        setPendingApprovals(count || 0);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchPendingCount();
  }, []);

  const handleUserApproved = () => {
    // Refresh the pending count when a user is approved
    setPendingApprovals(prev => Math.max(0, prev - 1));
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
      title: 'Pending Approvals',
      value: isLoadingStats ? '...' : pendingApprovals.toString(),
      change: '-1',
      icon: UserCheck,
      color: 'text-orange-600',
    },
    {
      title: 'QA Success Rate',
      value: '98.5%',
      change: '+2.1%',
      icon: FileCheck,
      color: 'text-green-600',
    },
    {
      title: 'Compliance Score',
      value: '100%',
      change: '0%',
      icon: Shield,
      color: 'text-purple-600',
    },
  ];

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Manage users, monitor uploads, and review QA status
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
                    <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                      {stat.change}
                    </span> from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="approvals" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-muted p-1">
              <TabsTrigger value="approvals" className="data-[state=active]:bg-background">
                <UserCheck className="h-4 w-4 mr-2" />
                User Approvals
              </TabsTrigger>
              <TabsTrigger value="uploads" className="data-[state=active]:bg-background">
                <Upload className="h-4 w-4 mr-2" />
                All Uploads
              </TabsTrigger>
              <TabsTrigger value="qa" className="data-[state=active]:bg-background">
                <FileCheck className="h-4 w-4 mr-2" />
                QA Status
              </TabsTrigger>
            </TabsList>

            <TabsContent value="approvals">
              <UserApproval onApprove={handleUserApproved} />
            </TabsContent>

            <TabsContent value="uploads">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>All Data Uploads</CardTitle>
                  <CardDescription>
                    Complete history of uploads from all Principal Investigators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadList uploads={allUploads} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qa">
              <QAReportViewer />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
