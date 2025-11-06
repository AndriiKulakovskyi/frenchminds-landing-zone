/**
 * CSV Quality Assurance (QA) Pipeline
 * 
 * This module provides comprehensive QA metrics and validation for CSV files
 * before they are stored in the database.
 */

export interface CsvQaReport {
  // File-level metrics
  fileName: string;
  fileSize: number;
  encoding: string;
  fileType?: string; // e.g., 'clinical-generic', 'wearable-fitbit', 'wearable-questionnaire'
  
  // Structure metrics
  totalRows: number;
  totalColumns: number;
  columnNames: string[];
  delimiter: string;
  hasHeader: boolean;
  
  // Data quality metrics
  missingValuesCount: number;
  missingValuesByColumn: Record<string, number>;
  missingValuesPercentage: number;
  
  duplicateRowsCount: number;
  duplicateRowsPercentage: number;
  
  // Column-level metrics
  columnMetrics: ColumnMetrics[];
  
  // Validation results
  isValid: boolean;
  errors: string[];
  warnings: string[];
  
  // Statistical summary
  summary: {
    emptyRows: number;
    completeRows: number;
    averageFieldLength: number;
  };
  
  // Timestamp
  analyzedAt: string;
}

export interface ColumnMetrics {
  name: string;
  index: number;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'mixed' | 'empty';
  uniqueValues: number;
  missingValues: number;
  missingPercentage: number;
  sampleValues: any[];
  
  // For numeric columns
  numericStats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
  };
  
  // For string columns
  stringStats?: {
    minLength: number;
    maxLength: number;
    avgLength: number;
  };
}

/**
 * Detects the CSV delimiter from the file content
 */
function detectDelimiter(content: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = content.split('\n')[0];
  
  const counts = delimiters.map(delimiter => ({
    delimiter,
    count: (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length
  }));
  
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].delimiter : ',';
}

/**
 * Detects the specific file type based on column headers
 */
function detectFileType(columnNames: string[], modality: string): string {
  // Normalize column names (trim, lowercase)
  const normalized = columnNames.map(col => col.trim().toLowerCase());
  
  if (modality === 'clinical') {
    return 'clinical-generic';
  }
  
  if (modality === 'wearable') {
    // Fitbit signature columns
    const fitbitSignature = ['id', 'num_jour', 'date_jour', 'heure_endor', 'duree_sommeil', 'score_sommeil'];
    const fitbitMatches = fitbitSignature.filter(col => normalized.includes(col)).length;
    
    // Questionnaire signature columns
    const questionnaireSignature = ['identification.id', 'age', 'sex', 'height', 'weight', 'shaps_q1', 'isi_q1'];
    const questionnaireMatches = questionnaireSignature.filter(col => normalized.includes(col)).length;
    
    if (fitbitMatches >= 4) return 'wearable-fitbit';
    if (questionnaireMatches >= 4) return 'wearable-questionnaire';
    
    return 'wearable-unknown';
  }
  
  if (modality === 'neuropsychological') {
    return 'neuropsychological-generic';
  }
  
  return 'unknown';
}

/**
 * Parses CSV content into rows
 */
function parseCsvContent(content: string, delimiter: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  return lines.map(line => {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    return values;
  });
}

/**
 * Detects the data type of a column
 */
function detectDataType(values: string[]): 'string' | 'number' | 'date' | 'boolean' | 'mixed' | 'empty' {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v.trim() !== '');
  
  if (nonEmptyValues.length === 0) return 'empty';
  
  let numberCount = 0;
  let dateCount = 0;
  let booleanCount = 0;
  
  for (const value of nonEmptyValues) {
    const trimmed = value.trim();
    
    // Check boolean
    if (['true', 'false', 'yes', 'no', '1', '0'].includes(trimmed.toLowerCase())) {
      booleanCount++;
    }
    
    // Check number
    if (!isNaN(Number(trimmed)) && trimmed !== '') {
      numberCount++;
    }
    
    // Check date
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && trimmed.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/)) {
      dateCount++;
    }
  }
  
  const total = nonEmptyValues.length;
  const threshold = 0.8; // 80% of values should match the type
  
  if (numberCount / total >= threshold) return 'number';
  if (dateCount / total >= threshold) return 'date';
  if (booleanCount / total >= threshold) return 'boolean';
  
  if (numberCount > 0 || dateCount > 0 || booleanCount > 0) return 'mixed';
  
  return 'string';
}

