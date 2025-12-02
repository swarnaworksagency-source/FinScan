import { supabase } from './supabase';
import { DocumentUpload, ExtractedData, ProcessingStatus, FinancialData } from '@/types';

export async function uploadDocumentToStorage(
  file: File,
  userId: string
): Promise<{ path: string; error: string | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('financial-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { path: '', error: error.message };
    }

    return { path: data.path, error: null };
  } catch (error: any) {
    return { path: '', error: error.message };
  }
}

export async function createDocumentRecord(
  userId: string,
  file: File,
  storagePath: string
): Promise<{ document: DocumentUpload | null; error: string | null }> {
  try {
    const fileType = file.name.split('.').pop()?.toLowerCase() as 'pdf' | 'docx' | 'xlsx';

    const { data, error } = await supabase
      .from('document_uploads')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        storage_path: storagePath,
        status: 'processing'
      })
      .select()
      .single();

    if (error) {
      return { document: null, error: error.message };
    }

    return { document: data as DocumentUpload, error: null };
  } catch (error: any) {
    return { document: null, error: error.message };
  }
}

export async function processDocument(
  documentId: string,
  onProgress?: (status: ProcessingStatus) => void
): Promise<{ data: ExtractedData | null; error: string | null }> {
  try {
    if (onProgress) {
      onProgress({
        stage: 'extracting',
        progress: 30,
        message: 'Extracting text from document...'
      });
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-financial-document`;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        useGoogleOCR: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process document');
    }

    const result = await response.json();

    if (onProgress) {
      onProgress({
        stage: 'parsing',
        progress: 70,
        message: 'Parsing financial data...'
      });
    }

    if (!result.success) {
      throw new Error(result.error || 'Processing failed');
    }

    if (onProgress) {
      onProgress({
        stage: 'completed',
        progress: 100,
        message: 'Document processed successfully!'
      });
    }

    return { data: result.extracted_data, error: null };
  } catch (error: any) {
    if (onProgress) {
      onProgress({
        stage: 'failed',
        progress: 0,
        message: error.message
      });
    }
    return { data: null, error: error.message };
  }
}

export async function getDocumentById(documentId: string): Promise<DocumentUpload | null> {
  try {
    const { data, error } = await supabase
      .from('document_uploads')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }

    return data as DocumentUpload;
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

export async function deleteDocument(documentId: string, storagePath: string): Promise<boolean> {
  try {
    const { error: storageError } = await supabase.storage
      .from('financial-documents')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    const { error: dbError } = await supabase
      .from('document_uploads')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error deleting document record:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
}

export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' | 'none' {
  if (confidence >= 75) return 'high';
  if (confidence >= 50) return 'medium';
  if (confidence > 0) return 'low';
  return 'none';
}

export function getConfidenceColor(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-orange-600';
    case 'none': return 'text-gray-400';
  }
}

export function getConfidenceBadgeVariant(confidence: number): 'default' | 'secondary' | 'destructive' {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case 'high': return 'default';
    case 'medium': return 'secondary';
    default: return 'destructive';
  }
}

export function validateExtractedData(data: Partial<FinancialData>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields: (keyof FinancialData)[] = [
    'companyName',
    'financialYear',
    'sales_current',
    'sales_prior'
  ];

  const allFields: (keyof FinancialData)[] = [
    'companyName',
    'financialYear',
    'sales_current',
    'grossProfit_current',
    'receivables_current',
    'totalAssets_current',
    'currentAssets_current',
    'ppe_current',
    'depreciation_current',
    'sgaExpense_current',
    'operatingIncome_current',
    'operatingCashFlow_current',
    'longTermDebt_current',
    'sales_prior',
    'grossProfit_prior',
    'receivables_prior',
    'totalAssets_prior',
    'currentAssets_prior',
    'ppe_prior',
    'depreciation_prior',
    'sgaExpense_prior',
    'longTermDebt_prior'
  ];

  requiredFields.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });

  allFields.forEach(field => {
    if (!data[field] && field !== 'companyName' && field !== 'financialYear') {
      warnings.push(`${field} is missing - please fill manually`);
    }
  });

  const filledFields = allFields.filter(field => data[field] !== undefined && data[field] !== null && data[field] !== '');
  const completeness = Math.round((filledFields.length / allFields.length) * 100);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completeness
  };
}

export function mergeExtractedData(
  extracted: Partial<FinancialData>,
  manual: Partial<FinancialData>
): FinancialData {
  return {
    companyName: manual.companyName || extracted.companyName || '',
    financialYear: manual.financialYear || extracted.financialYear || new Date().getFullYear(),
    sales_current: manual.sales_current ?? extracted.sales_current ?? 0,
    grossProfit_current: manual.grossProfit_current ?? extracted.grossProfit_current ?? 0,
    receivables_current: manual.receivables_current ?? extracted.receivables_current ?? 0,
    totalAssets_current: manual.totalAssets_current ?? extracted.totalAssets_current ?? 0,
    currentAssets_current: manual.currentAssets_current ?? extracted.currentAssets_current ?? 0,
    ppe_current: manual.ppe_current ?? extracted.ppe_current ?? 0,
    depreciation_current: manual.depreciation_current ?? extracted.depreciation_current ?? 0,
    sgaExpense_current: manual.sgaExpense_current ?? extracted.sgaExpense_current ?? 0,
    operatingIncome_current: manual.operatingIncome_current ?? extracted.operatingIncome_current ?? 0,
    operatingCashFlow_current: manual.operatingCashFlow_current ?? extracted.operatingCashFlow_current ?? 0,
    longTermDebt_current: manual.longTermDebt_current ?? extracted.longTermDebt_current ?? 0,
    sales_prior: manual.sales_prior ?? extracted.sales_prior ?? 0,
    grossProfit_prior: manual.grossProfit_prior ?? extracted.grossProfit_prior ?? 0,
    receivables_prior: manual.receivables_prior ?? extracted.receivables_prior ?? 0,
    totalAssets_prior: manual.totalAssets_prior ?? extracted.totalAssets_prior ?? 0,
    currentAssets_prior: manual.currentAssets_prior ?? extracted.currentAssets_prior ?? 0,
    ppe_prior: manual.ppe_prior ?? extracted.ppe_prior ?? 0,
    depreciation_prior: manual.depreciation_prior ?? extracted.depreciation_prior ?? 0,
    sgaExpense_prior: manual.sgaExpense_prior ?? extracted.sgaExpense_prior ?? 0,
    longTermDebt_prior: manual.longTermDebt_prior ?? extracted.longTermDebt_prior ?? 0,
  };
}
