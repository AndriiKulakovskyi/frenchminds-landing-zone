"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import UserApproval from "@/components/user-approval";
import AdminUploadsTable from "@/components/admin-uploads-table";
import QAReportViewer from "@/components/qa-report-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, UserCheck, FileCheck, Shield } from "lucide-react";
import { createClient } from "../../supabase/client";

export default function AdminDashboard() {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [totalUploads, setTotalUploads] = useState(0);
  const [treatedUploads, setTreatedUploads] = useState(0);
  const [notTreatedUploads, setNotTreatedUploads] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const supabase = createClient();

        // Fetch pending approvals count
        const { count: pendingCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('approved', false);

        setPendingApprovals(pendingCount || 0);

        // Fetch uploads statistics
        const { data: uploads } = await supabase
          .from('data_uploads')
          .select('reviewed_by');

        if (uploads) {
          setTotalUploads(uploads.length);
          setTreatedUploads(uploads.filter(u => u.reviewed_by !== null).length);
          setNotTreatedUploads(uploads.filter(u => u.reviewed_by === null).length);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const handleUserApproved = () => {
    setPendingApprovals(prev => Math.max(0, prev - 1));
  };

  const stats = [
    {
      title: 'Total Uploads',
      value: isLoadingStats ? '...' : totalUploads.toString(),
      change: notTreatedUploads > 0 ? `${notTreatedUploads} pending` : 'All treated',
      icon: Upload,
      color: 'text-blue-600',
    },
    {
      title: 'Pending Approvals',
      value: isLoadingStats ? '...' : pendingApprovals.toString(),
      change: pendingApprovals > 0 ? 'Requires action' : 'None',
      icon: UserCheck,
      color: 'text-orange-600',
    },
    {
      title: 'Treated Uploads',
      value: isLoadingStats ? '...' : treatedUploads.toString(),
      change: totalUploads > 0 ? `${Math.round((treatedUploads / totalUploads) * 100)}%` : '0%',
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
                    <span className={stat.change.includes('+') ? 'text-green-600' : stat.change.includes('pending') || stat.change.includes('Requires') ? 'text-orange-600' : 'text-muted-foreground'}>
                      {stat.change}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="uploads" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid bg-muted p-1">
              <TabsTrigger value="uploads" className="data-[state=active]:bg-background">
                <Upload className="h-4 w-4 mr-2" />
                All Uploads
              </TabsTrigger>
              <TabsTrigger value="qa" className="data-[state=active]:bg-background">
                <FileCheck className="h-4 w-4 mr-2" />
                QA Status
              </TabsTrigger>
              <TabsTrigger value="approvals" className="data-[state=active]:bg-background">
                <UserCheck className="h-4 w-4 mr-2" />
                User Approvals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uploads">
              <AdminUploadsTable />
            </TabsContent>

            <TabsContent value="qa">
              <QAReportViewer />
            </TabsContent>

            <TabsContent value="approvals">
              <UserApproval onApprove={handleUserApproved} onReject={handleUserApproved} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