/**
 * Calculates numeric statistics for a column
 */
function calculateNumericStats(values: number[]): ColumnMetrics['numericStats'] {
  if (values.length === 0) return undefined;
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    median,
    stdDev
  };
}

/**
 * Calculates string statistics for a column
 */
function calculateStringStats(values: string[]): ColumnMetrics['stringStats'] {
  if (values.length === 0) return undefined;
  
  const lengths = values.map(v => v.length);
  const avgLength = lengths.reduce((acc, len) => acc + len, 0) / lengths.length;
  
  return {
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    avgLength: Math.round(avgLength * 100) / 100
  };
}

/**
 * Analyzes a single column
 */
function analyzeColumn(columnValues: string[], columnName: string, columnIndex: number, totalRows: number): ColumnMetrics {
  const nonEmptyValues = columnValues.filter(v => v !== null && v !== undefined && v.trim() !== '');
  const missingValues = totalRows - nonEmptyValues.length;
  const uniqueValues = new Set(nonEmptyValues).size;
  
  const dataType = detectDataType(columnValues);
  
  const metrics: ColumnMetrics = {
    name: columnName,
    index: columnIndex,
    dataType,
    uniqueValues,
    missingValues,
    missingPercentage: (missingValues / totalRows) * 100,
    sampleValues: nonEmptyValues.slice(0, 5)
  };
  
  // Calculate numeric stats if the column is numeric
  if (dataType === 'number') {
    const numericValues = nonEmptyValues
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
    metrics.numericStats = calculateNumericStats(numericValues);
  }
  
  // Calculate string stats if the column is string
  if (dataType === 'string') {
    metrics.stringStats = calculateStringStats(nonEmptyValues);
  }
  
  return metrics;
}

/**
 * Detects duplicate rows
 */
function findDuplicateRows(rows: string[][]): number {
  const rowStrings = rows.map(row => JSON.stringify(row));
  const uniqueRows = new Set(rowStrings);
  return rowStrings.length - uniqueRows.size;
}

/**
 * Validates column names
 */
function validateColumnNames(columnNames: string[]): { errors: string[], warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for empty column names
  const emptyColumns = columnNames.filter(name => !name || name.trim() === '');
  if (emptyColumns.length > 0) {
    errors.push(`Found ${emptyColumns.length} empty column name(s)`);
  }
  
  // Check for duplicate column names
  const uniqueNames = new Set(columnNames);
  if (uniqueNames.size !== columnNames.length) {
    warnings.push(`Found duplicate column names`);
  }
  
  // Check for special characters in column names
  columnNames.forEach((name, index) => {
    if (name && /[^a-zA-Z0-9_\s\-]/.test(name)) {
      warnings.push(`Column "${name}" contains special characters`);
    }
  });
  
  return { errors, warnings };
}

/**
 * Main QA analysis function for CSV files
 */
