import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Upload as UploadIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

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
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Ready to analyze financial statements?</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>
            {subscription?.files_used_this_month || 0} of {subscription?.max_files_per_month || 3} analyses used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={usagePercent} className="mb-4" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 capitalize">
              {subscription?.plan_type || 'Free'} Plan
            </span>
            {usagePercent >= 100 && (
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {analyses.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>Your latest fraud detection analyses</CardDescription>
              </div>
              <Button onClick={() => navigate('/upload')}>
                <Plus className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>M-Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="font-medium">{analysis.company_name}</TableCell>
                    <TableCell>{analysis.financial_year}</TableCell>
                    <TableCell className={getMScoreColor(analysis.m_score)}>
                      {analysis.m_score.toFixed(3)}
                    </TableCell>
                    <TableCell>{getRiskBadge(analysis.interpretation)}</TableCell>
                    <TableCell>{format(new Date(analysis.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/results/${analysis.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate('/history')}>
                View All Analyses
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <UploadIcon className="mx-auto h-16 w-16 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analyses Yet</h3>
              <p className="text-slate-600 mb-6">
                Get started by uploading your first financial statement for analysis
              </p>
              <Button onClick={() => navigate('/upload')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
