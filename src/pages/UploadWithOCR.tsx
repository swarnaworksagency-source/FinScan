import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertCircle, ArrowLeft, CheckCircle2, FileText, Sparkles,
  Upload, Brain, Calculator, TrendingUp, XCircle,
  Download, AlertTriangle, Info, RefreshCw, Edit3, ArrowRight
} from 'lucide-react';
import { ProcessingStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FileUploader } from '@/components/FileUploader';
import {
  uploadDocumentToStorage,
  createDocumentRecord,
  processDocument,
} from '@/lib/documentProcessor';
import { checkUploadEligibility, incrementUploadCount } from '@/lib/subscription';
import { calculateBeneishMScore } from '@/lib/beneish';
import jsPDF from 'jspdf';

interface FinancialDataInput {
  companyName: string;
  financialYear: number;
  sales_current: number;
  sales_prior: number;
  cogs_current: number;
  cogs_prior: number;
  grossProfit_current: number;
  grossProfit_prior: number;
  receivables_current: number;
  receivables_prior: number;
  receivables_related_current: number;
  receivables_related_prior: number;
  totalAssets_current: number;
  totalAssets_prior: number;
  currentAssets_current: number;
  currentAssets_prior: number;
  cash_current: number;
  cash_prior: number;
  ppe_current: number;
  ppe_prior: number;
  depreciation_current: number;
  depreciation_prior: number;
  sgaExpense_current: number;
  sgaExpense_prior: number;
  sellingExpense_current: number;
  sellingExpense_prior: number;
  generalExpense_current: number;
  generalExpense_prior: number;
  adminExpense_current: number;
  adminExpense_prior: number;
  operatingIncome_current: number;
  operatingCashFlow_current: number;
  taxPayable_current: number;
  taxPayable_prior: number;
  longTermDebt_current: number;
  longTermDebt_prior: number;
  currentLiabilities_current: number;
  currentLiabilities_prior: number;
  oilAndGas_current: number;
  oilAndGas_prior: number;
}

interface AnalysisResult {
  companyName: string;
  financialYear: number;
  mScore: number;
  riskLevel: 'high' | 'moderate' | 'low';
  financialData: FinancialDataInput;
  components: {
    dsri: number;
    gmi: number;
    aqi: number;
    sgi: number;
    depi: number;
    sgai: number;
    tata: number;
    lvgi: number;
  };
  redFlags: string[];
}

const INITIAL_FINANCIAL_DATA: FinancialDataInput = {
  companyName: '',
  financialYear: new Date().getFullYear(),
  sales_current: 0,
  sales_prior: 0,
  cogs_current: 0,
  cogs_prior: 0,
  grossProfit_current: 0,
  grossProfit_prior: 0,
  receivables_current: 0,
  receivables_prior: 0,
  receivables_related_current: 0,
  receivables_related_prior: 0,
  totalAssets_current: 0,
  totalAssets_prior: 0,
  currentAssets_current: 0,
  currentAssets_prior: 0,
  cash_current: 0,
  cash_prior: 0,
  ppe_current: 0,
  ppe_prior: 0,
  depreciation_current: 0,
  depreciation_prior: 0,
  sgaExpense_current: 0,
  sgaExpense_prior: 0,
  sellingExpense_current: 0,
  sellingExpense_prior: 0,
  generalExpense_current: 0,
  generalExpense_prior: 0,
  adminExpense_current: 0,
  adminExpense_prior: 0,
  operatingIncome_current: 0,
  operatingCashFlow_current: 0,
  taxPayable_current: 0,
  taxPayable_prior: 0,
  longTermDebt_current: 0,
  longTermDebt_prior: 0,
  currentLiabilities_current: 0,
  currentLiabilities_prior: 0,
  oilAndGas_current: 0,
  oilAndGas_prior: 0,
};

