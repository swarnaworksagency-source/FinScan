import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';

interface AnalysisData {
  id: string;
  company_name: string;
  financial_year: number;
  m_score: number;
  interpretation: string;
  fraud_likelihood: number;
  dsri: number;
  gmi: number;
  aqi: number;
  sgi: number;
  depi: number;
  sgai: number;
  tata: number;
  lvgi: number;
  created_at: string;
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redFlags, setRedFlags] = useState<string[]>([]);

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
        .from('analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setAnalysis(data as AnalysisData);

      const flags: string[] = [];
      if (data.dsri > 1.031) flags.push('DSRI: Receivables growing faster than sales');
      if (data.gmi > 1.041) flags.push('GMI: Declining gross margins');
      if (data.aqi > 1.039) flags.push('AQI: Increase in soft assets');
      if (data.sgi > 1.134) flags.push('SGI: Rapid sales growth');
      if (data.depi > 1.077) flags.push('DEPI: Slowing depreciation');
      if (data.sgai < 0.893) flags.push('SGAI: Declining SG&A');
      if (data.tata > 0.018) flags.push('TATA: High accruals');
      if (data.lvgi > 1.037) flags.push('LVGI: Increasing leverage');
      setRedFlags(flags);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!analysis) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Fraud Detection Analysis Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Company: ${analysis.company_name}`, 20, 35);
    doc.text(`Year: ${analysis.financial_year}`, 20, 42);
    doc.text(`M-Score: ${analysis.m_score.toFixed(3)}`, 20, 49);
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

  const getBorderColor = () => {
    if (analysis.interpretation === 'HIGH_RISK') return 'border-l-red-600';
    if (analysis.interpretation === 'MODERATE_RISK') return 'border-l-yellow-600';
    return 'border-l-green-600';
  };

  const getBadgeColor = () => {
    if (analysis.interpretation === 'HIGH_RISK') return 'bg-red-500';
    if (analysis.interpretation === 'MODERATE_RISK') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analysis Results</h1>
          <p className="text-slate-600">{analysis.company_name} - {analysis.financial_year}</p>
        </div>
      </div>

      <Card className={`border-l-4 ${getBorderColor()}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-4xl">{analysis.m_score.toFixed(3)}</CardTitle>
              <CardDescription>Beneish M-Score</CardDescription>
            </div>
            <Badge className={`text-lg px-4 py-2 ${getBadgeColor()}`}>
              {analysis.interpretation.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-2">Fraud Likelihood</p>
              <p className="text-3xl font-bold mb-2">{analysis.fraud_likelihood.toFixed(1)}%</p>
              <Progress value={analysis.fraud_likelihood} />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Classification</p>
              <p className="text-lg font-semibold">
                {analysis.m_score > -1.78 ? 'High Risk' : 'Moderate/Low Risk'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Threshold</p>
              <p className="text-lg font-semibold">-1.78</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {redFlags.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Warning: {redFlags.length} Red Flags Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              {redFlags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>M-Score Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ratio</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">DSRI</TableCell>
                <TableCell>{analysis.dsri.toFixed(3)}</TableCell>
                <TableCell>1.031</TableCell>
                <TableCell>
                  <Badge variant={analysis.dsri > 1.031 ? 'destructive' : 'outline'}>
                    {analysis.dsri > 1.031 ? 'Above' : 'Normal'}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">GMI</TableCell>
                <TableCell>{analysis.gmi.toFixed(3)}</TableCell>
                <TableCell>1.041</TableCell>
                <TableCell>
                  <Badge variant={analysis.gmi > 1.041 ? 'destructive' : 'outline'}>
                    {analysis.gmi > 1.041 ? 'Above' : 'Normal'}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">AQI</TableCell>
                <TableCell>{analysis.aqi.toFixed(3)}</TableCell>
                <TableCell>1.039</TableCell>
                <TableCell>
                  <Badge variant={analysis.aqi > 1.039 ? 'destructive' : 'outline'}>
                    {analysis.aqi > 1.039 ? 'Above' : 'Normal'}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">SGI</TableCell>
                <TableCell>{analysis.sgi.toFixed(3)}</TableCell>
                <TableCell>1.134</TableCell>
                <TableCell>
                  <Badge variant={analysis.sgi > 1.134 ? 'destructive' : 'outline'}>
                    {analysis.sgi > 1.134 ? 'Above' : 'Normal'}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Export Analysis Report</h3>
              <p className="text-sm text-slate-600">Download PDF report</p>
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
