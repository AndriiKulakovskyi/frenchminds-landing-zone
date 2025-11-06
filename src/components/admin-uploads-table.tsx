"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CheckCircle, FileIcon, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "../../supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

type FilterType = 'all' | 'treated' | 'not-treated';

interface Upload {
  id: string;
  file_name: string;
  file_path: string | null;
  file_size: number;
  modality: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_by: string | null;
  uploader_email?: string;
  reviewer_email?: string;
}

const modalityColors = {
  clinical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  wearable: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  neuropsychological: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  mri: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  genomic: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export default function AdminUploadsTable() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<Upload[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [treatingId, setTreatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUploads = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Fetch uploads with user information
      const { data, error: fetchError } = await supabase
        .from('data_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch user emails for uploaded_by and reviewed_by
      const uploadsWithEmails = await Promise.all(
        (data || []).map(async (upload) => {
          let uploader_email = '';
          let reviewer_email = '';

          if (upload.uploaded_by) {
            const { data: userData } = await supabase
              .from('users')
              .select('email')
              .eq('id', upload.uploaded_by)
              .single();
            uploader_email = userData?.email || 'Unknown';
          }

          if (upload.reviewed_by) {
            const { data: reviewerData } = await supabase
              .from('users')
              .select('email')
              .eq('id', upload.reviewed_by)
              .single();
            reviewer_email = reviewerData?.email || 'Unknown';
          }

          return {
            ...upload,
            uploader_email,
            reviewer_email
          };
        })
      );

      setUploads(uploadsWithEmails);
    } catch (err: any) {
      console.error('Error fetching uploads:', err);
      setError(err.message || 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  useEffect(() => {
    // Apply filter
    if (filter === 'treated') {
      setFilteredUploads(uploads.filter(u => u.reviewed_by !== null));
    } else if (filter === 'not-treated') {
      setFilteredUploads(uploads.filter(u => u.reviewed_by === null));
    } else {
      setFilteredUploads(uploads);
    }
  }, [filter, uploads]);

  const handleDownload = async (upload: Upload) => {
    if (!upload.file_path) {
      toast({
        title: "Error",
        description: "File path not available",
        variant: "destructive"
      });
      return;
    }

    setDownloadingId(upload.id);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.storage
        .from('clinical-data-uploads')
        .download(upload.file_path);

      if (error) throw error;

      // Create blob URL and trigger download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = upload.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `File "${upload.file_name}" downloaded successfully`,
      });
    } catch (err: any) {
      console.error('Download error:', err);
      toast({
        title: "Download Failed",
        description: err.message || 'Failed to download file',
        variant: "destructive"
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMarkAsTreated = async (uploadId: string) => {
    setTreatingId(uploadId);

    try {
      const supabase = createClient();
      
      // Get current admin user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Update the upload with review information
      const { error: updateError } = await supabase
        .from('data_uploads')
        .update({
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', uploadId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Upload marked as treated",
      });

      // Refresh the list
      await fetchUploads();
    } catch (err: any) {
      console.error('Mark as treated error:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to mark as treated',
        variant: "destructive"
      });
    } finally {
      setTreatingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card">
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>All Data Uploads</CardTitle>
        <CardDescription>
          Complete history of uploads from all users
        </CardDescription>
        <div className="flex gap-2 pt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({uploads.length})
          </Button>
          <Button
            variant={filter === 'not-treated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('not-treated')}
          >
            Not Treated ({uploads.filter(u => u.reviewed_by === null).length})
          </Button>
          <Button
            variant={filter === 'treated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('treated')}
          >
            Treated ({uploads.filter(u => u.reviewed_by !== null).length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredUploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'treated' && 'No treated uploads yet'}
              {filter === 'not-treated' && 'No uploads pending treatment'}
              {filter === 'all' && 'No uploads found'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">File Name</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Modality</TableHead>
                  <TableHead className="font-semibold">Upload Date</TableHead>
                  <TableHead className="font-semibold">Size</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUploads.map((upload) => (
                  <TableRow key={upload.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="max-w-xs truncate">{upload.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{upload.uploader_email || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={modalityColors[upload.modality as keyof typeof modalityColors] || 'bg-gray-100 text-gray-800'}>
                        {upload.modality}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(upload.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatFileSize(upload.file_size)}
                    </TableCell>
                    <TableCell>
                      {upload.reviewed_by ? (
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 w-fit">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Treated
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            by {upload.reviewer_email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {upload.reviewed_at && formatDate(upload.reviewed_at)}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Not Treated
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(upload)}
                          disabled={downloadingId === upload.id}
                        >
                          {downloadingId === upload.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
                        {!upload.reviewed_by && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsTreated(upload.id)}
                            disabled={treatingId === upload.id}
                          >
                            {treatingId === upload.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark as Treated
                              </>
                            )}
                          </Button>
                        )}
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

