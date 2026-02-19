import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Download, ArrowLeft, CheckCircle2, XCircle, Calculator, FileText, TrendingUp, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';

import { FinancialData, MScoreComponents, RedFlag } from '@/types';



interface AnalysisData {
  id: string;
  company_name: string;
  m_score: number;
  risk_level: string;
  created_at: string;
  analysis_data: {
    financial_data: FinancialData;
    m_score_components: MScoreComponents;
    red_flags: RedFlag[];
  };
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchAnalysis();
  }, [id, user, navigate]);

  const fetchAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('fraud_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAnalysis(data as AnalysisData);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const generatePDF = () => {
    if (!analysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Data aliases to match UploadWithOCR structure
    const financialData = analysis.analysis_data.financial_data;
    const components = analysis.analysis_data.m_score_components;
    const mScore = analysis.m_score;
    const riskLevel = analysis.risk_level;
    const companyName = analysis.company_name;
    const financialYear = financialData.financialYear;

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
    const isHighRisk = mScore > -1.78;
    const isModerateRisk = mScore > -2.22 && mScore <= -1.78;
    const primaryColor = isHighRisk ? [220, 53, 69] : isModerateRisk ? [255, 193, 7] : [40, 167, 69];

    // ============ HEADER WITH TRUREPORT BRANDING ============
    doc.setFillColor(25, 45, 75); // Dark navy blue
    doc.rect(0, 0, pageWidth, 55, 'F');
    doc.setFillColor(64, 186, 255); // Light blue accent
    doc.rect(0, 55, pageWidth, 3, 'F');

    // TruReport Logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('TruReport', margin, 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 180, 210);
    doc.text('Financial Fraud Detection System', margin, 27);

    doc.setFontSize(9);
    doc.setTextColor(64, 186, 255);
    doc.text('www.trureport.id', pageWidth - margin - 32, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    centerText('LAPORAN ANALISIS BENEISH M-SCORE', 42, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 200, 220);
    const dateStr = new Date(analysis.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    centerText(`Fraud Detection Analysis Report | ${dateStr}`, 50, 9);

    yPos = 68;

    // ============ SUMMARY BOX ============
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 75, 5, 5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('HASIL ANALISIS', margin + 10, yPos + 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Perusahaan:', margin + 10, yPos + 25);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), margin + 10, yPos + 37);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Tahun Laporan:', margin + 10, yPos + 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(financialYear), margin + 10, yPos + 60);

    // M-Score box
    const scoreBoxWidth = 70;
    const scoreBoxX = pageWidth - margin - scoreBoxWidth - 10;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(scoreBoxX, yPos + 8, scoreBoxWidth, 58, 3, 3, 'F');

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('BENEISH M-SCORE', scoreBoxX + 8, yPos + 20);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(mScore.toFixed(3), scoreBoxX + 8, yPos + 42);

    doc.setFontSize(10);
    const riskText = riskLevel === 'high' ? 'RISIKO TINGGI' : riskLevel === 'moderate' ? 'RISIKO SEDANG' : 'RISIKO RENDAH';
    doc.text(riskText, scoreBoxX + 8, yPos + 55);

    yPos += 85;

    // ============ INTERPRETATION ============
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
    centerText(`M-Score (${mScore.toFixed(3)}) ${isHighRisk ? '>' : '<'} Threshold (-1.78)`, yPos + 20, 9);

    yPos += 33;

    // ============ RATIO ANALYSIS TABLE ============
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALISIS RASIO KEUANGAN', margin, yPos);
    yPos += 8;
    drawLine(yPos, [30, 41, 59]);
    yPos += 10;

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

    const ratioData = [
      { name: 'DSRI', desc: "Days' Sales in Receivables", value: components.dsri, threshold: 1.031, inverse: false },
      { name: 'GMI', desc: 'Gross Margin Index', value: components.gmi, threshold: 1.041, inverse: false },
      { name: 'AQI', desc: 'Asset Quality Index', value: components.aqi, threshold: 1.039, inverse: false },
      { name: 'SGI', desc: 'Sales Growth Index', value: components.sgi, threshold: 1.134, inverse: false },
      { name: 'DEPI', desc: 'Depreciation Index', value: components.depi, threshold: 1.077, inverse: false },
      { name: 'SGAI', desc: 'SG&A Expenses Index', value: components.sgai, threshold: 0.893, inverse: true },
      { name: 'TATA', desc: 'Total Accruals/Assets', value: components.tata, threshold: 0.018, inverse: false },
      { name: 'LVGI', desc: 'Leverage Index', value: components.lvgi, threshold: 1.037, inverse: false },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    ratioData.forEach((ratio, index) => {
      const isWarning = ratio.inverse ? ratio.value < ratio.threshold : ratio.value > ratio.threshold;
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

    // Helper for page breaks
    const checkPageBreak = (heightToAdd: number) => {
      // Footer starts at pageHeight - 15, so we need to stop well before that
      // Using 50 provides a safe buffer (15 footer + 35 margin/gap)
      if (yPos + heightToAdd > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // ... (rest of the function start) ...

    // ============ NEW PAGE FOR FINANCIAL DATA ============
    doc.addPage();
    yPos = margin;

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    centerText('DATA KEUANGAN YANG DIANALISIS', 16, 14);
    yPos = 35;

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);

    // Full Financial Data with New Fields
    const finData = [
      { label: 'Penjualan Neto', current: financialData.sales_current, prior: financialData.sales_prior },
      { label: 'Laba Bruto', current: financialData.grossProfit_current, prior: financialData.grossProfit_prior },
      { label: 'Piutang Usaha', current: financialData.receivables_current, prior: financialData.receivables_prior },
      { label: 'Piutang Pihak Berelasi', current: financialData.receivables_related_current || 0, prior: financialData.receivables_related_prior || 0 },
      { label: 'Total Aset', current: financialData.totalAssets_current, prior: financialData.totalAssets_prior },
      { label: 'Aset Lancar', current: financialData.currentAssets_current, prior: financialData.currentAssets_prior },
      { label: 'Aset Tetap (PP&E)', current: financialData.ppe_current, prior: financialData.ppe_prior },
      { label: 'Aset Migas (Oil & Gas)', current: financialData.oilAndGas_current || 0, prior: financialData.oilAndGas_prior || 0 },
      { label: 'Penyusutan', current: financialData.depreciation_current, prior: financialData.depreciation_prior },
      { label: 'Beban Penjualan', current: financialData.sellingExpense_current || 0, prior: financialData.sellingExpense_prior || 0 },
      { label: 'Beban Umum', current: financialData.generalExpense_current || 0, prior: financialData.generalExpense_prior || 0 },
      { label: 'Beban Administrasi', current: financialData.adminExpense_current || 0, prior: financialData.adminExpense_prior || 0 },
      { label: 'Beban SG&A Total', current: Math.max((financialData.sellingExpense_current || 0) + (financialData.generalExpense_current || 0) + (financialData.adminExpense_current || 0), financialData.sgaExpense_current || 0), prior: Math.max((financialData.sellingExpense_prior || 0) + (financialData.generalExpense_prior || 0) + (financialData.adminExpense_prior || 0), financialData.sgaExpense_prior || 0) },
      { label: 'Laba Usaha', current: financialData.operatingIncome_current, prior: null },
      { label: 'Arus Kas Operasi', current: financialData.operatingCashFlow_current, prior: null },
      { label: 'Hutang Pajak', current: financialData.taxPayable_current || 0, prior: financialData.taxPayable_prior || 0 },
      { label: 'Liabilitas Lancar', current: financialData.currentLiabilities_current || 0, prior: financialData.currentLiabilities_prior || 0 },
      { label: 'Liabilitas Jk. Panjang', current: financialData.longTermDebt_current, prior: financialData.longTermDebt_prior },
    ];

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Akun', margin + 5, yPos + 7);
    doc.text(`Tahun ${financialYear}`, margin + 80, yPos + 7);
    doc.text(`Tahun ${financialYear - 1}`, margin + 130, yPos + 7);
    yPos += 12;

    doc.setFont('helvetica', 'normal');
    finData.forEach((item, index) => {
      checkPageBreak(10); // Check if next row fits

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 8, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text(item.label, margin + 5, yPos + 2);
      doc.text(formatNumber(item.current as number), margin + 80, yPos + 2);
      doc.text(item.prior !== null ? formatNumber(item.prior as number) : '-', margin + 130, yPos + 2);
      yPos += 8;
    });

    yPos += 15;

    // ============ M-SCORE CALCULATION BREAKDOWN ============
    if (checkPageBreak(60)) { // Ensure space for header and formula
      yPos += 10; // Add some top margin if new page
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PERHITUNGAN M-SCORE', margin, yPos);
    yPos += 5;
    drawLine(yPos, [30, 41, 59]);
    yPos += 10;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    // Split formula into 2 lines if needed or fit dynamically, but page break check above should handle it
    const formulaText = 'M-Score = -4.84 + 0.92×DSRI + 0.528×GMI + 0.404×AQI + 0.892×SGI + 0.115×DEPI - 0.172×SGAI + 4.679×TATA - 0.327×LVGI';
    doc.text(formulaText, margin + 5, yPos + 9, { maxWidth: pageWidth - 2 * margin - 10 });
    yPos += 20;

    const calcData = [
      { comp: 'Konstanta', coef: '', value: '', contrib: '-4.840' },
      { comp: 'DSRI', coef: '0.920', value: components.dsri.toFixed(3), contrib: (0.92 * components.dsri).toFixed(3) },
      { comp: 'GMI', coef: '0.528', value: components.gmi.toFixed(3), contrib: (0.528 * components.gmi).toFixed(3) },
      { comp: 'AQI', coef: '0.404', value: components.aqi.toFixed(3), contrib: (0.404 * components.aqi).toFixed(3) },
      { comp: 'SGI', coef: '0.892', value: components.sgi.toFixed(3), contrib: (0.892 * components.sgi).toFixed(3) },
      { comp: 'DEPI', coef: '0.115', value: components.depi.toFixed(3), contrib: (0.115 * components.depi).toFixed(3) },
      { comp: 'SGAI', coef: '-0.172', value: components.sgai.toFixed(3), contrib: (-0.172 * components.sgai).toFixed(3) },
      { comp: 'TATA', coef: '4.679', value: components.tata.toFixed(4), contrib: (4.679 * components.tata).toFixed(3) },
      { comp: 'LVGI', coef: '-0.327', value: components.lvgi.toFixed(3), contrib: (-0.327 * components.lvgi).toFixed(3) },
    ];

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
      checkPageBreak(10);
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

    checkPageBreak(25); // Ensure space for Total row
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('M-SCORE TOTAL', margin + 5, yPos + 7);
    doc.text(mScore.toFixed(3), margin + 120, yPos + 7);

    yPos += 20;

    // ============ DISCLAIMER ============
    checkPageBreak(40); // Ensure disclaimer fits

    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F'); // Increased height slightly
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DISCLAIMER:', margin + 5, yPos + 8);
    doc.setFont('helvetica', 'normal');
    // Split long text
    const disclaimerText = [
      'Beneish M-Score adalah alat screening dan bukan bukti mutlak adanya kecurangan.',
      'Hasil analisis ini perlu ditinjau lebih lanjut oleh profesional yang berkompeten.',
      'Keputusan investasi tidak boleh hanya berdasarkan hasil analisis ini.'
    ];
    let disY = yPos + 16;
    disclaimerText.forEach(line => {
      doc.text(line, margin + 5, disY);
      disY += 6;
    });

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

    doc.save(`${companyName.replace(/[^a-z0-9]/gi, '_')}_Analysis_Report.pdf`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p>Loading...</p></div>;
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Analysis not found</p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const { financial_data, m_score_components, red_flags } = analysis.analysis_data;
  const components = m_score_components;

  const getBorderColor = () => {
    if (analysis.risk_level === 'high') return 'border-l-red-600';
    if (analysis.risk_level === 'moderate') return 'border-l-yellow-600';
    return 'border-l-green-600';
  };

  const getBadgeColor = () => {
    if (analysis.risk_level === 'high') return 'bg-red-500';
    if (analysis.risk_level === 'moderate') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Calculate intermediate values for display
  const calcDetails = {
    // DSRI
    dsri_numerator: (financial_data.receivables_current + (financial_data.receivables_related_current || 0)) / financial_data.sales_current,
    dsri_denominator: (financial_data.receivables_prior + (financial_data.receivables_related_prior || 0)) / financial_data.sales_prior,
    // GMI (Gross Margin Index) - Fixed to use Gross Margin (GP / Sales)
    gmi_margin_prior: (financial_data.cogs_prior ? (financial_data.sales_prior - financial_data.cogs_prior) : financial_data.grossProfit_prior) / financial_data.sales_prior,
    gmi_margin_current: (financial_data.cogs_current ? (financial_data.sales_current - financial_data.cogs_current) : financial_data.grossProfit_current) / financial_data.sales_current,
    // AQI (Include Oil & Gas in PPE)
    aqi_current: 1 - (financial_data.currentAssets_current + financial_data.ppe_current + (financial_data.oilAndGas_current || 0)) / financial_data.totalAssets_current,
    aqi_prior: 1 - (financial_data.currentAssets_prior + financial_data.ppe_prior + (financial_data.oilAndGas_prior || 0)) / financial_data.totalAssets_prior,
    // DEPI (Include Oil & Gas in PPE)
    depi_prior: financial_data.depreciation_prior / (financial_data.ppe_prior + (financial_data.oilAndGas_prior || 0) + financial_data.depreciation_prior),
    depi_current: financial_data.depreciation_current / (financial_data.ppe_current + (financial_data.oilAndGas_current || 0) + financial_data.depreciation_current),
    // SGAI
    sgai_current: ((financial_data.sellingExpense_current || 0) + (financial_data.generalExpense_current || 0) + (financial_data.adminExpense_current || 0) || financial_data.sgaExpense_current) / financial_data.sales_current,
    sgai_prior: ((financial_data.sellingExpense_prior || 0) + (financial_data.generalExpense_prior || 0) + (financial_data.adminExpense_prior || 0) || financial_data.sgaExpense_prior) / financial_data.sales_prior,
    // TATA
    tata_change_wc: (financial_data.currentAssets_current - financial_data.currentLiabilities_current) - (financial_data.currentAssets_prior - financial_data.currentLiabilities_prior),
    tata_change_cash: financial_data.cash_current - financial_data.cash_prior,
    tata_change_tax: financial_data.taxPayable_current - financial_data.taxPayable_prior,
    tata_depreciation: financial_data.depreciation_current,
    // LVGI
    lvgi_current: (financial_data.longTermDebt_current + financial_data.currentLiabilities_current) / financial_data.totalAssets_current,
    lvgi_prior: (financial_data.longTermDebt_prior + financial_data.currentLiabilities_prior) / financial_data.totalAssets_prior,
  };

  // M-Score calculation breakdown
  const mScoreBreakdown = [
    { label: 'Konstanta', value: -4.84, weighted: -4.84 },
    { label: 'DSRI', coef: 0.92, value: components.dsri, weighted: 0.92 * components.dsri },
    { label: 'GMI', coef: 0.528, value: components.gmi, weighted: 0.528 * components.gmi },
    { label: 'AQI', coef: 0.404, value: components.aqi, weighted: 0.404 * components.aqi },
    { label: 'SGI', coef: 0.892, value: components.sgi, weighted: 0.892 * components.sgi },
    { label: 'DEPI', coef: 0.115, value: components.depi, weighted: 0.115 * components.depi },
    { label: 'SGAI', coef: -0.172, value: components.sgai, weighted: -0.172 * components.sgai },
    { label: 'TATA', coef: 4.679, value: components.tata, weighted: 4.679 * components.tata },
    { label: 'LVGI', coef: -0.327, value: components.lvgi, weighted: -0.327 * components.lvgi },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hasil Analisis Beneish M-Score</h1>
          <p className="text-slate-600">{analysis.company_name} - Tahun {financial_data.financialYear}</p>
        </div>
      </div>

      {/* Important Notice */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-800">Penting untuk Dipahami</AlertTitle>
        <AlertDescription className="text-blue-700">
          Analisis ini bersifat <strong>ilustratif</strong> dan bukan merupakan indikasi pasti adanya kecurangan.
          Beneish M-Score adalah alat <em>screening</em> awal, dan hasilnya perlu ditelaah lebih lanjut oleh
          profesional dengan mempertimbangkan konteks bisnis, industri, dan faktor kualitatif lainnya.
        </AlertDescription>
      </Alert>

      {/* Main Score Result */}
      <Card className={`border-l-4 ${getBorderColor()}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-5xl font-bold">{analysis.m_score.toFixed(3)}</CardTitle>
              <CardDescription className="text-lg mt-2">Beneish M-Score</CardDescription>
            </div>
            <Badge className={`text-lg px-6 py-3 ${getBadgeColor()}`}>
              {analysis.risk_level === 'high' ? 'HIGH RISK' :
                analysis.risk_level === 'moderate' ? 'MODERATE RISK' : 'LOW RISK'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">Interpretasi</p>
              <div className="flex items-center gap-2">
                {analysis.m_score > -1.78 ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                <p className="text-lg font-semibold">
                  {analysis.m_score > -1.78
                    ? 'Potensi Manipulator'
                    : 'Tidak Terindikasi Manipulator'}
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                M-Score {analysis.m_score > -1.78 ? '>' : '<'} -1.78 (threshold)
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

      {/* Section 1: Formula */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            1. Rumus Beneish M-Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-sm overflow-x-auto">
            <p className="whitespace-nowrap">
              <span className="text-emerald-400">M-Score</span> = -4.84 + 0.92×<span className="text-yellow-400">DSRI</span> + 0.528×<span className="text-yellow-400">GMI</span> + 0.404×<span className="text-yellow-400">AQI</span> + 0.892×<span className="text-yellow-400">SGI</span> + 0.115×<span className="text-yellow-400">DEPI</span> - 0.172×<span className="text-yellow-400">SGAI</span> + 4.679×<span className="text-yellow-400">TATA</span> - 0.327×<span className="text-yellow-400">LVGI</span>
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-2 bg-slate-50 rounded"><strong>DSRI</strong>: Days' Sales in Receivables Index</div>
            <div className="p-2 bg-slate-50 rounded"><strong>GMI</strong>: Gross Margin Index</div>
            <div className="p-2 bg-slate-50 rounded"><strong>AQI</strong>: Asset Quality Index</div>
            <div className="p-2 bg-slate-50 rounded"><strong>SGI</strong>: Sales Growth Index</div>
            <div className="p-2 bg-slate-50 rounded"><strong>DEPI</strong>: Depreciation Index</div>
            <div className="p-2 bg-slate-50 rounded"><strong>SGAI</strong>: SG&A Expenses Index</div>
            <div className="p-2 bg-slate-50 rounded"><strong>TATA</strong>: Total Accruals to Total Assets</div>
            <div className="p-2 bg-slate-50 rounded"><strong>LVGI</strong>: Leverage Index</div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Financial Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            2. Data Keuangan yang Digunakan
          </CardTitle>
          <CardDescription>Data dari laporan keuangan (dalam jutaan Rupiah)</CardDescription>
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
                <TableCell className="text-right">{formatNumber(financial_data.sales_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.sales_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Beban Pokok Penjualan (COGS)</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.cogs_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.cogs_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Laba Bruto</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.grossProfit_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.grossProfit_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Piutang Usaha</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.receivables_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.receivables_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Piutang Pihak Berelasi</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.receivables_related_current || 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.receivables_related_prior || 0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Aset</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.totalAssets_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.totalAssets_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Aset Lancar</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.currentAssets_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.currentAssets_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Kas & Setara Kas</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.cash_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.cash_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Aset Tetap (PP&E)</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.ppe_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.ppe_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Aset Migas (Oil & Gas)</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.oilAndGas_current || 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.oilAndGas_prior || 0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Penyusutan & Amortisasi</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.depreciation_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.depreciation_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium pl-8 text-slate-500">Beban Penjualan</TableCell>
                <TableCell className="text-right text-slate-500">{formatNumber(financial_data.sellingExpense_current)}</TableCell>
                <TableCell className="text-right text-slate-500">{formatNumber(financial_data.sellingExpense_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium pl-8 text-slate-500">Beban Umum</TableCell>
                <TableCell className="text-right text-slate-500">{formatNumber(financial_data.generalExpense_current)}</TableCell>
                <TableCell className="text-right text-slate-500">{formatNumber(financial_data.generalExpense_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium pl-8 text-slate-500">Beban Administrasi</TableCell>
                <TableCell className="text-right text-slate-500">{formatNumber(financial_data.adminExpense_current)}</TableCell>
                <TableCell className="text-right text-slate-500">{formatNumber(financial_data.adminExpense_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Beban SGA</TableCell>
                <TableCell className="text-right">{formatNumber(Math.max((financial_data.sellingExpense_current || 0) + (financial_data.generalExpense_current || 0) + (financial_data.adminExpense_current || 0), financial_data.sgaExpense_current || 0))}</TableCell>
                <TableCell className="text-right">{formatNumber(Math.max((financial_data.sellingExpense_prior || 0) + (financial_data.generalExpense_prior || 0) + (financial_data.adminExpense_prior || 0), financial_data.sgaExpense_prior || 0))}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Hutang Pajak</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.taxPayable_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.taxPayable_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Liabilitas Lancar</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.currentLiabilities_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.currentLiabilities_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Liabilitas Jangka Panjang</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.longTermDebt_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.longTermDebt_prior)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 3: Ratio Calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            3. Perhitungan Rasio
          </CardTitle>
          <CardDescription>Detail perhitungan untuk setiap variabel M-Score</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem value="dsri" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant={components.dsri > 1.031 ? 'destructive' : 'outline'}>
                    DSRI = {components.dsri.toFixed(3)}
                  </Badge>
                  <span>Days' Sales in Receivables Index</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded">
                  <p>DSRI = [(Piutang_t + PiutangLain_t) / Penjualan_t] / [(Piutang_t-1 + PiutangLain_t-1) / Penjualan_t-1]</p>
                  <p>DSRI = ({(financial_data.receivables_current + (financial_data.receivables_related_current || 0)).toLocaleString('id-ID')} / {formatNumber(financial_data.sales_current)}) / ({(financial_data.receivables_prior + (financial_data.receivables_related_prior || 0)).toLocaleString('id-ID')} / {formatNumber(financial_data.sales_prior)})</p>
                  <p>DSRI = ({calcDetails.dsri_numerator.toFixed(4)}) / ({calcDetails.dsri_denominator.toFixed(4)})</p>
                  <p className="font-bold text-emerald-700">DSRI = {components.dsri.toFixed(3)}</p>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {components.dsri > 1.031
                    ? '⚠️ Piutang usaha tumbuh lebih cepat dari penjualan - kemungkinan inflasi pendapatan'
                    : '✅ Normal - piutang sesuai dengan pertumbuhan penjualan'}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gmi" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant={components.gmi > 1.041 ? 'destructive' : 'outline'}>
                    GMI = {components.gmi.toFixed(3)}
                  </Badge>
                  <span>Gross Margin Index</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded">
                  <p>GMI = [(Penjualan_t-1 - LabaKotor_t-1) / Penjualan_t-1] / [(Penjualan_t - LabaKotor_t) / Penjualan_t]</p>
                  <p className="text-xs text-slate-500">*Laba Kotor = Penjualan - COGS (jika tersedia)</p>
                  <p>GMI = ({calcDetails.gmi_margin_prior.toFixed(4)}) / ({calcDetails.gmi_margin_current.toFixed(4)})</p>
                  <p className="font-bold text-emerald-700">GMI = {components.gmi.toFixed(3)}</p>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {components.gmi > 1.041
                    ? '⚠️ Margin laba kotor menurun - bisa mengindikasikan masalah di masa depan'
                    : '✅ Normal - margin laba kotor stabil'}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="aqi" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant={components.aqi > 1.039 ? 'destructive' : 'outline'}>
                    AQI = {components.aqi.toFixed(3)}
                  </Badge>
                  <span>Asset Quality Index</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded">
                  <p>AQI = [1 - (AsetLancar_t + PPE_t + AsetMigas_t)/TotalAset_t] / [1 - (AsetLancar_t-1 + PPE_t-1 + AsetMigas_t-1)/TotalAset_t-1]</p>
                  <p>AQI = ({calcDetails.aqi_current.toFixed(4)}) / ({calcDetails.aqi_prior.toFixed(4)})</p>
                  <p className="font-bold text-emerald-700">AQI = {components.aqi.toFixed(3)}</p>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {components.aqi > 1.039
                    ? '⚠️ Peningkatan soft assets - kemungkinan kapitalisasi biaya'
                    : '✅ Normal - kualitas aset stabil'}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sgi" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant={components.sgi > 1.134 ? 'destructive' : 'outline'}>
                    SGI = {components.sgi.toFixed(3)}
                  </Badge>
                  <span>Sales Growth Index</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded">
                  <p>SGI = Penjualan_t / Penjualan_t-1</p>
                  <p>SGI = {formatNumber(financial_data.sales_current)} / {formatNumber(financial_data.sales_prior)}</p>
                  <p className="font-bold text-emerald-700">SGI = {components.sgi.toFixed(3)}</p>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {components.sgi > 1.134
                    ? '⚠️ Pertumbuhan penjualan sangat cepat - meningkatkan insentif fraud'
                    : '✅ Normal - pertumbuhan penjualan wajar'}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="depi" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant={components.depi > 1.077 ? 'destructive' : 'outline'}>
                    DEPI = {components.depi.toFixed(3)}
                  </Badge>
                  <span>Depreciation Index</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded">
                  <p>DEPI = [Dep_t-1 / (PPE_t-1 + AsetMigas_t-1 + Dep_t-1)] / [Dep_t / (PPE_t + AsetMigas_t + Dep_t)]</p>
                  <p>DEPI = ({calcDetails.depi_prior.toFixed(4)}) / ({calcDetails.depi_current.toFixed(4)})</p>
                  <p className="font-bold text-emerald-700">DEPI = {components.depi.toFixed(3)}</p>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {components.depi > 1.077
                    ? '⚠️ Penyusutan melambat - mungkin overvaluasi aset'
                    : '✅ Normal - tingkat penyusutan wajar'}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sgai" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant={components.sgai < 0.893 ? 'destructive' : 'outline'}>
                    SGAI = {components.sgai.toFixed(3)}
                  </Badge>
                  <span>SG&A Expenses Index</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded">
                  <p>SGAI = (SGA_t / Penjualan_t) / (SGA_t-1 / Penjualan_t-1)</p>
                  <p className="text-xs text-slate-500">*SGA = Beban Penjualan + Umum + Admin</p>
                  <p>SGAI = ({calcDetails.sgai_current.toFixed(4)}) / ({calcDetails.sgai_prior.toFixed(4)})</p>
                  <p className="font-bold text-emerald-700">SGAI = {components.sgai.toFixed(3)}</p>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {components.sgai < 0.893
                    ? '⚠️ SG&A menurun relatif terhadap penjualan - mungkin tidak sustainable'
                    : '✅ Normal - beban SG&A proporsional'}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tata" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant={components.tata > 0.018 ? 'destructive' : 'outline'}>
                    TATA = {components.tata.toFixed(4)}
                  </Badge>
                  <span>Total Accruals to Total Assets</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded">
                  <p>TATA = (PerubahanModalKerja - PerubahanKas - PerubahanPajak - Depresiasi) / TotalAset_t</p>
                  <div className="pl-4 border-l-2 border-slate-200 my-2">
                    <p>Δ Modal Kerja (WC) = {formatNumber(calcDetails.tata_change_wc)}</p>
                    <p>Δ Kas = {formatNumber(calcDetails.tata_change_cash)}</p>
                    <p>Δ Hutang Pajak = {formatNumber(calcDetails.tata_change_tax)}</p>
                    <p>Depresiasi = {formatNumber(financial_data.depreciation_current)}</p>
                  </div>
                  <p>TATA = ({formatNumber(calcDetails.tata_change_wc - calcDetails.tata_change_cash - calcDetails.tata_change_tax - financial_data.depreciation_current)}) / {formatNumber(financial_data.totalAssets_current)}</p>
                  <p className="font-bold text-emerald-700">TATA = {components.tata.toFixed(4)}</p>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {components.tata > 0.018
                    ? '⚠️ Akrual tinggi - menunjukkan kemungkinan manipulasi laba'
                    : '✅ Normal - tingkat akrual wajar'}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lvgi" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <Badge variant={components.lvgi > 1.037 ? 'destructive' : 'outline'}>
                    LVGI = {components.lvgi.toFixed(3)}
                  </Badge>
                  <span>Leverage Index</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 text-sm font-mono bg-slate-50 p-4 rounded">
                  <p>LVGI = [(LiabilitasJP_t + LiabilitasLancar_t)/TotalAset_t] / [(LiabilitasJP_t-1 + LiabilitasLancar_t-1)/TotalAset_t-1]</p>
                  <p>LVGI = ({calcDetails.lvgi_current.toFixed(4)}) / ({calcDetails.lvgi_prior.toFixed(4)})</p>
                  <p className="font-bold text-emerald-700">LVGI = {components.lvgi.toFixed(3)}</p>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  {components.lvgi > 1.037
                    ? '⚠️ Leverage meningkat - mungkin mengindikasikan tekanan keuangan'
                    : '✅ Normal - leverage stabil'}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Section 4: Final Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            4. Perhitungan Akhir M-Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                    <TableCell className="text-right">{item.coef !== undefined ? item.coef.toFixed(3) : '-'}</TableCell>
                    <TableCell className="text-right">{item.value !== undefined ? item.value.toFixed(4) : '-'}</TableCell>
                    <TableCell className={`text-right font-semibold ${item.weighted > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.weighted >= 0 ? '+' : ''}{item.weighted.toFixed(3)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-100 font-bold">
                  <TableCell colSpan={3}>M-Score Total</TableCell>
                  <TableCell className={`text-right text-lg ${analysis.m_score > -1.78 ? 'text-red-600' : 'text-green-600'}`}>
                    {analysis.m_score.toFixed(3)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle>5. Interpretasi Hasil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg ${analysis.m_score > -1.78 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <p className="text-lg">
              <strong>Beneish M-Score untuk {analysis.company_name} adalah {analysis.m_score.toFixed(3)}</strong>
            </p>
            <p className="mt-2">
              {analysis.m_score > -1.78 ? (
                <>
                  <span className="text-red-700 font-semibold">Kesimpulan:</span> Karena nilai M-Score ({analysis.m_score.toFixed(3)}) lebih besar dari -1.78,
                  model ini mengindikasikan bahwa <strong>{analysis.company_name} diklasifikasikan sebagai perusahaan yang berpotensi memanipulasi laporan keuangannya</strong>.
                </>
              ) : (
                <>
                  <span className="text-green-700 font-semibold">Kesimpulan:</span> Karena nilai M-Score ({analysis.m_score.toFixed(3)}) lebih kecil dari -1.78,
                  model ini mengindikasikan bahwa <strong>{analysis.company_name} tidak diklasifikasikan sebagai perusahaan yang berpotensi memanipulasi laporan keuangannya</strong>.
                </>
              )}
            </p>
          </div>

          {red_flags && red_flags.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Red Flags Terdeteksi ({red_flags.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  {red_flags.map((flag, index) => (
                    <li key={index}>
                      <strong>{flag.component.toUpperCase()}</strong>: {flag.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Peringatan dan Keterbatasan</AlertTitle>
            <AlertDescription className="text-amber-700">
              <ol className="list-decimal ml-6 mt-2 space-y-2">
                <li><strong>Alat Screening:</strong> M-Score bukanlah bukti mutlak ada atau tidaknya kecurangan. Ini adalah alat statistik untuk memperingatkan adanya kemungkinan manipulasi.</li>
                <li><strong>Konteks Industri:</strong> Analisis yang lebih kuat membandingkan skor ini dengan rata-rata perusahaan di sektor yang sama.</li>
                <li><strong>Analisis Trend:</strong> Lebih baik menganalisis tren M-Score selama 5-10 tahun. Kenaikan konsisten menuju atau melampaui -1.78 adalah sinyal yang lebih kuat.</li>
                <li><strong>Validasi Data:</strong> Pastikan data keuangan yang digunakan akurat dan berasal dari laporan keuangan resmi yang telah diaudit.</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Export Laporan Analisis</h3>
              <p className="text-sm text-slate-600">Unduh laporan dalam format PDF</p>
            </div>
            <Button onClick={generatePDF}>
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