export async function analyzeCsvFile(file: File, modality?: string): Promise<CsvQaReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Read file content
    const content = await file.text();
    
    if (!content || content.trim().length === 0) {
      errors.push('File is empty');
      return createErrorReport(file, errors);
    }
    
    // Detect delimiter
    const delimiter = detectDelimiter(content);
    
    // Parse CSV
    const rows = parseCsvContent(content, delimiter);
    
    if (rows.length === 0) {
      errors.push('No rows found in CSV file');
      return createErrorReport(file, errors);
    }
    
    // Extract header and data rows
    const hasHeader = true; // Assume first row is header
    const columnNames = rows[0];
    const dataRows = rows.slice(1);
    
    // Detect file type based on column headers
    const fileType = detectFileType(columnNames, modality || 'unknown');
    
    // Validate column names
    const columnValidation = validateColumnNames(columnNames);
    errors.push(...columnValidation.errors);
    warnings.push(...columnValidation.warnings);
    
    if (dataRows.length === 0) {
      warnings.push('CSV file contains only header row, no data');
    }
    
    // Calculate missing values
    let totalMissingValues = 0;
    const missingValuesByColumn: Record<string, number> = {};
    
    // Analyze each column
    const columnMetrics: ColumnMetrics[] = [];
    for (let colIndex = 0; colIndex < columnNames.length; colIndex++) {
      const columnValues = dataRows.map(row => row[colIndex] || '');
      const metrics = analyzeColumn(columnValues, columnNames[colIndex], colIndex, dataRows.length);
      
      columnMetrics.push(metrics);
      totalMissingValues += metrics.missingValues;
      missingValuesByColumn[columnNames[colIndex]] = metrics.missingValues;
    }
    
    // Detect duplicate rows
    const duplicateRowsCount = findDuplicateRows(dataRows);
    
    // Calculate summary statistics
    const emptyRows = dataRows.filter(row => 
      row.every(cell => !cell || cell.trim() === '')
    ).length;
    
    const completeRows = dataRows.filter(row => 
      row.every(cell => cell && cell.trim() !== '')
    ).length;
    
    const totalCells = dataRows.reduce((acc, row) => acc + row.join('').length, 0);
    const averageFieldLength = totalCells / (dataRows.length * columnNames.length);
    
    // Additional warnings
    if (duplicateRowsCount > 0) {
      warnings.push(`Found ${duplicateRowsCount} duplicate row(s)`);
    }
    
    if (emptyRows > 0) {
      warnings.push(`Found ${emptyRows} completely empty row(s)`);
    }
    
    const totalCellCount = dataRows.length * columnNames.length;
    const missingValuesPercentage = (totalMissingValues / totalCellCount) * 100;
    
    if (missingValuesPercentage > 20) {
      warnings.push(`High percentage of missing values: ${missingValuesPercentage.toFixed(2)}%`);
    }
    
    // Check for inconsistent row lengths
    const rowLengths = dataRows.map(row => row.length);
    const inconsistentRows = rowLengths.filter(len => len !== columnNames.length);
    if (inconsistentRows.length > 0) {
      errors.push(`Found ${inconsistentRows.length} row(s) with inconsistent column count`);
    }
    
    const report: CsvQaReport = {
      fileName: file.name,
      fileSize: file.size,
      encoding: 'UTF-8', // Browsers read as UTF-8 by default
      fileType, // Detected file type
      
      totalRows: dataRows.length,
      totalColumns: columnNames.length,
      columnNames,
      delimiter,
      hasHeader,
      
      missingValuesCount: totalMissingValues,
      missingValuesByColumn,
      missingValuesPercentage,
      
      duplicateRowsCount,
      duplicateRowsPercentage: (duplicateRowsCount / dataRows.length) * 100,
      
      columnMetrics,
      
      isValid: errors.length === 0,
      errors,
      warnings,
      
      summary: {
        emptyRows,
        completeRows,
        averageFieldLength: Math.round(averageFieldLength * 100) / 100
      },
      
      analyzedAt: new Date().toISOString()
    };
    
    return report;
    
  } catch (error: any) {
    errors.push(`Failed to analyze CSV: ${error.message}`);
    return createErrorReport(file, errors);
  }
}

/**
 * Creates an error report when analysis fails
 */
function createErrorReport(file: File, errors: string[]): CsvQaReport {
  return {
    fileName: file.name,
    fileSize: file.size,
    encoding: 'unknown',
    totalRows: 0,
    totalColumns: 0,
    columnNames: [],
    delimiter: ',',
    hasHeader: false,
    missingValuesCount: 0,
    missingValuesByColumn: {},
    missingValuesPercentage: 0,
    duplicateRowsCount: 0,
    duplicateRowsPercentage: 0,
    columnMetrics: [],
    isValid: false,
    errors,
    warnings: [],
    summary: {
      emptyRows: 0,
      completeRows: 0,
      averageFieldLength: 0
    },
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Formats file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generates a summary text for the QA report
 */
export function generateQaSummary(report: CsvQaReport): string {
  if (!report.isValid) {
    return `QA Failed: ${report.errors.join(', ')}`;
  }
  
  const parts = [
    `${report.totalRows} rows`,
    `${report.totalColumns} columns`,
    `${report.missingValuesPercentage.toFixed(1)}% missing`,
    `${report.duplicateRowsCount} duplicates`
  ];
  
  if (report.warnings.length > 0) {
    parts.push(`${report.warnings.length} warning(s)`);
  }
  
  return parts.join(', ');
}

