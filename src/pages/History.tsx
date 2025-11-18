import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface Analysis {
  id: string;
  company_name: string;
  financial_year: number;
  m_score: number;
  interpretation: string;
  fraud_likelihood: number;
  created_at: string;
}

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchAnalyses();
  }, [user, navigate]);

  useEffect(() => {
    const filtered = analyses.filter(
      (a) =>
        a.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.financial_year.toString().includes(searchTerm)
    );
    setFilteredAnalyses(filtered);
  }, [searchTerm, analyses]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('id, company_name, financial_year, m_score, interpretation, fraud_likelihood, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data as Analysis[]);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;

    try {
      const { error } = await supabase.from('analyses').delete().eq('id', id);
      if (error) throw error;
      setAnalyses(analyses.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const getMScoreColor = (score: number) => {
    if (score > -1.78) return 'text-red-600 font-bold';
    if (score > -2.22) return 'text-yellow-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const getRiskBadge = (interpretation: string) => {
    if (interpretation === 'HIGH_RISK') return <Badge variant="destructive">High Risk</Badge>;
    if (interpretation === 'MODERATE_RISK') return <Badge className="bg-yellow-500">Moderate Risk</Badge>;
    return <Badge className="bg-green-500">Low Risk</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading analyses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analysis History</h1>
        <p className="text-slate-600">View and manage all your fraud analyses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by company name or year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Analyses</CardTitle>
          <CardDescription>Total: {filteredAnalyses.length} analyses</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">No analyses found</p>
              <Button onClick={() => navigate('/upload')}>Create First Analysis</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>M-Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Fraud %</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="font-medium">{analysis.company_name}</TableCell>
                    <TableCell>{analysis.financial_year}</TableCell>
                    <TableCell className={getMScoreColor(analysis.m_score)}>
                      {analysis.m_score.toFixed(3)}
                    </TableCell>
                    <TableCell>{getRiskBadge(analysis.interpretation)}</TableCell>
                    <TableCell>{analysis.fraud_likelihood.toFixed(1)}%</TableCell>
                    <TableCell>{format(new Date(analysis.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/results/${analysis.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(analysis.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
