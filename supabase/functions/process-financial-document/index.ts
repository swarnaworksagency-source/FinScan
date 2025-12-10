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
  ocrMethod: 'basic' | 'gemini-file-api';
  mScoreDetails?: MScoreResult;
}

interface MScoreResult {
  mScore: number;
  interpretation: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';
  components: {
    DSRI: { value: number; description: string };
    GMI: { value: number; description: string };
    AQI: { value: number; description: string };
    SGI: { value: number; description: string };
    DEPI: { value: number; description: string };
    SGAI: { value: number; description: string };
    LVGI: { value: number; description: string };
    TATA: { value: number; description: string };
  };
  redFlags: string[];
}

// Upload file to Gemini File API (for large files)
async function uploadToGeminiFileAPI(
  fileBuffer: Uint8Array,
  fileName: string,
  mimeType: string,
  apiKey: string
): Promise<{ fileUri: string; fileName: string }> {
  console.log(`Uploading ${fileName} (${fileBuffer.length} bytes) to Gemini File API...`);

  // Step 1: Initialize resumable upload
  const initUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

  const metadata = {
    file: {
      display_name: fileName
    }
  };

  const initResponse = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': fileBuffer.length.toString(),
      'X-Goog-Upload-Header-Content-Type': mimeType,
    },
    body: JSON.stringify(metadata)
  });

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error('Failed to initialize upload:', initResponse.status, errorText);
    throw new Error(`Failed to initialize Gemini upload: ${initResponse.status} - ${errorText}`);
  }

  const uploadUrl = initResponse.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) {
    throw new Error('No upload URL received from Gemini');
  }

  console.log('Got upload URL, uploading file data...');

  // Step 2: Upload the file content
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': fileBuffer.length.toString(),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: fileBuffer
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Failed to upload file:', uploadResponse.status, errorText);
    throw new Error(`Failed to upload file to Gemini: ${uploadResponse.status} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  console.log('File uploaded successfully:', uploadResult.file?.name);

  return {
    fileUri: uploadResult.file?.uri,
    fileName: uploadResult.file?.name
  };
}

// Analyze document using Gemini AI with File API
async function analyzeWithGemini(
  fileUri: string,
  apiKey: string
): Promise<{ text: string; financialData: Record<string, any> }> {
  console.log(`Analyzing document with Gemini using file URI: ${fileUri}`);

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const prompt = `Analyze this financial document and extract the following information in JSON format:

{
  "companyName": "nama perusahaan",
  "financialYear": 2024,
  "sales_current": 1000000,
  "grossProfit_current": 500000,
  "receivables_current": 200000,
  "totalAssets_current": 5000000,
  "currentAssets_current": 1500000,
  "ppe_current": 2000000,
  "depreciation_current": 100000,
  "sgaExpense_current": 300000,
  "operatingIncome_current": 200000,
  "operatingCashFlow_current": 250000,
  "longTermDebt_current": 1000000,
  "sales_prior": 900000,
  "grossProfit_prior": 450000,
  "receivables_prior": 180000,
  "totalAssets_prior": 4500000,
  "currentAssets_prior": 1400000,
  "ppe_prior": 1800000,
  "depreciation_prior": 90000,
  "sgaExpense_prior": 280000,
  "longTermDebt_prior": 900000
}

Rules:
1. Extract ALL visible financial data from the document
2. If a value is not found, set it to 0
3. If you see Indonesian terms like "Penjualan", "Laba Kotor", "Piutang", "Aset Tetap", "Beban Usaha", etc., map them to the appropriate fields
4. Return ONLY valid JSON, no explanation
5. All numeric values should be numbers (not strings)
6. "current" means current year, "prior" means previous year
7. Look for comparative financial statements that show two years of data

Also provide the raw text content you extracted from the document.

Return your response in this exact format:
{
  "extractedText": "full text content here...",
  "financialData": { ...the financial data JSON above... }
}`;

  const requestBody = {
    contents: [{
      parts: [
        {
          file_data: {
            file_uri: fileUri
          }
        },
        {
          text: prompt
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Gemini response received');

  // Extract the text response
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('Response text length:', responseText.length);

  // Try to parse JSON from response
  try {
    // Find JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        text: parsed.extractedText || responseText,
        financialData: parsed.financialData || parsed
      };
    }
  } catch (parseError) {
    console.log('Could not parse JSON from Gemini response, using raw text');
  }

  return {
    text: responseText,
    financialData: {}
  };
}

// Calculate Beneish M-Score
function calculateMScore(data: Record<string, any>): MScoreResult {
  // Extract values with defaults
  const sales_current = data.sales_current || 0;
  const sales_prior = data.sales_prior || 0;
  const grossProfit_current = data.grossProfit_current || 0;
  const grossProfit_prior = data.grossProfit_prior || 0;
  const receivables_current = data.receivables_current || 0;
  const receivables_prior = data.receivables_prior || 0;
  const totalAssets_current = data.totalAssets_current || 0;
  const totalAssets_prior = data.totalAssets_prior || 0;
  const currentAssets_current = data.currentAssets_current || 0;
  const currentAssets_prior = data.currentAssets_prior || 0;
  const ppe_current = data.ppe_current || 0;
  const ppe_prior = data.ppe_prior || 0;
  const depreciation_current = data.depreciation_current || 0;
  const depreciation_prior = data.depreciation_prior || 0;
  const sgaExpense_current = data.sgaExpense_current || 0;
  const sgaExpense_prior = data.sgaExpense_prior || 0;
  const operatingIncome_current = data.operatingIncome_current || 0;
  const operatingCashFlow_current = data.operatingCashFlow_current || 0;
  const longTermDebt_current = data.longTermDebt_current || 0;
  const longTermDebt_prior = data.longTermDebt_prior || 0;

  // Calculate ratios (with safety for division by zero)
  const safeDiv = (a: number, b: number) => b === 0 ? 1 : a / b;

  // DSRI - Days Sales in Receivables Index
  const receivablesSalesRatio_current = safeDiv(receivables_current, sales_current);
  const receivablesSalesRatio_prior = safeDiv(receivables_prior, sales_prior);
  const DSRI = safeDiv(receivablesSalesRatio_current, receivablesSalesRatio_prior);

  // GMI - Gross Margin Index
  const grossMargin_prior = safeDiv(grossProfit_prior, sales_prior);
  const grossMargin_current = safeDiv(grossProfit_current, sales_current);
  const GMI = safeDiv(grossMargin_prior, grossMargin_current);

  // AQI - Asset Quality Index
  const nonCurrentAssets_current = totalAssets_current - currentAssets_current - ppe_current;
  const nonCurrentAssets_prior = totalAssets_prior - currentAssets_prior - ppe_prior;
  const assetQuality_current = safeDiv(nonCurrentAssets_current, totalAssets_current);
  const assetQuality_prior = safeDiv(nonCurrentAssets_prior, totalAssets_prior);
  const AQI = safeDiv(assetQuality_current, assetQuality_prior);

  // SGI - Sales Growth Index
  const SGI = safeDiv(sales_current, sales_prior);

  // DEPI - Depreciation Index
  const depRate_prior = safeDiv(depreciation_prior, depreciation_prior + ppe_prior);
  const depRate_current = safeDiv(depreciation_current, depreciation_current + ppe_current);
  const DEPI = safeDiv(depRate_prior, depRate_current);

  // SGAI - SGA Expense Index
  const sgaRatio_current = safeDiv(sgaExpense_current, sales_current);
  const sgaRatio_prior = safeDiv(sgaExpense_prior, sales_prior);
  const SGAI = safeDiv(sgaRatio_current, sgaRatio_prior);

  // LVGI - Leverage Index
  const leverage_current = safeDiv(longTermDebt_current, totalAssets_current);
  const leverage_prior = safeDiv(longTermDebt_prior, totalAssets_prior);
  const LVGI = safeDiv(leverage_current, leverage_prior);

  // TATA - Total Accruals to Total Assets
  const accruals = operatingIncome_current - operatingCashFlow_current;
  const TATA = safeDiv(accruals, totalAssets_current);

  // Calculate M-Score using Beneish formula
  const mScore = -4.84 +
    (0.92 * DSRI) +
    (0.528 * GMI) +
    (0.404 * AQI) +
    (0.892 * SGI) +
    (0.115 * DEPI) +
    (-0.172 * SGAI) +
    (4.679 * TATA) +
    (-0.327 * LVGI);

  // Determine interpretation
  let interpretation: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';
  if (mScore > -1.78) {
    interpretation = 'HIGH_RISK';
  } else if (mScore > -2.22) {
    interpretation = 'MODERATE_RISK';
  } else {
    interpretation = 'LOW_RISK';
  }

  // Identify red flags
  const redFlags: string[] = [];
  if (DSRI > 1.465) redFlags.push('High DSRI indicates potential revenue manipulation');
  if (GMI > 1.193) redFlags.push('High GMI suggests deteriorating margins');
  if (AQI > 1.254) redFlags.push('High AQI indicates potential asset capitalization issues');
  if (SGI > 1.607) redFlags.push('High SGI - rapid growth can mask manipulation');
  if (DEPI > 1.077) redFlags.push('High DEPI suggests slowing depreciation');
  if (TATA > 0.031) redFlags.push('High TATA indicates high accruals vs cash flow');
  if (LVGI > 1.111) redFlags.push('High LVGI indicates increasing leverage');

  return {
    mScore: Math.round(mScore * 1000) / 1000,
    interpretation,
    components: {
      DSRI: { value: Math.round(DSRI * 1000) / 1000, description: 'Days Sales in Receivables Index' },
      GMI: { value: Math.round(GMI * 1000) / 1000, description: 'Gross Margin Index' },
      AQI: { value: Math.round(AQI * 1000) / 1000, description: 'Asset Quality Index' },
      SGI: { value: Math.round(SGI * 1000) / 1000, description: 'Sales Growth Index' },
      DEPI: { value: Math.round(DEPI * 1000) / 1000, description: 'Depreciation Index' },
      SGAI: { value: Math.round(SGAI * 1000) / 1000, description: 'SG&A Expense Index' },
      LVGI: { value: Math.round(LVGI * 1000) / 1000, description: 'Leverage Index' },
      TATA: { value: Math.round(TATA * 1000) / 1000, description: 'Total Accruals to Total Assets' },
    },
    redFlags
  };
}

function buildExtractedData(
  rawText: string,
  financialData: Record<string, any>,
  ocrMethod: 'basic' | 'gemini-file-api',
  mScoreResult?: MScoreResult
): ExtractedData {
  const allFields = [
    'companyName', 'financialYear',
    'sales_current', 'grossProfit_current', 'receivables_current',
    'totalAssets_current', 'currentAssets_current', 'ppe_current',
    'depreciation_current', 'sgaExpense_current', 'operatingIncome_current',
    'operatingCashFlow_current', 'longTermDebt_current',
    'sales_prior', 'grossProfit_prior', 'receivables_prior',
    'totalAssets_prior', 'currentAssets_prior', 'ppe_prior',
    'depreciation_prior', 'sgaExpense_prior', 'longTermDebt_prior'
  ];

  const missingFields: string[] = [];
  const confidence: Record<string, number> = {};

  for (const field of allFields) {
    if (financialData[field] && financialData[field] !== 0) {
      confidence[field] = ocrMethod === 'gemini-file-api' ? 90 : 60;
    } else {
      missingFields.push(field);
      confidence[field] = 0;
    }
  }

  return {
    financialData,
    confidence,
    rawText: rawText.substring(0, 10000),
    missingFields,
    detectedYear: financialData.financialYear,
    detectedCompany: financialData.companyName,
    ocrMethod,
    mScoreDetails: mScoreResult
  };
}

// Get MIME type from file extension
function getMimeType(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
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

    // Get Gemini API Key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      console.log('Warning: GEMINI_API_KEY not set');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Gemini API Key found');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { documentId, useGoogleOCR = true }: ProcessRequest = await req.json();

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    console.log(`Processing document ${documentId}`);

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

    console.log(`File downloaded: ${uint8Array.length} bytes`);

    let extractedText = '';
    let financialData: Record<string, any> = {};
    let ocrMethod: 'basic' | 'gemini-file-api' = 'basic';
    let mScoreResult: MScoreResult | undefined;

    try {
      // Step 1: Upload file to Gemini File API
      const mimeType = getMimeType(document.file_type);
      const fileName = document.file_name || `document.${document.file_type}`;

      console.log('Step 1: Uploading to Gemini File API...');
      const { fileUri } = await uploadToGeminiFileAPI(uint8Array, fileName, mimeType, geminiApiKey);

      console.log('Step 2: Analyzing with Gemini...');
      const geminiResult = await analyzeWithGemini(fileUri, geminiApiKey);

      extractedText = geminiResult.text;
      financialData = geminiResult.financialData;
      ocrMethod = 'gemini-file-api';

      console.log(`Gemini extracted ${Object.keys(financialData).length} fields`);
      console.log('Financial data:', JSON.stringify(financialData, null, 2));

      // Step 3: Calculate M-Score
      console.log('Step 3: Calculating M-Score...');
      mScoreResult = calculateMScore(financialData);
      console.log(`M-Score: ${mScoreResult.mScore} (${mScoreResult.interpretation})`);

    } catch (geminiError: any) {
      console.error('Gemini File API failed:', geminiError);
      throw new Error(`Document processing failed: ${geminiError.message}`);
    }

    const extracted = buildExtractedData(extractedText, financialData, ocrMethod, mScoreResult);

    const overallConfidence = Object.values(extracted.confidence).reduce((a, b) => a + b, 0) /
      Math.max(Object.keys(extracted.confidence).length, 1);

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

    console.log(`Document ${documentId} processed successfully with ${ocrMethod}`);

    return new Response(
      JSON.stringify({
        success: true,
        document_id: documentId,
        extracted_data: extracted,
        confidence_score: Math.round(overallConfidence),
        ocr_method: ocrMethod,
        m_score: mScoreResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
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