"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle, FileText, BarChart3, Database } from "lucide-react";
import { CsvQaReport, formatFileSize } from "@/utils/csv-qa";
import { Progress } from "@/components/ui/progress";

interface CsvQaReportViewerProps {
  report: CsvQaReport;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function CsvQaReportViewer({ report, onAccept, onReject }: CsvQaReportViewerProps) {
  const completenessScore = 100 - report.missingValuesPercentage;
  const uniquenessScore = 100 - report.duplicateRowsPercentage;
  const overallScore = (completenessScore + uniquenessScore) / 2;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };
  
  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header Status */}
      <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              QA Report: {report.fileName}
            </CardTitle>
            <CardDescription>
              Analyzed at {new Date(report.analyzedAt).toLocaleString()}
              {report.fileType && (
                <Badge variant="outline" className="ml-2">
                  {report.fileType}
                </Badge>
              )}
            </CardDescription>
          </div>
            <div className="flex flex-col items-end gap-2">
              {report.isValid ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Invalid
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">{formatFileSize(report.fileSize)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Errors */}
          {report.errors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Errors found:</strong>
                <ul className="list-disc list-inside mt-2">
                  {report.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Warnings */}
          {report.warnings.length > 0 && (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                <strong>Warnings:</strong>
                <ul className="list-disc list-inside mt-2">
                  {report.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Basic Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Rows</div>
              <div className="text-2xl font-bold">{report.totalRows.toLocaleString()}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Columns</div>
              <div className="text-2xl font-bold">{report.totalColumns}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Complete Rows</div>
              <div className="text-2xl font-bold">{report.summary.completeRows.toLocaleString()}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Delimiter</div>
              <div className="text-2xl font-bold font-mono">{report.delimiter === ',' ? 'Comma' : report.delimiter === '\t' ? 'Tab' : report.delimiter}</div>
            </div>
          </div>
          
          {/* Quality Scores */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Quality Score</span>
                <span className={`text-sm font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore.toFixed(1)}%
                </span>
              </div>
              <Progress value={overallScore} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Data Completeness</span>
                <span className={`text-sm font-bold ${getScoreColor(completenessScore)}`}>
                  {completenessScore.toFixed(1)}%
                </span>
              </div>
              <Progress value={completenessScore} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Data Uniqueness</span>
                <span className={`text-sm font-bold ${getScoreColor(uniquenessScore)}`}>
                  {uniquenessScore.toFixed(1)}%
                </span>
              </div>
              <Progress value={uniquenessScore} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="columns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="columns">
            <Database className="h-4 w-4 mr-2" />
            Column Analysis
          </TabsTrigger>
          <TabsTrigger value="quality">
            <BarChart3 className="h-4 w-4 mr-2" />
            Data Quality
          </TabsTrigger>
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Column Analysis Tab */}
        <TabsContent value="columns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Column Metrics</CardTitle>
              <CardDescription>
                Detailed analysis of each column in the CSV file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Unique Values</TableHead>
                      <TableHead className="text-right">Missing</TableHead>
                      <TableHead className="text-right">Missing %</TableHead>
                      <TableHead>Sample Values</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.columnMetrics.map((column, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{column.name || `Column ${column.index + 1}`}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{column.dataType}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{column.uniqueValues.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{column.missingValues.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <span className={column.missingPercentage > 20 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                            {column.missingPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {column.sampleValues.slice(0, 3).join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Numeric Statistics */}
          {report.columnMetrics.some(col => col.numericStats) && (
            <Card>
              <CardHeader>
                <CardTitle>Numeric Column Statistics</CardTitle>
                <CardDescription>
                  Statistical summary for numeric columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead className="text-right">Min</TableHead>
                        <TableHead className="text-right">Max</TableHead>
                        <TableHead className="text-right">Mean</TableHead>
                        <TableHead className="text-right">Median</TableHead>
                        <TableHead className="text-right">Std Dev</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.columnMetrics
                        .filter(col => col.numericStats)
                        .map((column, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{column.name}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {column.numericStats!.min.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {column.numericStats!.max.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {column.numericStats!.mean.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {column.numericStats!.median.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {column.numericStats!.stdDev.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Missing Values by Column</CardTitle>
              <CardDescription>
                Distribution of missing values across columns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(report.missingValuesByColumn)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([columnName, count]) => {
                    const percentage = (count / report.totalRows) * 100;
                    return (
                      <div key={columnName}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium truncate max-w-xs">{columnName}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Duplicate Rows</CardTitle>
                <CardDescription>
                  Analysis of duplicate records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Duplicates</span>
                    <span className="font-bold">{report.duplicateRowsCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Percentage</span>
                    <span className={`font-bold ${report.duplicateRowsPercentage > 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {report.duplicateRowsPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <Progress value={report.duplicateRowsPercentage} className="h-2 mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Empty Rows</CardTitle>
                <CardDescription>
                  Rows with no data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Empty Rows</span>
                    <span className="font-bold">{report.summary.emptyRows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Complete Rows</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {report.summary.completeRows.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(report.summary.completeRows / report.totalRows) * 100} 
                    className="h-2 mt-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Summary</CardTitle>
              <CardDescription>
                Overview of the CSV file structure and quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">File Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Name:</span>
                      <span className="font-medium truncate max-w-xs">{report.fileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size:</span>
                      <span className="font-medium">{formatFileSize(report.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Encoding:</span>
                      <span className="font-medium">{report.encoding}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delimiter:</span>
                      <span className="font-medium font-mono">{report.delimiter}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Data Structure</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rows:</span>
                      <span className="font-medium">{report.totalRows.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Columns:</span>
                      <span className="font-medium">{report.totalColumns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Has Header:</span>
                      <span className="font-medium">{report.hasHeader ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Field Length:</span>
                      <span className="font-medium">{report.summary.averageFieldLength} chars</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Column Names</h4>
                <div className="flex flex-wrap gap-2">
                  {report.columnNames.map((name, index) => (
                    <Badge key={index} variant="secondary">
                      {name || `Column ${index + 1}`}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Data Type Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    report.columnMetrics.reduce((acc, col) => {
                      acc[col.dataType] = (acc[col.dataType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <Badge key={type} variant="outline">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

