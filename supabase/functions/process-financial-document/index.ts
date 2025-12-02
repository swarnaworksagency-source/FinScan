import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ProcessRequest {
  documentId: string;
  useGoogleOCR?: boolean;
}

interface ExtractedData {
  financialData: Record<string, any>;
  confidence: Record<string, number>;
  rawText: string;
  missingFields: string[];
  detectedYear?: number;
  detectedCompany?: string;
}

const FINANCIAL_FIELD_PATTERNS = {
  companyName: [
    /(?:company name|perusahaan|nama perusahaan)[:\s]+([^\n]+)/i,
    /^([A-Z][A-Za-z\s&.,]+(?:Tbk|Ltd|Inc|Corp|LLC))/m
  ],
  financialYear: [
    /(?:year|tahun|periode)[:\s]+(\d{4})/i,
    /\b(20\d{2})\b/
  ],
  sales_current: [
    /(?:net sales|total sales|revenue|pendapatan|penjualan)[\s:]+.*?([\d,]+\.?\d*)/i,
    /sales[\s:]+.*?([\d,]+)/i
  ],
  grossProfit_current: [
    /(?:gross profit|laba kotor)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  receivables_current: [
    /(?:accounts receivable|trade receivables|piutang)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  totalAssets_current: [
    /(?:total assets|total aset|jumlah aset)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  currentAssets_current: [
    /(?:current assets|aset lancar)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  ppe_current: [
    /(?:property, plant|ppe|aset tetap|fixed assets)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  depreciation_current: [
    /(?:depreciation|amortization|depresiasi|amortisasi)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  sgaExpense_current: [
    /(?:sg&a|selling general|beban usaha)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  operatingIncome_current: [
    /(?:operating income|laba operasi|ebit)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  operatingCashFlow_current: [
    /(?:operating cash flow|arus kas operasi)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
  longTermDebt_current: [
    /(?:long.?term debt|utang jangka panjang)[\s:]+.*?([\d,]+\.?\d*)/i
  ],
};

function extractFinancialData(text: string): ExtractedData {
  const financialData: Record<string, any> = {};
  const confidence: Record<string, number> = {};
  const missingFields: string[] = [];
  
  let detectedYear: number | undefined;
  let detectedCompany: string | undefined;

  for (const [field, patterns] of Object.entries(FINANCIAL_FIELD_PATTERNS)) {
    let found = false;
    let maxConfidence = 0;
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = match[1].replace(/,/g, '');
        
        if (field === 'companyName') {
          financialData[field] = match[1].trim();
          detectedCompany = match[1].trim();
          confidence[field] = 70;
          found = true;
          break;
        } else if (field === 'financialYear') {
          const year = parseInt(value);
          if (year >= 2000 && year <= 2100) {
            financialData[field] = year;
            detectedYear = year;
            confidence[field] = 80;
            found = true;
            break;
          }
        } else {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue > 0) {
            financialData[field] = numValue;
            const fieldConfidence = 60 + (patterns.indexOf(pattern) === 0 ? 20 : 10);
            maxConfidence = Math.max(maxConfidence, fieldConfidence);
            confidence[field] = maxConfidence;
            found = true;
            break;
          }
        }
      }
    }
    
    if (!found) {
      missingFields.push(field);
      confidence[field] = 0;
    }
  }

  return {
    financialData,
    confidence,
    rawText: text.substring(0, 5000),
    missingFields,
    detectedYear,
    detectedCompany
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { documentId, useGoogleOCR = false }: ProcessRequest = await req.json();

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    const { data: document, error: fetchError } = await supabase
      .from('document_uploads')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      throw new Error('Document not found');
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('financial-documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file from storage');
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let extractedText = '';

    if (document.file_type === 'pdf') {
      extractedText = new TextDecoder().decode(uint8Array);
      
      if (extractedText.length < 100) {
        extractedText = 'PDF parsing requires advanced OCR. Please use Google Cloud Vision API.';
      }
    } else if (document.file_type === 'xlsx') {
      extractedText = 'Excel file detected. Extracting data from spreadsheet...';
    } else if (document.file_type === 'docx') {
      extractedText = 'Word document detected. Extracting text...';
    }

    const extracted = extractFinancialData(extractedText);
    
    const overallConfidence = Object.values(extracted.confidence).reduce((a, b) => a + b, 0) / 
                              Object.keys(extracted.confidence).length;

    const { error: updateError } = await supabase
      .from('document_uploads')
      .update({
        status: 'completed',
        ocr_text: extracted.rawText,
        extracted_data: extracted,
        confidence_score: Math.round(overallConfidence),
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_id: documentId,
        extracted_data: extracted,
        confidence_score: Math.round(overallConfidence)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process document'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});