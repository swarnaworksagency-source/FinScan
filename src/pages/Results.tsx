import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Download, ArrowLeft, CheckCircle2, XCircle, Calculator, FileText, TrendingUp, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';

interface FinancialData {
  companyName: string;
  financialYear: number;
  sales_current: number;
  grossProfit_current: number;
  receivables_current: number;
  totalAssets_current: number;
  currentAssets_current: number;
  ppe_current: number;
  depreciation_current: number;
  sgaExpense_current: number;
  operatingIncome_current: number;
  operatingCashFlow_current: number;
  longTermDebt_current: number;
  sales_prior: number;
  grossProfit_prior: number;
  receivables_prior: number;
  totalAssets_prior: number;
  currentAssets_prior: number;
  ppe_prior: number;
  depreciation_prior: number;
  sgaExpense_prior: number;
  longTermDebt_prior: number;
}

interface MScoreComponents {
  dsri: number;
  gmi: number;
  aqi: number;
  sgi: number;
  depi: number;
  sgai: number;
  tata: number;
  lvgi: number;
}

interface RedFlag {
  component: string;
  value: number;
  threshold: number;
  message: string;
  severity: string;
}

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
    doc.setFontSize(20);
    doc.text('Fraud Detection Analysis Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Company: ${analysis.company_name}`, 20, 35);
    doc.text(`M-Score: ${analysis.m_score.toFixed(3)}`, 20, 42);
    doc.text(`Risk Level: ${analysis.risk_level.toUpperCase()}`, 20, 49);
    doc.text(`Threshold: -1.78`, 20, 56);
    doc.text(`Date: ${new Date(analysis.created_at).toLocaleDateString('id-ID')}`, 20, 63);
    doc.save(`${analysis.company_name}_analysis.pdf`);
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
    dsri_numerator: financial_data.receivables_current / financial_data.sales_current,
    dsri_denominator: financial_data.receivables_prior / financial_data.sales_prior,
    // GMI
    gmi_margin_prior: (financial_data.sales_prior - financial_data.grossProfit_prior) / financial_data.sales_prior,
    gmi_margin_current: (financial_data.sales_current - financial_data.grossProfit_current) / financial_data.sales_current,
    // AQI
    aqi_current: 1 - (financial_data.currentAssets_current + financial_data.ppe_current) / financial_data.totalAssets_current,
    aqi_prior: 1 - (financial_data.currentAssets_prior + financial_data.ppe_prior) / financial_data.totalAssets_prior,
    // DEPI
    depi_prior: financial_data.depreciation_prior / (financial_data.ppe_prior + financial_data.depreciation_prior),
    depi_current: financial_data.depreciation_current / (financial_data.ppe_current + financial_data.depreciation_current),
    // SGAI
    sgai_current: financial_data.sgaExpense_current / financial_data.sales_current,
    sgai_prior: financial_data.sgaExpense_prior / financial_data.sales_prior,
    // TATA
    tata_accruals: financial_data.operatingIncome_current - financial_data.operatingCashFlow_current,
    // LVGI
    lvgi_current: (financial_data.longTermDebt_current + financial_data.currentAssets_current) / financial_data.totalAssets_current,
    lvgi_prior: (financial_data.longTermDebt_prior + financial_data.currentAssets_prior) / financial_data.totalAssets_prior,
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
                <TableCell className="font-medium">Aset Tetap (PP&E)</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.ppe_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.ppe_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Penyusutan & Amortisasi</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.depreciation_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.depreciation_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Beban Umum & Administrasi</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.sgaExpense_current)}</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.sgaExpense_prior)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Laba Usaha</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.operatingIncome_current)}</TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Arus Kas Operasi</TableCell>
                <TableCell className="text-right">{formatNumber(financial_data.operatingCashFlow_current)}</TableCell>
                <TableCell className="text-right">-</TableCell>
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
                  <p>DSRI = (Piutang_t / Penjualan_t) / (Piutang_t-1 / Penjualan_t-1)</p>
                  <p>DSRI = ({formatNumber(financial_data.receivables_current)} / {formatNumber(financial_data.sales_current)}) / ({formatNumber(financial_data.receivables_prior)} / {formatNumber(financial_data.sales_prior)})</p>
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
                  <p>AQI = [1 - (AsetLancar_t + PPE_t)/TotalAset_t] / [1 - (AsetLancar_t-1 + PPE_t-1)/TotalAset_t-1]</p>
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
                  <p>DEPI = [Dep_t-1 / (PPE_t-1 + Dep_t-1)] / [Dep_t / (PPE_t + Dep_t)]</p>
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
                  <p>TATA = (LabaUsaha_t - ArusKasOperasi_t) / TotalAset_t</p>
                  <p>TATA = ({formatNumber(financial_data.operatingIncome_current)} - {formatNumber(financial_data.operatingCashFlow_current)}) / {formatNumber(financial_data.totalAssets_current)}</p>
                  <p>TATA = {formatNumber(calcDetails.tata_accruals)} / {formatNumber(financial_data.totalAssets_current)}</p>
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
                  <p>LVGI = [(LiabilitasJP_t + AsetLancar_t)/TotalAset_t] / [(LiabilitasJP_t-1 + AsetLancar_t-1)/TotalAset_t-1]</p>
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
