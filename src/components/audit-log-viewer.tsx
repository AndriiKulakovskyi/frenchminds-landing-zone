"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUp, UserCheck, Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  outcome: string;
  created_at: string;
  user_email?: string;
  details?: any;
}

interface AuditLogViewerProps {
  logs?: AuditLog[];
}

const actionIcons = {
  upload: FileUp,
  access: UserCheck,
  permission: Shield,
  validation: CheckCircle,
  default: AlertTriangle,
};

const outcomeColors = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failure: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export default function AuditLogViewer({ logs = [] }: AuditLogViewerProps) {
  const mockLogs: AuditLog[] = logs.length > 0 ? logs : [
    {
      id: '1',
      action: 'File Upload',
      resource_type: 'data_upload',
      outcome: 'success',
      created_at: new Date().toISOString(),
      user_email: 'researcher@example.com',
      details: { file_name: 'patient_001_mri.dcm', modality: 'mri' },
    },
    {
      id: '2',
      action: 'Data Validation',
      resource_type: 'validation',
      outcome: 'success',
      created_at: new Date(Date.now() - 300000).toISOString(),
      user_email: 'system',
      details: { checksum: 'verified', format: 'valid' },
    },
    {
      id: '3',
      action: 'Permission Update',
      resource_type: 'user_role',
      outcome: 'success',
      created_at: new Date(Date.now() - 600000).toISOString(),
      user_email: 'admin@example.com',
      details: { target_user: 'researcher@example.com', role: 'research_staff' },
    },
    {
      id: '4',
      action: 'File Upload',
      resource_type: 'data_upload',
      outcome: 'failure',
      created_at: new Date(Date.now() - 900000).toISOString(),
      user_email: 'researcher@example.com',
      details: { error: 'Invalid file format', file_name: 'data.txt' },
    },
  ];

  const getActionIcon = (action: string) => {
    const key = action.toLowerCase().split(' ')[0];
    return actionIcons[key as keyof typeof actionIcons] || actionIcons.default;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <CardDescription>
          Comprehensive activity tracking for compliance and security
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {mockLogs.map((log) => {
              const Icon = getActionIcon(log.action);
              return (
                <div
                  key={log.id}
                  className="flex gap-4 p-4 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{log.action}</h4>
                      <Badge
                        className={outcomeColors[log.outcome as keyof typeof outcomeColors] || outcomeColors.warning}
                      >
                        {log.outcome}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {log.user_email} • {formatTimestamp(log.created_at)}
                    </p>
                    {log.details && (
                      <div className="text-xs bg-muted/50 rounded p-2 font-mono">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground">{key}:</span>{' '}
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
