"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, UserCheck, Mail, AlertCircle } from "lucide-react";
import { createClient } from "../../supabase/client";
import { approveUserAction, rejectUserAction } from "@/app/actions";
import { useToast } from "@/components/ui/use-toast";

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  approved: boolean;
}

interface UserApprovalProps {
  users?: PendingUser[];
  onApprove?: (userId: string) => void;
  onReject?: (userId: string) => void;
}

export default function UserApproval({ users = [], onApprove, onReject }: UserApprovalProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch pending users from database
  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const supabase = createClient();
        
        // First get pending user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('id, user_id, role, created_at, approved')
          .eq('approved', false)
          .order('created_at', { ascending: false });

        if (rolesError) {
          console.error('Error fetching pending roles:', rolesError);
          toast({
            title: "Error",
            description: "Failed to load pending users",
            variant: "destructive",
          });
          return;
        }

        if (!rolesData || rolesData.length === 0) {
          setPendingUsers([]);
          setIsLoading(false);
          return;
        }

        // Get user details from auth.users via public.users
        const userIds = rolesData.map(role => role.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', userIds);

        if (usersError) {
          console.error('Error fetching user details:', usersError);
        }

        // Combine the data
        const formattedUsers = rolesData.map(role => {
          const userDetail = usersData?.find(u => u.id === role.user_id);
          return {
            id: role.id,
            user_id: role.user_id,
            email: userDetail?.email || 'Unknown',
            full_name: userDetail?.full_name || 'Unknown',
            role: role.role,
            created_at: role.created_at,
            approved: role.approved
          };
        });

        console.log('Fetched pending users:', formattedUsers);
        setPendingUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching pending users:', error);
        toast({
          title: "Error",
          description: "Failed to load pending users",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingUsers();
  }, [toast]);

  const handleApprove = async (userId: string) => {
    setLoading(userId);
    
    try {
      await approveUserAction(userId);
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      toast({
        title: "Success",
        description: "User approved successfully",
      });
      if (onApprove) onApprove(userId);
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve user",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setLoading(userId);
    
    try {
      await rejectUserAction(userId);
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      toast({
        title: "Success",
        description: "User rejected and removed from pending list",
      });
      if (onReject) onReject(userId);
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject user",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            User Approvals
          </CardTitle>
          <CardDescription>
            Review and approve Principal Investigator account requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pending users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          User Approvals
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
                  <TableHead className="font-semibold">Name</TableHead>
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
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.full_name || 'N/A'}</span>
                      </div>
                    </TableCell>
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
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
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