export default function UploadWithOCR() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'upload' | 'manual' | 'edit'>('upload');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | undefined>();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<FinancialDataInput>(INITIAL_FINANCIAL_DATA);
  const [isEditing, setIsEditing] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError('');
    setAnalysisResult(null);
    setSavedAnalysisId(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setProcessingStatus(undefined);
    setSavedAnalysisId(null);
    setIsEditing(false);
  };

  const updateField = (field: keyof FinancialDataInput, value: string | number) => {
    setFinancialData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'companyName'
        ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0
        : value
    }));
  };

  // Calculate M-Score from financial data
  const calculateFromData = (data: FinancialDataInput) => {
    const result = calculateBeneishMScore(data);

    return {
      companyName: data.companyName || 'Perusahaan',
      financialYear: data.financialYear,
      mScore: result.mScore,
      riskLevel: result.interpretation === 'HIGH_RISK' ? 'high' as const :
        result.interpretation === 'MODERATE_RISK' ? 'moderate' as const : 'low' as const,
      financialData: data,
      components: result.components,
      redFlags: result.redFlags.map(rf => rf.message),
    };
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || !user) return;

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      // Step 1: Check subscription
      setProcessingStatus({
        stage: 'uploading',
        progress: 5,
        message: 'Memeriksa status langganan...'
      });

      const eligibility = await checkUploadEligibility(user.id);
      if (!eligibility.allowed) {
        setError(eligibility.message || 'Batas upload tercapai');
        setProcessingStatus({
          stage: 'failed',
          progress: 0,
          message: eligibility.message || 'Batas upload tercapai'
        });
        setTimeout(() => navigate('/pricing'), 2000);
        return;
      }

      // Step 2: Upload file
      setProcessingStatus({
        stage: 'uploading',
        progress: 10,
        message: 'Mengupload dokumen...'
      });

      const { path, error: uploadError } = await uploadDocumentToStorage(selectedFile, user.id);
      if (uploadError) throw new Error(uploadError);

      // Step 3: Create document record
      setProcessingStatus({
        stage: 'uploading',
        progress: 20,
        message: 'Menyimpan dokumen...'
      });

      const { document, error: createError } = await createDocumentRecord(user.id, selectedFile, path);
      if (createError || !document) throw new Error(createError || 'Gagal membuat record dokumen');

      // Step 4: Process with Gemini AI
      setProcessingStatus({
        stage: 'extracting',
        progress: 30,
        message: '🤖 AI Gemini sedang menganalisis dokumen...'
      });

      const { data, error: processError } = await processDocument(document.id, (status) => {
        if (status.stage === 'extracting') {
          setProcessingStatus({
            ...status,
            progress: 30 + (status.progress / 100) * 40,
            message: '🤖 AI Gemini mengekstrak data keuangan...'
          });
        } else if (status.stage === 'parsing') {
          setProcessingStatus({
            ...status,
            progress: 70 + (status.progress / 100) * 20,
            message: '📊 Memproses data...'
          });
        } else {
          setProcessingStatus(status);
        }
      }, true);

      if (processError || !data) throw new Error(processError || 'Gagal memproses dokumen');

      // Debug: Log the data
      console.log('=== Data from AI ===', data);

      // Extract the financial data from AI response
      const extractedData: FinancialDataInput = {
        companyName: data.financialData?.companyName || 'Perusahaan',
        financialYear: data.financialData?.financialYear || new Date().getFullYear(),
        sales_current: data.financialData?.sales_current || 0,
        sales_prior: data.financialData?.sales_prior || 0,
        cogs_current: data.financialData?.cogs_current || 0,
        cogs_prior: data.financialData?.cogs_prior || 0,
        grossProfit_current: data.financialData?.grossProfit_current || 0,
        grossProfit_prior: data.financialData?.grossProfit_prior || 0,
        receivables_current: data.financialData?.receivables_current || 0,
        receivables_prior: data.financialData?.receivables_prior || 0,
        receivables_related_current: data.financialData?.receivables_related_current || 0,
        receivables_related_prior: data.financialData?.receivables_related_prior || 0,
        totalAssets_current: data.financialData?.totalAssets_current || 0,
        totalAssets_prior: data.financialData?.totalAssets_prior || 0,
        currentAssets_current: data.financialData?.currentAssets_current || 0,
        currentAssets_prior: data.financialData?.currentAssets_prior || 0,
        cash_current: data.financialData?.cash_current || 0,
        cash_prior: data.financialData?.cash_prior || 0,
        ppe_current: data.financialData?.ppe_current || 0,
        ppe_prior: data.financialData?.ppe_prior || 0,
        depreciation_current: data.financialData?.depreciation_current || 0,
        depreciation_prior: data.financialData?.depreciation_prior || 0,
        sgaExpense_current: Math.max(
          (data.financialData?.sellingExpense_current || 0) +
          (data.financialData?.generalExpense_current || 0) +
          (data.financialData?.adminExpense_current || 0),
          data.financialData?.sgaExpense_current || 0
        ),
        sgaExpense_prior: Math.max(
          (data.financialData?.sellingExpense_prior || 0) +
          (data.financialData?.generalExpense_prior || 0) +
          (data.financialData?.adminExpense_prior || 0),
          data.financialData?.sgaExpense_prior || 0
        ),
        sellingExpense_current: data.financialData?.sellingExpense_current || 0,
        sellingExpense_prior: data.financialData?.sellingExpense_prior || 0,
        generalExpense_current: data.financialData?.generalExpense_current || 0,
        generalExpense_prior: data.financialData?.generalExpense_prior || 0,
        adminExpense_current: data.financialData?.adminExpense_current || 0,
        adminExpense_prior: data.financialData?.adminExpense_prior || 0,
        operatingIncome_current: data.financialData?.operatingIncome_current || 0,
        operatingCashFlow_current: data.financialData?.operatingCashFlow_current || 0,
        taxPayable_current: data.financialData?.taxPayable_current || 0,
        taxPayable_prior: data.financialData?.taxPayable_prior || 0,
        longTermDebt_current: data.financialData?.longTermDebt_current || 0,
        longTermDebt_prior: data.financialData?.longTermDebt_prior || 0,
        currentLiabilities_current: data.financialData?.currentLiabilities_current || 0,
        currentLiabilities_prior: data.financialData?.currentLiabilities_prior || 0,
        oilAndGas_current: data.financialData?.oilAndGas_current || 0,
        oilAndGas_prior: data.financialData?.oilAndGas_prior || 0,
      };

      // Check if extraction was successful (not all zeros)
      const hasData = Object.entries(extractedData)
        .filter(([key]) => key !== 'companyName' && key !== 'financialYear')
        .some(([, value]) => typeof value === 'number' && value > 0);

      if (!hasData) {
        // AI failed to extract data - prompt user to edit manually
        setFinancialData(extractedData);
        setIsEditing(true);
        setProcessingStatus({
          stage: 'completed',
          progress: 100,
          message: '⚠️ AI tidak dapat mengekstrak data. Silakan input manual.'
        });
        setError('AI tidak berhasil mengekstrak data keuangan dari dokumen. Silakan masukkan data secara manual di bawah ini.');
        return;
      }

      // Calculate M-Score using our local function
      setFinancialData(extractedData);
      const result = calculateFromData(extractedData);
      setAnalysisResult(result);

      // Save to database
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('fraud_analyses')
        .insert({
          user_id: user.id,
          company_name: result.companyName,
          analysis_data: {
            financial_data: result.financialData,
            m_score_components: result.components,
            red_flags: result.redFlags.map(msg => ({
              component: 'General',
              message: msg,
              value: 0,
              threshold: 0,
              severity: 'warning'
            }))
          },
          m_score: result.mScore,
          risk_level: result.riskLevel
        })
        .select()
        .single();

      if (!saveError && savedAnalysis) {
        setSavedAnalysisId(savedAnalysis.id);
      }

      await incrementUploadCount(user.id);

      setProcessingStatus({
        stage: 'completed',
        progress: 100,
        message: '✅ Analisis selesai!'
      });

    } catch (err: any) {
      console.error('Error processing document:', err);
      setError(err.message || 'Gagal memproses dokumen');
      setProcessingStatus({
        stage: 'failed',
        progress: 0,
        message: err.message || 'Pemrosesan gagal'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCalculate = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Validate that we have required data
      if (financialData.sales_current === 0 || financialData.sales_prior === 0) {
        setError('Harap isi minimal data Penjualan tahun berjalan dan sebelumnya');
        setLoading(false);
        return;
      }

      // Calculate M-Score
      const result = calculateFromData(financialData);
      setAnalysisResult(result);
      setIsEditing(false);

      // Save to database
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('fraud_analyses')
        .insert({
          user_id: user.id,
          company_name: result.companyName,
          analysis_data: {
            financial_data: result.financialData,
            m_score_components: result.components,
            red_flags: result.redFlags.map(msg => ({
              component: 'General',
              message: msg,
              value: 0,
              threshold: 0,
              severity: 'warning'
            }))
          },
          m_score: result.mScore,
          risk_level: result.riskLevel
        })
        .select()
        .single();

      if (!saveError && savedAnalysis) {
        setSavedAnalysisId(savedAnalysis.id);
      }

    } catch (err: any) {
      console.error('Error calculating:', err);
      setError(err.message || 'Gagal menghitung M-Score');
    } finally {
      setLoading(false);
    }
  };

  const handleEditData = () => {
    if (analysisResult) {
      setFinancialData(analysisResult.financialData);
    }
    setIsEditing(true);
    setAnalysisResult(null);
  };

  const formatNumber = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getBorderColor = () => {
    if (!analysisResult) return 'border-l-gray-300';
    if (analysisResult.riskLevel === 'high') return 'border-l-red-600';
    if (analysisResult.riskLevel === 'moderate') return 'border-l-yellow-600';
    return 'border-l-green-600';
  };

  const getBadgeColor = () => {
    if (!analysisResult) return 'bg-gray-500';
    if (analysisResult.riskLevel === 'high') return 'bg-red-500';
    if (analysisResult.riskLevel === 'moderate') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const generatePDF = () => {
    if (!analysisResult) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper functions
    const centerText = (text: string, y: number, fontSize: number = 12) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    const drawLine = (y: number, color: number[] = [200, 200, 200]) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
    };

    // Colors based on risk level
    const isHighRisk = analysisResult.mScore > -1.78;
    const isModerateRisk = analysisResult.mScore > -2.22 && analysisResult.mScore <= -1.78;
    const primaryColor = isHighRisk ? [220, 53, 69] : isModerateRisk ? [255, 193, 7] : [40, 167, 69];

    // ============ HEADER WITH TRUREPORT BRANDING ============
    // Draw header background with gradient effect
    doc.setFillColor(25, 45, 75); // Dark navy blue
    doc.rect(0, 0, pageWidth, 55, 'F');

    // Add accent line
    doc.setFillColor(64, 186, 255); // Light blue accent
    doc.rect(0, 55, pageWidth, 3, 'F');

    // TruReport Logo - single clean text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('TruReport', margin, 20);

    // Tagline under logo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 180, 210);
    doc.text('Financial Fraud Detection System', margin, 27);

    // Website URL on right
    doc.setFontSize(9);
    doc.setTextColor(64, 186, 255);
    doc.text('www.trureport.id', pageWidth - margin - 32, 20);

    // Report Title - centered
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    centerText('LAPORAN ANALISIS BENEISH M-SCORE', 42, 14);

    // Date and subtitle
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 200, 220);
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    centerText(`Fraud Detection Analysis Report | ${dateStr}`, 50, 9);

    yPos = 68;

    // ============ SUMMARY BOX - HASIL ANALISIS ============
    // Main result box with color based on risk
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 75, 5, 5, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('HASIL ANALISIS', margin + 10, yPos + 12);

    // Company Name
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Perusahaan:', margin + 10, yPos + 25);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(analysisResult.companyName.toUpperCase(), margin + 10, yPos + 37);

    // Year
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Tahun Laporan:', margin + 10, yPos + 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(analysisResult.financialYear), margin + 10, yPos + 60);

    // M-Score box (white background)
    const scoreBoxWidth = 70;
    const scoreBoxX = pageWidth - margin - scoreBoxWidth - 10;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(scoreBoxX, yPos + 8, scoreBoxWidth, 58, 3, 3, 'F');

    // M-Score value
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('BENEISH M-SCORE', scoreBoxX + 8, yPos + 20);

    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(analysisResult.mScore.toFixed(3), scoreBoxX + 8, yPos + 42);

    // Risk Level
    doc.setFontSize(10);
    const riskText = isHighRisk ? 'RISIKO TINGGI' : isModerateRisk ? 'RISIKO SEDANG' : 'RISIKO RENDAH';
    doc.text(riskText, scoreBoxX + 8, yPos + 55);

    yPos += 85;

    // ============ INTERPRETATION BOX ============
    const interpretBoxColor = isHighRisk ? [254, 226, 226] : isModerateRisk ? [254, 243, 199] : [220, 252, 231];
    const interpretTextColor = isHighRisk ? [153, 27, 27] : isModerateRisk ? [146, 64, 14] : [22, 101, 52];

    doc.setFillColor(interpretBoxColor[0], interpretBoxColor[1], interpretBoxColor[2]);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F');

    doc.setTextColor(interpretTextColor[0], interpretTextColor[1], interpretTextColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    const interpretation = isHighRisk
      ? 'PERINGATAN: Terindikasi Potensi Manipulasi Laporan Keuangan'
      : 'AMAN: Tidak Terindikasi Manipulasi Laporan Keuangan';
    centerText(interpretation, yPos + 10, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const thresholdText = `M-Score (${analysisResult.mScore.toFixed(3)}) ${isHighRisk ? '>' : '<'} Threshold (-1.78)`;
    centerText(thresholdText, yPos + 20, 9);

    yPos += 33;

    // ============ RATIO ANALYSIS TABLE ============
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALISIS RASIO KEUANGAN', margin, yPos);
    yPos += 8;
    drawLine(yPos, [30, 41, 59]);
    yPos += 10;

    // Table headers
    const colWidths = [30, 55, 30, 30, 25];
    const headers = ['Rasio', 'Deskripsi', 'Nilai', 'Threshold', 'Status'];

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);

    let xPos = margin + 2;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 2);
      xPos += colWidths[i];
    });
    yPos += 10;

    // Ratio data
    const ratioData = [
      { name: 'DSRI', desc: "Days' Sales in Receivables", value: analysisResult.components.dsri, threshold: 1.031, inverse: false },
      { name: 'GMI', desc: 'Gross Margin Index', value: analysisResult.components.gmi, threshold: 1.041, inverse: false },
      { name: 'AQI', desc: 'Asset Quality Index', value: analysisResult.components.aqi, threshold: 1.039, inverse: false },
      { name: 'SGI', desc: 'Sales Growth Index', value: analysisResult.components.sgi, threshold: 1.134, inverse: false },
      { name: 'DEPI', desc: 'Depreciation Index', value: analysisResult.components.depi, threshold: 1.077, inverse: false },
      { name: 'SGAI', desc: 'SG&A Expenses Index', value: analysisResult.components.sgai, threshold: 0.893, inverse: true },
      { name: 'TATA', desc: 'Total Accruals/Assets', value: analysisResult.components.tata, threshold: 0.018, inverse: false },
      { name: 'LVGI', desc: 'Leverage Index', value: analysisResult.components.lvgi, threshold: 1.037, inverse: false },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    ratioData.forEach((ratio, index) => {
      const isWarning = ratio.inverse ? ratio.value < ratio.threshold : ratio.value > ratio.threshold;

      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
      }

      xPos = margin + 2;
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text(ratio.name, xPos, yPos);
      xPos += colWidths[0];

      doc.setFont('helvetica', 'normal');
      doc.text(ratio.desc, xPos, yPos);
      xPos += colWidths[1];

      doc.text(ratio.value.toFixed(3), xPos, yPos);
      xPos += colWidths[2];

      doc.text(ratio.threshold.toString(), xPos, yPos);
      xPos += colWidths[3];

      // Status with color
      if (isWarning) {
        doc.setTextColor(220, 53, 69);
        doc.text('⚠ WARNING', xPos, yPos);
      } else {
        doc.setTextColor(40, 167, 69);
        doc.text('✓ NORMAL', xPos, yPos);
      }

      yPos += 8;
    });

    yPos += 10;

    // ============ NEW PAGE FOR FINANCIAL DATA ============
    doc.addPage();
    yPos = margin;

    // Header for page 2
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    centerText('DATA KEUANGAN YANG DIANALISIS', 16, 14);
    yPos = 35;

    // Financial data table
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);

    const finData = [
      { label: 'Penjualan Neto', current: analysisResult.financialData.sales_current, prior: analysisResult.financialData.sales_prior },
      { label: 'Laba Bruto', current: analysisResult.financialData.grossProfit_current, prior: analysisResult.financialData.grossProfit_prior },
      { label: 'Piutang Usaha', current: analysisResult.financialData.receivables_current, prior: analysisResult.financialData.receivables_prior },
      { label: 'Piutang Pihak Berelasi', current: analysisResult.financialData.receivables_related_current || 0, prior: analysisResult.financialData.receivables_related_prior || 0 },
      { label: 'Total Aset', current: analysisResult.financialData.totalAssets_current, prior: analysisResult.financialData.totalAssets_prior },
      { label: 'Aset Lancar', current: analysisResult.financialData.currentAssets_current, prior: analysisResult.financialData.currentAssets_prior },
      { label: 'Aset Tetap (PP&E)', current: analysisResult.financialData.ppe_current, prior: analysisResult.financialData.ppe_prior },
      { label: 'Aset Migas (Oil & Gas)', current: analysisResult.financialData.oilAndGas_current || 0, prior: analysisResult.financialData.oilAndGas_prior || 0 },
      { label: 'Penyusutan', current: analysisResult.financialData.depreciation_current, prior: analysisResult.financialData.depreciation_prior },
      { label: 'Beban Penjualan', current: analysisResult.financialData.sellingExpense_current || 0, prior: analysisResult.financialData.sellingExpense_prior || 0 },
      { label: 'Beban Umum', current: analysisResult.financialData.generalExpense_current || 0, prior: analysisResult.financialData.generalExpense_prior || 0 },
      { label: 'Beban Administrasi', current: analysisResult.financialData.adminExpense_current || 0, prior: analysisResult.financialData.adminExpense_prior || 0 },
      { label: 'Beban SG&A Total', current: analysisResult.financialData.sgaExpense_current, prior: analysisResult.financialData.sgaExpense_prior },
      { label: 'Laba Usaha', current: analysisResult.financialData.operatingIncome_current, prior: null },
      { label: 'Arus Kas Operasi', current: analysisResult.financialData.operatingCashFlow_current, prior: null },
      { label: 'Hutang Pajak', current: analysisResult.financialData.taxPayable_current || 0, prior: analysisResult.financialData.taxPayable_prior || 0 },
      { label: 'Liabilitas Lancar', current: analysisResult.financialData.currentLiabilities_current || 0, prior: analysisResult.financialData.currentLiabilities_prior || 0 },
      { label: 'Liabilitas Jk. Panjang', current: analysisResult.financialData.longTermDebt_current, prior: analysisResult.financialData.longTermDebt_prior },
    ];

    // Table headers
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Akun', margin + 5, yPos + 7);
    doc.text(`Tahun ${analysisResult.financialYear}`, margin + 80, yPos + 7);
    doc.text(`Tahun ${analysisResult.financialYear - 1}`, margin + 130, yPos + 7);
    yPos += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    finData.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 8, 'F');
      }

      doc.setTextColor(30, 41, 59);
      doc.text(item.label, margin + 5, yPos + 2);
      doc.text(formatNumber(item.current), margin + 80, yPos + 2);
      doc.text(item.prior !== null ? formatNumber(item.prior) : '-', margin + 130, yPos + 2);
      yPos += 8;
    });

    yPos += 15;

    // ============ M-SCORE CALCULATION BREAKDOWN ============
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PERHITUNGAN M-SCORE', margin, yPos);
    yPos += 5;
    drawLine(yPos, [30, 41, 59]);
    yPos += 10;

    // Formula
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('M-Score = -4.84 + 0.92×DSRI + 0.528×GMI + 0.404×AQI + 0.892×SGI + 0.115×DEPI - 0.172×SGAI + 4.679×TATA - 0.327×LVGI', margin + 5, yPos + 9);
    yPos += 20;

    // Calculation table
    const calcData = [
      { comp: 'Konstanta', coef: '', value: '', contrib: '-4.840' },
      { comp: 'DSRI', coef: '0.920', value: analysisResult.components.dsri.toFixed(3), contrib: (0.92 * analysisResult.components.dsri).toFixed(3) },
      { comp: 'GMI', coef: '0.528', value: analysisResult.components.gmi.toFixed(3), contrib: (0.528 * analysisResult.components.gmi).toFixed(3) },
      { comp: 'AQI', coef: '0.404', value: analysisResult.components.aqi.toFixed(3), contrib: (0.404 * analysisResult.components.aqi).toFixed(3) },
      { comp: 'SGI', coef: '0.892', value: analysisResult.components.sgi.toFixed(3), contrib: (0.892 * analysisResult.components.sgi).toFixed(3) },
      { comp: 'DEPI', coef: '0.115', value: analysisResult.components.depi.toFixed(3), contrib: (0.115 * analysisResult.components.depi).toFixed(3) },
      { comp: 'SGAI', coef: '-0.172', value: analysisResult.components.sgai.toFixed(3), contrib: (-0.172 * analysisResult.components.sgai).toFixed(3) },
      { comp: 'TATA', coef: '4.679', value: analysisResult.components.tata.toFixed(4), contrib: (4.679 * analysisResult.components.tata).toFixed(3) },
      { comp: 'LVGI', coef: '-0.327', value: analysisResult.components.lvgi.toFixed(3), contrib: (-0.327 * analysisResult.components.lvgi).toFixed(3) },
    ];

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Komponen', margin + 5, yPos + 5);
    doc.text('Koefisien', margin + 45, yPos + 5);
    doc.text('Nilai Rasio', margin + 80, yPos + 5);
    doc.text('Kontribusi', margin + 120, yPos + 5);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    calcData.forEach((item) => {
      doc.text(item.comp, margin + 5, yPos + 3);
      doc.text(item.coef, margin + 45, yPos + 3);
      doc.text(item.value, margin + 80, yPos + 3);

      const contribNum = parseFloat(item.contrib);
      if (contribNum > 0) {
        doc.setTextColor(220, 53, 69);
        doc.text('+' + item.contrib, margin + 120, yPos + 3);
      } else {
        doc.setTextColor(40, 167, 69);
        doc.text(item.contrib, margin + 120, yPos + 3);
      }
      doc.setTextColor(30, 41, 59);
      yPos += 7;
    });

    // Total
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('M-SCORE TOTAL', margin + 5, yPos + 7);
    doc.text(analysisResult.mScore.toFixed(3), margin + 120, yPos + 7);

    yPos += 20;

    // ============ DISCLAIMER ============
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DISCLAIMER:', margin + 5, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.text('Beneish M-Score adalah alat screening dan bukan bukti mutlak adanya kecurangan.', margin + 5, yPos + 16);
    doc.text('Hasil analisis ini perlu ditinjau lebih lanjut oleh profesional yang berkompeten.', margin + 5, yPos + 22);
    doc.text('Keputusan investasi tidak boleh hanya berdasarkan hasil analisis ini.', margin + 5, yPos + 28);

    // ============ FOOTER ============
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(241, 245, 249);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`Halaman ${i} dari ${totalPages}`, margin, pageHeight - 5);
      doc.text('TruReport - Beneish M-Score Analysis | www.trureport.id', pageWidth - margin - 75, pageHeight - 5);
    }

    // Save
    doc.save(`${analysisResult.companyName.replace(/[^a-z0-9]/gi, '_')}_M-Score_Report.pdf`);
  };

  // M-Score calculation breakdown
  const mScoreBreakdown = analysisResult ? [
    { label: 'Konstanta', value: -4.84, weighted: -4.84 },
    { label: 'DSRI', coef: 0.92, value: analysisResult.components.dsri, weighted: 0.92 * analysisResult.components.dsri },
    { label: 'GMI', coef: 0.528, value: analysisResult.components.gmi, weighted: 0.528 * analysisResult.components.gmi },
    { label: 'AQI', coef: 0.404, value: analysisResult.components.aqi, weighted: 0.404 * analysisResult.components.aqi },
    { label: 'SGI', coef: 0.892, value: analysisResult.components.sgi, weighted: 0.892 * analysisResult.components.sgi },
    { label: 'DEPI', coef: 0.115, value: analysisResult.components.depi, weighted: 0.115 * analysisResult.components.depi },
    { label: 'SGAI', coef: -0.172, value: analysisResult.components.sgai, weighted: -0.172 * analysisResult.components.sgai },
    { label: 'TATA', coef: 4.679, value: analysisResult.components.tata, weighted: 4.679 * analysisResult.components.tata },
    { label: 'LVGI', coef: -0.327, value: analysisResult.components.lvgi, weighted: -0.327 * analysisResult.components.lvgi },
  ] : [];

  // Input field configuration
  const inputFields = [
    { key: 'sales_current', label: 'Penjualan Neto (t)', section: 'current' },
    { key: 'sales_prior', label: 'Penjualan Neto (t-1)', section: 'prior' },
    { key: 'cogs_current', label: 'HPP (COGS) (t)', section: 'current' },
    { key: 'cogs_prior', label: 'HPP (COGS) (t-1)', section: 'prior' },
    { key: 'grossProfit_current', label: 'Laba Bruto (t)', section: 'current' },
    { key: 'grossProfit_prior', label: 'Laba Bruto (t-1)', section: 'prior' },
    { key: 'receivables_current', label: 'Piutang Usaha (t)', section: 'current' },
    { key: 'receivables_prior', label: 'Piutang Usaha (t-1)', section: 'prior' },
    { key: 'receivables_related_current', label: 'Piutang Pihak Berelasi (t) *', section: 'current' },
    { key: 'receivables_related_prior', label: 'Piutang Pihak Berelasi (t-1) *', section: 'prior' },
    { key: 'totalAssets_current', label: 'Total Aset (t)', section: 'current' },
    { key: 'totalAssets_prior', label: 'Total Aset (t-1)', section: 'prior' },
    { key: 'currentAssets_current', label: 'Aset Lancar (t)', section: 'current' },
    { key: 'currentAssets_prior', label: 'Aset Lancar (t-1)', section: 'prior' },
    { key: 'cash_current', label: 'Kas & Setara Kas (t)', section: 'current' },
    { key: 'cash_prior', label: 'Kas & Setara Kas (t-1)', section: 'prior' },
    { key: 'ppe_range_start', label: '--- Aset ---', section: 'current' }, // Separator visual (optional, or just place it logically)
    { key: 'ppe_current', label: 'Aset Tetap/PP&E (t)', section: 'current' },
    { key: 'ppe_prior', label: 'Aset Tetap/PP&E (t-1)', section: 'prior' },
    { key: 'oilAndGas_current', label: 'Aset Migas (t) *', section: 'current' },
    { key: 'oilAndGas_prior', label: 'Aset Migas (t-1) *', section: 'prior' },
    { key: 'depreciation_current', label: 'Penyusutan (t)', section: 'current' },
    { key: 'depreciation_prior', label: 'Penyusutan (t-1)', section: 'prior' },
    { key: 'sellingExpense_current', label: 'Beban Penjualan (t)', section: 'current' },
    { key: 'sellingExpense_prior', label: 'Beban Penjualan (t-1)', section: 'prior' },
    { key: 'generalExpense_current', label: 'Beban Umum (t)', section: 'current' },
    { key: 'generalExpense_prior', label: 'Beban Umum (t-1)', section: 'prior' },
    { key: 'adminExpense_current', label: 'Beban Administrasi (t)', section: 'current' },
    { key: 'adminExpense_prior', label: 'Beban Administrasi (t-1)', section: 'prior' },
    { key: 'sgaExpense_current', label: 'Total SG&A (t)', section: 'current' },
    { key: 'sgaExpense_prior', label: 'Total SG&A (t-1)', section: 'prior' },
    { key: 'operatingIncome_current', label: 'Laba Usaha (t)', section: 'current' },
    { key: 'operatingCashFlow_current', label: 'Arus Kas Operasi (t)', section: 'current' },
    { key: 'taxPayable_current', label: 'Hutang Pajak (t)', section: 'current' },
    { key: 'taxPayable_prior', label: 'Hutang Pajak (t-1)', section: 'prior' },
    { key: 'longTermDebt_current', label: 'Liabilitas Jk. Panjang (t)', section: 'current' },
    { key: 'longTermDebt_prior', label: 'Liabilitas Jk. Panjang (t-1)', section: 'prior' },
    { key: 'currentLiabilities_current', label: 'Liabilitas Lancar (t)', section: 'current' },
    { key: 'currentLiabilities_prior', label: 'Liabilitas Lancar (t-1)', section: 'prior' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Button>
        <div className="flex items-center space-x-3 mb-2">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Analisis Beneish M-Score</h1>
        </div>
        <p className="text-gray-600">
          Upload laporan keuangan untuk analisis AI atau input data secara manual
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Mode Selection */}
      {!analysisResult && !isEditing && (
        <div className="flex gap-4 mb-6">
          <Button
            variant={mode === 'upload' ? 'default' : 'outline'}
            onClick={() => setMode('upload')}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Dokumen (AI)
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => { setMode('manual'); setIsEditing(true); }}
            className="flex-1"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Input Manual
          </Button>
        </div>
      )}

      {/* Upload Section */}
      {mode === 'upload' && !analysisResult && !isEditing && (
        <div className="space-y-6">
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Upload Laporan Keuangan
              </CardTitle>
              <CardDescription>
                Didukung: PDF, DOCX, XLSX, PNG, JPG (maksimal 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                onFileSelect={handleFileSelect}
                onRemove={handleFileRemove}
                selectedFile={selectedFile}
                processingStatus={processingStatus}
              />

              {processingStatus && processingStatus.stage !== 'failed' && processingStatus.stage !== 'completed' && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin">
                      <RefreshCw className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{processingStatus.message}</span>
                  </div>
                  <Progress value={processingStatus.progress} className="h-2" />
                </div>
              )}

              {selectedFile && !processingStatus && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleUploadAndAnalyze}
                    disabled={loading}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {loading ? 'Memproses...' : 'Analisis dengan AI'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Catatan Penting</AlertTitle>
            <AlertDescription className="text-amber-700">
              Jika AI tidak berhasil mengekstrak data dengan benar, Anda dapat menggunakan mode
              <strong> Input Manual</strong> untuk memasukkan data keuangan secara langsung dan mendapatkan
              perhitungan M-Score yang akurat.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Manual Input / Edit Section */}
      {isEditing && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Input Data Keuangan
              </CardTitle>
              <CardDescription>
                Masukkan data keuangan untuk tahun berjalan (t) dan tahun sebelumnya (t-1)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nama Perusahaan</Label>
                  <Input
                    id="companyName"
                    value={financialData.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    placeholder="PT Contoh Perusahaan Tbk"
                  />
                </div>
                <div>
                  <Label htmlFor="financialYear">Tahun Laporan</Label>
                  <Input
                    id="financialYear"
                    type="number"
                    value={financialData.financialYear}
                    onChange={(e) => updateField('financialYear', parseInt(e.target.value) || new Date().getFullYear())}
                  />
                </div>
              </div>

              {/* Financial Data Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {inputFields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key} className="text-sm">
                      {field.label}
                    </Label>
                    <Input
                      id={field.key}
                      type="text"
                      value={formatNumber(financialData[field.key as keyof FinancialDataInput] as number)}
                      onChange={(e) => updateField(field.key as keyof FinancialDataInput, e.target.value)}
                      placeholder="0"
                      className="font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => { setIsEditing(false); setMode('upload'); }}>
                  Batal
                </Button>
                <Button
                  onClick={handleManualCalculate}
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-emerald-600"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  {loading ? 'Menghitung...' : 'Hitung M-Score'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleFileRemove}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Analisis Baru
              </Button>
              <Button variant="outline" onClick={handleEditData}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Data
              </Button>
            </div>
            <div className="flex gap-2">
              {savedAnalysisId && (
                <Button onClick={() => navigate(`/results/${savedAnalysisId}`)}>
                  Lihat Hasil Detail
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Important Notice */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800">Penting untuk Dipahami</AlertTitle>
            <AlertDescription className="text-blue-700">
              Analisis ini bersifat <strong>ilustratif</strong> dan bukan merupakan indikasi pasti adanya kecurangan.
              Beneish M-Score adalah alat <em>screening</em> awal yang perlu ditelaah lebih lanjut oleh profesional.
            </AlertDescription>
          </Alert>

          {/* Data Quality Warning */}
          {((analysisResult.financialData.depreciation_prior === 0 && analysisResult.financialData.depreciation_current > 0) ||
            (analysisResult.financialData.receivables_related_current === 0 && analysisResult.financialData.receivables_related_prior === 0) ||
            (analysisResult.financialData.oilAndGas_current === 0)) && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800">Verifikasi Data Diperlukan</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Beberapa field penting bernilai <strong>0</strong> yang dapat mempengaruhi akurasi (DEPI/DSRI/AQI).
                  Mohon cek <strong>Edit Data</strong>:
                  <ul className="list-disc ml-6 mt-1 text-sm">
                    {analysisResult.financialData.depreciation_prior === 0 && analysisResult.financialData.depreciation_current > 0 && <li>Penyusutan (t-1) kosong/nol</li>}
                    {analysisResult.financialData.receivables_related_current === 0 && <li>Piutang Pihak Berelasi kosong/nol</li>}
                    {analysisResult.financialData.oilAndGas_current === 0 && <li>Aset Migas kosong/nol</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

          {/* Main Score Result */}
          <Card className={`border-l-4 ${getBorderColor()}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-base">{analysisResult.companyName} - Tahun {analysisResult.financialYear}</CardDescription>
                  <CardTitle className="text-5xl font-bold mt-2">{analysisResult.mScore.toFixed(3)}</CardTitle>
                  <p className="text-lg text-slate-600 mt-1">Beneish M-Score</p>
                </div>
                <Badge className={`text-lg px-6 py-3 ${getBadgeColor()}`}>
                  {analysisResult.riskLevel === 'high' ? 'RISIKO TINGGI' :
                    analysisResult.riskLevel === 'moderate' ? 'RISIKO SEDANG' : 'RISIKO RENDAH'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Interpretasi</p>
                  <div className="flex items-center gap-2">
                    {analysisResult.mScore > -1.78 ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    <p className="text-lg font-semibold">
                      {analysisResult.mScore > -1.78
                        ? 'Potensi Manipulator'
                        : 'Tidak Terindikasi Manipulator'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    M-Score {analysisResult.mScore > -1.78 ? '>' : '<'} -1.78 (threshold)
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Threshold Standar</p>
                  <p className="text-3xl font-bold text-slate-700">-1.78</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Nilai di atas -1.78 mengindikasikan potensi manipulasi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Data Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Tahun Berjalan (t)</TableHead>
                    <TableHead className="text-right">Tahun Sebelumnya (t-1)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Penjualan Neto</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.sales_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.sales_prior)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Laba Bruto</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.grossProfit_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.grossProfit_prior)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Piutang Usaha</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.receivables_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.receivables_prior)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Aset</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.totalAssets_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.totalAssets_prior)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Aset Lancar</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.currentAssets_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.currentAssets_prior)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Aset Tetap (PP&E)</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.ppe_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.ppe_prior)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Penyusutan</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.depreciation_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.depreciation_prior)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Beban SG&A</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.sgaExpense_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.sgaExpense_prior)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Laba Usaha</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.operatingIncome_current)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Arus Kas Operasi</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.operatingCashFlow_current)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Liabilitas Jangka Panjang</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.longTermDebt_current)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(analysisResult.financialData.longTermDebt_prior)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Ratio Components */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Komponen Rasio M-Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'dsri', name: 'DSRI', desc: "Days' Sales in Receivables", threshold: 1.031 },
                  { key: 'gmi', name: 'GMI', desc: 'Gross Margin Index', threshold: 1.041 },
                  { key: 'aqi', name: 'AQI', desc: 'Asset Quality Index', threshold: 1.039 },
                  { key: 'sgi', name: 'SGI', desc: 'Sales Growth Index', threshold: 1.134 },
                  { key: 'depi', name: 'DEPI', desc: 'Depreciation Index', threshold: 1.077 },
                  { key: 'sgai', name: 'SGAI', desc: 'SG&A Expenses Index', threshold: 0.893, inverse: true },
                  { key: 'tata', name: 'TATA', desc: 'Total Accruals/Assets', threshold: 0.018 },
                  { key: 'lvgi', name: 'LVGI', desc: 'Leverage Index', threshold: 1.037 },
                ].map((ratio) => {
                  const value = analysisResult.components[ratio.key as keyof typeof analysisResult.components];
                  const isWarning = ratio.inverse ? value < ratio.threshold : value > ratio.threshold;
                  return (
                    <div
                      key={ratio.key}
                      className={`p-4 rounded-lg border ${isWarning ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">{ratio.name}</span>
                        {isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-2xl font-bold font-mono">{value.toFixed(3)}</p>
                      <p className="text-xs text-slate-500 mt-1">{ratio.desc}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Final Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Perhitungan Akhir M-Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Komponen</TableHead>
                    <TableHead className="text-right">Koefisien</TableHead>
                    <TableHead className="text-right">Nilai Rasio</TableHead>
                    <TableHead className="text-right">Kontribusi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mScoreBreakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell className="text-right font-mono">{item.coef !== undefined ? item.coef.toFixed(3) : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{item.value !== undefined ? item.value.toFixed(4) : '-'}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${item.weighted > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {item.weighted >= 0 ? '+' : ''}{item.weighted.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-100 font-bold">
                    <TableCell colSpan={3}>M-Score Total</TableCell>
                    <TableCell className={`text-right text-lg font-mono ${analysisResult.mScore > -1.78 ? 'text-red-600' : 'text-green-600'}`}>
                      {analysisResult.mScore.toFixed(3)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Interpretation */}
          <Card>
            <CardHeader>
              <CardTitle>Interpretasi Hasil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg ${analysisResult.mScore > -1.78 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <p className="text-lg">
                  <strong>Beneish M-Score untuk {analysisResult.companyName} adalah {analysisResult.mScore.toFixed(3)}</strong>
                </p>
                <p className="mt-2">
                  {analysisResult.mScore > -1.78 ? (
                    <>
                      <span className="text-red-700 font-semibold">Kesimpulan:</span> Karena nilai M-Score ({analysisResult.mScore.toFixed(3)}) lebih besar dari -1.78,
                      model ini mengindikasikan bahwa <strong>{analysisResult.companyName} diklasifikasikan sebagai perusahaan yang berpotensi memanipulasi laporan keuangannya</strong>.
                    </>
                  ) : (
                    <>
                      <span className="text-green-700 font-semibold">Kesimpulan:</span> Karena nilai M-Score ({analysisResult.mScore.toFixed(3)}) lebih kecil dari -1.78,
                      model ini mengindikasikan bahwa <strong>{analysisResult.companyName} tidak diklasifikasikan sebagai perusahaan yang berpotensi memanipulasi laporan keuangannya</strong>.
                    </>
                  )}
                </p>
              </div>

              {analysisResult.redFlags.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Red Flags Terdeteksi ({analysisResult.redFlags.length})</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                      {analysisResult.redFlags.map((flag, index) => (
                        <li key={index}>{flag}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
