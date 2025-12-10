import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Upload as UploadIcon, TrendingUp, FileCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { MetricCard } from '@/components/MetricCard';
import { ElevatedCard } from '@/components/ElevatedCard';

interface Analysis {
  id: string;
  company_name: string;
  financial_year: number;
  m_score: number;
  interpretation: string;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (profile?.role === 'admin') {
      navigate('/admin');
      return;
    }
    loadDashboardData();
  }, [user, profile, navigate]);

  const loadDashboardData = async () => {
    try {
      const [analysesData, subscriptionData] = await Promise.all([
        supabase
          .from('analyses')
          .select('id, company_name, financial_year, m_score, interpretation, created_at')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user!.id)
          .single()
      ]);

      if (analysesData.data) setAnalyses(analysesData.data as Analysis[]);
      if (subscriptionData.data) setSubscription(subscriptionData.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMScoreColor = (score: number) => {
    if (score > -1.78) return 'text-red-600 font-bold';
    if (score > -2.22) return 'text-yellow-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const getRiskBadge = (interpretation: string) => {
    if (interpretation === 'HIGH_RISK') return <Badge variant="destructive">High Risk</Badge>;
    if (interpretation === 'MODERATE_RISK') return <Badge className="bg-yellow-500">Moderate</Badge>;
    return <Badge className="bg-green-500">Low Risk</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const usagePercent = subscription
    ? (subscription.files_used_this_month / subscription.max_files_per_month) * 100
    : 0;

  const totalAnalyses = analyses.length;
  const highRiskCount = analyses.filter(a => a.interpretation === 'HIGH_RISK').length;
  const avgMScore = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + a.m_score, 0) / analyses.length
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-navy mb-2">Dashboard</h1>
          <p className="text-slate-600 text-lg">Welcome back! Ready to analyze financial statements?</p>
        </div>
        <Button
          onClick={() => navigate('/upload-ocr')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-glow"
          size="lg"
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="Total Analyses"
          value={totalAnalyses}
          icon={FileCheck}
          trend={{ value: 12, positive: true }}
        />
        <MetricCard
          label="High Risk Detected"
          value={highRiskCount}
          icon={AlertTriangle}
          className="bg-gradient-to-br from-red-50 to-white"
        />
        <MetricCard
          label="Average M-Score"
          value={avgMScore}
          decimals={2}
          icon={TrendingUp}
          trend={{ value: 5, positive: avgMScore < -2.22 }}
        />
      </div>

      <ElevatedCard hover={false}>
        <CardHeader>
          <CardTitle className="text-2xl text-navy">Monthly Usage</CardTitle>
          <CardDescription className="text-base">
            {subscription?.files_used_this_month || 0} of {subscription?.max_files_per_month || 3} analyses used this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={usagePercent} className="mb-4 h-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 capitalize">
              {subscription?.plan_type || 'Free'} Plan
            </span>
            {usagePercent >= 80 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardContent>
      </ElevatedCard>

      {analyses.length > 0 ? (
        <ElevatedCard hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-navy">Recent Analyses</CardTitle>
                <CardDescription className="text-base">Your latest fraud detection analyses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-700 font-semibold">Company</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Year</TableHead>
                  <TableHead className="text-slate-700 font-semibold">M-Score</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Risk Level</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Date</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow key={analysis.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-semibold text-navy">{analysis.company_name}</TableCell>
                    <TableCell className="text-slate-700">{analysis.financial_year}</TableCell>
                    <TableCell className={getMScoreColor(analysis.m_score)}>
                      {analysis.m_score.toFixed(3)}
                    </TableCell>
                    <TableCell>{getRiskBadge(analysis.interpretation)}</TableCell>
                    <TableCell className="text-slate-600">{format(new Date(analysis.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/results/${analysis.id}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => navigate('/history')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                View All Analyses →
              </Button>
            </div>
          </CardContent>
        </ElevatedCard>
      ) : (
        <ElevatedCard hover={false}>
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <UploadIcon className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-3">No Analyses Yet</h3>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Get started by uploading your first financial statement for analysis
              </p>
              <Button
                onClick={() => navigate('/upload-ocr')}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-glow"
              >
                <UploadIcon className="w-5 h-5 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardContent>
        </ElevatedCard>
      )}
    </div>
  );
}
