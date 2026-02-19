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
  ocrMethod: 'basic' | 'deepseek';
  mScoreDetails?: MScoreResult;
  calculationSteps?: CalculationSteps;
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

interface CalculationSteps {
  formula: string;
  dataTable: {
    field: string;
    currentYear: number;
    priorYear: number;
  }[];
  ratioCalculations: {
    name: string;
    formula: string;
    calculation: string;
    result: number;
    interpretation: string;
  }[];
  finalCalculation: {
    component: string;
    coefficient: number;
    value: number;
    contribution: number;
  }[];
  conclusion: string;
  warnings: string[];
}

// Extract text from various file formats
// Analyze document using Gemini 2.5 Flash
async function analyzeWithGemini(
  fileBase64: string,
  fileName: string,
  mimeType: string,
  apiKey: string
): Promise<{ financialData: Record<string, any>; calculationSteps: CalculationSteps | null }> {
  console.log(`Analyzing document with Gemini: ${fileName}, MIME: ${mimeType}`);

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Simplified prompt focused ONLY on data extraction
  const EXTRACTION_PROMPT = `Anda adalah AI ekstraksi data keuangan. Tugas Anda adalah mengekstrak angka-angka dari laporan keuangan ini.

INSTRUKSI:
1. Baca SELURUH dokumen dengan teliti
2. Identifikasi TAHUN terbaru dan tahun sebelumnya
3. Ekstrak nilai numerik untuk setiap kategori
4. Jika kolom memiliki 2 tahun, kolom KIRI biasanya tahun terbaru (current), KANAN tahun lalu (prior)

KATEGORI YANG HARUS DIEKSTRAK (cari variasi nama berikut):

PENJUALAN: "Penjualan", "Pendapatan", "Sales", "Revenue", "Net Sales", "Penjualan Neto"
LABA BRUTO: "Laba Bruto", "Gross Profit", "Laba Kotor"
PIUTANG: "Piutang Usaha", "Piutang Dagang", "Accounts Receivable", "Trade Receivables"
PIUTANG BERELASI: "Piutang Pihak Berelasi", "Piutang usaha - Pihak berelasi", "Due from related parties", "Receivables from related parties"
TOTAL ASET: "Total Aset", "Total Assets", "Jumlah Aset", "Total Aktiva"
ASET LANCAR: "Aset Lancar", "Current Assets", "Aktiva Lancar"
KAS: "Kas dan Setara Kas", "Cash and Cash Equivalents", "Kas", "Bank"
ASET TETAP: "Aset Tetap", "Property Plant Equipment", "PPE", "Fixed Assets", "Aktiva Tetap"
ASET MIGAS: "Aset Minyak dan Gas", "Oil and Gas Properties", "Aset minyak dan gas serta panas bumi", "Aset Migas"
PENYUSUTAN: "Penyusutan", "Depreciation", "Beban Penyusutan", "Depresiasi", "Penyusutan, deplesi dan amortisasi", "Amortisasi"
*PENTING: Cari nilai penyusutan untuk KEDUA tahun. Biasanya ada di Laporan Arus Kas (bagian Operasi) atau Catatan Kaki Aset Tetap.*

BEBAN PENJUALAN: "Beban Penjualan", "Selling Expenses", "Beban penjualan dan pemasaran", "Beban Pemasaran"
BEBAN UMUM: "Beban Umum dan Administrasi", "General and Administrative Expenses", "Beban Administrasi"
BEBAN SGA TOTAL: "Total Beban Usaha", "Total Operating Expenses", "Beban Usaha"
LABA USAHA: "Laba Usaha", "Operating Income", "EBIT", "Laba Operasional"
ARUS KAS OPERASI: "Arus Kas Operasi", "Cash From Operations", "OCF", "Kas dari Aktivitas Operasi"
HUTANG PAJAK: "Hutang Pajak", "Utang Pajak", "Taxes Payable", "Utang Pajak Penghasilan"
LIABILITAS JP: "Liabilitas Jangka Panjang", "Long-term Liabilities", "Utang Jangka Panjang"
LIABILITAS LANCAR: "Liabilitas Jangka Pendek", "Current Liabilities", "Utang Jangka Pendek", "Liabilitas Lancar"

RETURN JSON DENGAN FORMAT INI SAJA (tanpa teks lain):
{
  "companyName": "nama perusahaan",
  "financialYear": 2024,
  "sales_current": 0,
  "sales_prior": 0,
  "grossProfit_current": 0,
  "grossProfit_prior": 0,
  "receivables_current": 0,
  "receivables_prior": 0,
  "receivables_related_current": 0,
  "receivables_related_prior": 0,
  "totalAssets_current": 0,
  "totalAssets_prior": 0,
  "currentAssets_current": 0,
  "currentAssets_prior": 0,
  "cash_current": 0,
  "cash_prior": 0,
  "ppe_current": 0,
  "ppe_prior": 0,
  "oilAndGas_current": 0,
  "oilAndGas_prior": 0,
  "depreciation_current": 0,
  "depreciation_prior": 0,
  "sellingExpense_current": 0,
  "sellingExpense_prior": 0,
  "generalExpense_current": 0,
  "generalExpense_prior": 0,
  "sgaExpense_current": 0,
  "sgaExpense_prior": 0,
  "operatingIncome_current": 0,
  "operatingCashFlow_current": 0,
  "taxPayable_current": 0,
  "taxPayable_prior": 0,
  "longTermDebt_current": 0,
  "longTermDebt_prior": 0,
  "currentLiabilities_current": 0,
  "currentLiabilities_prior": 0
}

PENTING:
- ISI ANGKA yang ditemukan di dokumen (tanpa titik ribuan, tanpa koma desimal)
- Angka dalam jutaan? Tulis langsung nilainya (misal: 115786525 bukan 115.786.525)
- Jika tidak ditemukan, isi 0
- HANYA return JSON, tanpa penjelasan`;

  const requestBody = {
    contents: [{
      parts: [
        { text: EXTRACTION_PROMPT },
        {
          inline_data: {
            mime_type: mimeType,
            data: fileBase64
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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

  // Extract the response content
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('Response text length:', responseText.length);
  console.log('Raw response preview:', responseText.substring(0, 1000));

  // Parse JSON from response
  try {
    const parsed = JSON.parse(responseText);

    // Debug logging
    console.log('Parsed response keys:', Object.keys(parsed));
    console.log('Parsed companyName:', parsed.companyName);
    console.log('Parsed financialYear:', parsed.financialYear);

    // Helper function to get numeric value - handles various formats
    const getNum = (val: any): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      // Remove thousand separators and parse
      const cleaned = String(val).replace(/[^\d.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    // New format: data is at root level
    const financialData = {
      companyName: parsed.companyName || parsed.company_name || '',
      financialYear: parsed.financialYear || parsed.financial_year || new Date().getFullYear(),
      sales_current: getNum(parsed.sales_current),
      sales_prior: getNum(parsed.sales_prior),
      grossProfit_current: getNum(parsed.grossProfit_current),
      grossProfit_prior: getNum(parsed.grossProfit_prior),
      receivables_current: getNum(parsed.receivables_current),
      receivables_prior: getNum(parsed.receivables_prior),
      receivables_related_current: getNum(parsed.receivables_related_current),
      receivables_related_prior: getNum(parsed.receivables_related_prior),
      totalAssets_current: getNum(parsed.totalAssets_current),
      totalAssets_prior: getNum(parsed.totalAssets_prior),
      currentAssets_current: getNum(parsed.currentAssets_current),
      currentAssets_prior: getNum(parsed.currentAssets_prior),
      cash_current: getNum(parsed.cash_current),
      cash_prior: getNum(parsed.cash_prior),
      ppe_current: getNum(parsed.ppe_current),
      ppe_prior: getNum(parsed.ppe_prior),
      oilAndGas_current: getNum(parsed.oilAndGas_current),
      oilAndGas_prior: getNum(parsed.oilAndGas_prior),
      depreciation_current: getNum(parsed.depreciation_current),
      depreciation_prior: getNum(parsed.depreciation_prior),
      sellingExpense_current: getNum(parsed.sellingExpense_current),
      sellingExpense_prior: getNum(parsed.sellingExpense_prior),
      generalExpense_current: getNum(parsed.generalExpense_current),
      generalExpense_prior: getNum(parsed.generalExpense_prior),
      sgaExpense_current: getNum(parsed.sgaExpense_current),
      sgaExpense_prior: getNum(parsed.sgaExpense_prior),
      operatingIncome_current: getNum(parsed.operatingIncome_current),
      operatingCashFlow_current: getNum(parsed.operatingCashFlow_current),
      taxPayable_current: getNum(parsed.taxPayable_current),
      taxPayable_prior: getNum(parsed.taxPayable_prior),
      longTermDebt_current: getNum(parsed.longTermDebt_current),
      longTermDebt_prior: getNum(parsed.longTermDebt_prior),
      currentLiabilities_current: getNum(parsed.currentLiabilities_current),
      currentLiabilities_prior: getNum(parsed.currentLiabilities_prior),
    };

    // Debug: Log converted financial data
    console.log('=== EXTRACTED FINANCIAL DATA ===');
    console.log(JSON.stringify(financialData, null, 2));

    // Count how many fields have non-zero values
    const nonZeroFields = Object.entries(financialData)
      .filter(([key, val]) => typeof val === 'number' && val > 0);
    console.log(`Found ${nonZeroFields.length} non-zero numeric fields`);

    // Check for any 0 values and log them
    const zeroFields = Object.entries(financialData)
      .filter(([key, val]) => val === 0 && key !== 'companyName' && key !== 'financialYear');
    if (zeroFields.length > 0) {
      console.log('Fields with 0 values:', zeroFields.map(([k]) => k).join(', '));
    }

    return {
      financialData,
      calculationSteps: null // We calculate M-Score on client side now
    };
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', parseError);
    console.error('Response was:', responseText.substring(0, 2000));
    return {
      financialData: {},
      calculationSteps: null
    };
  }
}

// Calculate Beneish M-Score (fallback if AI doesn't calculate)
function calculateMScore(data: Record<string, any>): MScoreResult {
  // Extract values with defaults
  // Extract values with defaults
  const sales_current = data.sales_current || 0;
  const sales_prior = data.sales_prior || 0;
  const grossProfit_current = data.grossProfit_current || 0;
  const grossProfit_prior = data.grossProfit_prior || 0;
  const receivables_current = data.receivables_current || 0;
  const receivables_prior = data.receivables_prior || 0;
  const receivables_related_current = data.receivables_related_current || 0;
  const receivables_related_prior = data.receivables_related_prior || 0;
  const totalAssets_current = data.totalAssets_current || 0;
  const totalAssets_prior = data.totalAssets_prior || 0;
  const currentAssets_current = data.currentAssets_current || 0;
  const currentAssets_prior = data.currentAssets_prior || 0;
  const cash_current = data.cash_current || 0;
  const cash_prior = data.cash_prior || 0;
  const ppe_current = data.ppe_current || 0;
  const ppe_prior = data.ppe_prior || 0;
  const oilAndGas_current = data.oilAndGas_current || 0;
  const oilAndGas_prior = data.oilAndGas_prior || 0;
  const depreciation_current = data.depreciation_current || 0;
  const depreciation_prior = data.depreciation_prior || 0;
  const sgaExpense_current = Math.max(
    (data.sellingExpense_current || 0) + (data.generalExpense_current || 0),
    data.sgaExpense_current || 0
  );
  const sgaExpense_prior = Math.max(
    (data.sellingExpense_prior || 0) + (data.generalExpense_prior || 0),
    data.sgaExpense_prior || 0
  );
  const operatingIncome_current = data.operatingIncome_current || 0;
  const operatingCashFlow_current = data.operatingCashFlow_current || 0;
  const taxPayable_current = data.taxPayable_current || 0;
  const taxPayable_prior = data.taxPayable_prior || 0;
  const longTermDebt_current = data.longTermDebt_current || 0;
  const longTermDebt_prior = data.longTermDebt_prior || 0;
  const currentLiabilities_current = data.currentLiabilities_current || 0;
  const currentLiabilities_prior = data.currentLiabilities_prior || 0;

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
  ocrMethod: 'basic' | 'deepseek',
  mScoreResult?: MScoreResult,
  calculationSteps?: CalculationSteps
): ExtractedData {
  const allFields = [
    'companyName', 'financialYear',
    'sales_current', 'grossProfit_current', 'receivables_current', 'receivables_related_current',
    'totalAssets_current', 'currentAssets_current', 'cash_current', 'ppe_current', 'oilAndGas_current',
    'depreciation_current', 'sgaExpense_current', 'operatingIncome_current',
    'operatingCashFlow_current', 'longTermDebt_current', 'currentLiabilities_current', 'taxPayable_current',
    'sales_prior', 'grossProfit_prior', 'receivables_prior', 'receivables_related_prior',
    'totalAssets_prior', 'currentAssets_prior', 'cash_prior', 'ppe_prior', 'oilAndGas_prior',
    'depreciation_prior', 'sgaExpense_prior', 'longTermDebt_prior', 'currentLiabilities_prior', 'taxPayable_prior'
  ];

  const missingFields: string[] = [];
  const confidence: Record<string, number> = {};

  for (const field of allFields) {
    if (financialData[field] && financialData[field] !== 0) {
      confidence[field] = ocrMethod === 'deepseek' ? 95 : 60;
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
    mScoreDetails: mScoreResult,
    calculationSteps
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
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured in environment');
    }

    console.log('Gemini API Key configured');

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
    const fileBase64 = arrayBufferToBase64(arrayBuffer);

    console.log(`File downloaded and converted to base64: ${fileBase64.length} chars`);

    let financialData: Record<string, any> = {};
    let ocrMethod: 'basic' | 'deepseek' = 'basic';
    let mScoreResult: MScoreResult | undefined;
    let calculationSteps: CalculationSteps | undefined;

    try {
      const fileName = document.file_name || `document.${document.file_type}`;
      const mimeType = getMimeType(document.file_type);

      console.log(`Analyzing with Gemini 1.5 Pro (File: ${fileName}, Type: ${mimeType})...`);
      const geminiResult = await analyzeWithGemini(fileBase64, fileName, mimeType, geminiApiKey);

      financialData = geminiResult.financialData;
      calculationSteps = geminiResult.calculationSteps || undefined;
      ocrMethod = 'deepseek'; // Using Gemini 1.5 Pro

      console.log(`Gemini 1.5 Pro extracted ${Object.keys(financialData).length} fields`);

      // Calculate M-Score (use our calculation as fallback/verification)
      console.log('Calculating M-Score...');
      mScoreResult = calculateMScore(financialData);
      console.log(`M-Score: ${mScoreResult.mScore} (${mScoreResult.interpretation})`);

    } catch (geminiError: any) {
      console.error('Gemini 1.5 Pro API failed:', geminiError);
      throw new Error(`Document processing failed: ${geminiError.message}`);
    }

    const extracted = buildExtractedData('Processed by DeepSeek AI', financialData, ocrMethod, mScoreResult, calculationSteps);

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
        m_score: mScoreResult,
        calculation_steps: calculationSteps
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