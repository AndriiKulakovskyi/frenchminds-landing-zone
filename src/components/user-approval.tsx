"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, UserCheck, Mail } from "lucide-react";
import { createClient } from "../../supabase/client";

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  approved: boolean;
}

interface UserApprovalProps {
  users?: PendingUser[];
  onApprove?: (userId: string) => void;
}

export default function UserApproval({ users = [], onApprove }: UserApprovalProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(users.length > 0 ? users : [
    {
      id: '1',
      user_id: 'user-1',
      email: 'pi.researcher@example.com',
      role: 'principal_investigator',
      created_at: new Date().toISOString(),
      approved: false,
    },
    {
      id: '2',
      user_id: 'user-2',
      email: 'pi.scientist@example.com',
      role: 'principal_investigator',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      approved: false,
    },
  ]);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    setLoading(userId);
    
    // Simulate API call
    setTimeout(() => {
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      setLoading(null);
      if (onApprove) onApprove(userId);
    }, 1000);
  };

  const handleReject = async (userId: string) => {
    setLoading(userId);
    
    setTimeout(() => {
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      setLoading(null);
    }, 1000);
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          User Approval
        </CardTitle>
        <CardDescription>
          Review and approve Principal Investigator account requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Requested</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(user.user_id)}
                          disabled={loading === user.user_id}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(user.user_id)}
                          disabled={loading === user.user_id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
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
