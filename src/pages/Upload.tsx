import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FinancialData } from '@/types';
import { calculateBeneishMScore } from '@/lib/beneish';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function Upload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<FinancialData>({
    companyName: '',
    financialYear: new Date().getFullYear(),
    sales_current: 0,
    grossProfit_current: 0,
    receivables_current: 0,
    totalAssets_current: 0,
    currentAssets_current: 0,
    ppe_current: 0,
    depreciation_current: 0,
    sgaExpense_current: 0,
    operatingIncome_current: 0,
    operatingCashFlow_current: 0,
    longTermDebt_current: 0,
    sales_prior: 0,
    grossProfit_prior: 0,
    receivables_prior: 0,
    totalAssets_prior: 0,
    currentAssets_prior: 0,
    ppe_prior: 0,
    depreciation_prior: 0,
    sgaExpense_prior: 0,
    longTermDebt_prior: 0,
  });

  const updateFormData = (field: keyof FinancialData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');

    try {
      const result = calculateBeneishMScore(formData);

      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          user_id: user!.id,
          company_name: formData.companyName,
          financial_year: formData.financialYear,
          sales_current: formData.sales_current,
          gross_profit_current: formData.grossProfit_current,
          receivables_current: formData.receivables_current,
          total_assets_current: formData.totalAssets_current,
          current_assets_current: formData.currentAssets_current,
          ppe_current: formData.ppe_current,
          depreciation_current: formData.depreciation_current,
          sga_expense_current: formData.sgaExpense_current,
          operating_income_current: formData.operatingIncome_current,
          operating_cash_flow_current: formData.operatingCashFlow_current,
          long_term_debt_current: formData.longTermDebt_current,
          sales_prior: formData.sales_prior,
          gross_profit_prior: formData.grossProfit_prior,
          receivables_prior: formData.receivables_prior,
          total_assets_prior: formData.totalAssets_prior,
          current_assets_prior: formData.currentAssets_prior,
          ppe_prior: formData.ppe_prior,
          depreciation_prior: formData.depreciation_prior,
          sga_expense_prior: formData.sgaExpense_prior,
          long_term_debt_prior: formData.longTermDebt_prior,
          dsri: result.components.dsri,
          gmi: result.components.gmi,
          aqi: result.components.aqi,
          sgi: result.components.sgi,
          depi: result.components.depi,
          sgai: result.components.sgai,
          tata: result.components.tata,
          lvgi: result.components.lvgi,
          m_score: result.mScore,
          interpretation: result.interpretation,
          fraud_likelihood: result.fraudLikelihood
        })
        .select()
        .single();

      if (insertError) throw insertError;

      navigate(`/results/${analysis.id}`);
    } catch (err: any) {
      console.error('Error calculating M-Score:', err);
      setError(err.message || 'Failed to calculate M-Score');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Company Info' },
    { number: 2, title: 'Current Year' },
    { number: 3, title: 'Prior Year' },
    { number: 4, title: 'Review' }
  ];

  const progressPercent = (step / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-primary mb-2">New Fraud Analysis</h1>
        <p className="text-gray-600">
          Enter financial data to calculate Beneish M-Score
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step >= s.number
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step > s.number ? <CheckCircle2 className="w-6 h-6" /> : s.number}
                </div>
                <span className="text-sm mt-2 text-center">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-4 ${step > s.number ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progressPercent} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g., PT Indofood Sukses Makmur Tbk"
                value={formData.companyName}
                onChange={(e) => updateFormData('companyName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="financialYear">Financial Year *</Label>
              <Input
                id="financialYear"
                type="number"
                placeholder="2024"
                value={formData.financialYear}
                onChange={(e) => updateFormData('financialYear', parseInt(e.target.value))}
              />
            </div>
            <Alert>
              <AlertDescription>
                Enter amounts in millions. For example, enter 115786.525 for $115,786,525 million.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.companyName || !formData.financialYear}
              >
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Year Financial Data ({formData.financialYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sales_current">Net Sales *</Label>
                <Input
                  id="sales_current"
                  type="number"
                  step="0.001"
                  placeholder="115786.525"
                  value={formData.sales_current || ''}
                  onChange={(e) => updateFormData('sales_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="grossProfit_current">Gross Profit *</Label>
                <Input
                  id="grossProfit_current"
                  type="number"
                  step="0.001"
                  placeholder="40136.529"
                  value={formData.grossProfit_current || ''}
                  onChange={(e) => updateFormData('grossProfit_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="receivables_current">Accounts Receivable *</Label>
                <Input
                  id="receivables_current"
                  type="number"
                  step="0.001"
                  placeholder="9295.297"
                  value={formData.receivables_current || ''}
                  onChange={(e) => updateFormData('receivables_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="totalAssets_current">Total Assets *</Label>
                <Input
                  id="totalAssets_current"
                  type="number"
                  step="0.001"
                  placeholder="201713.313"
                  value={formData.totalAssets_current || ''}
                  onChange={(e) => updateFormData('totalAssets_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="currentAssets_current">Current Assets *</Label>
                <Input
                  id="currentAssets_current"
                  type="number"
                  step="0.001"
                  placeholder="79765.476"
                  value={formData.currentAssets_current || ''}
                  onChange={(e) => updateFormData('currentAssets_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="ppe_current">Property, Plant & Equipment (Net) *</Label>
                <Input
                  id="ppe_current"
                  type="number"
                  step="0.001"
                  placeholder="47813.979"
                  value={formData.ppe_current || ''}
                  onChange={(e) => updateFormData('ppe_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="depreciation_current">Depreciation & Amortization *</Label>
                <Input
                  id="depreciation_current"
                  type="number"
                  step="0.001"
                  placeholder="5580.228"
                  value={formData.depreciation_current || ''}
                  onChange={(e) => updateFormData('depreciation_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="sgaExpense_current">SG&A Expenses *</Label>
                <Input
                  id="sgaExpense_current"
                  type="number"
                  step="0.001"
                  placeholder="5048.503"
                  value={formData.sgaExpense_current || ''}
                  onChange={(e) => updateFormData('sgaExpense_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="operatingIncome_current">Operating Income *</Label>
                <Input
                  id="operatingIncome_current"
                  type="number"
                  step="0.001"
                  placeholder="23088.184"
                  value={formData.operatingIncome_current || ''}
                  onChange={(e) => updateFormData('operatingIncome_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="operatingCashFlow_current">Operating Cash Flow *</Label>
                <Input
                  id="operatingCashFlow_current"
                  type="number"
                  step="0.001"
                  placeholder="17507.956"
                  value={formData.operatingCashFlow_current || ''}
                  onChange={(e) => updateFormData('operatingCashFlow_current', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="longTermDebt_current">Long-term Debt *</Label>
                <Input
                  id="longTermDebt_current"
                  type="number"
                  step="0.001"
                  placeholder="55627.969"
                  value={formData.longTermDebt_current || ''}
                  onChange={(e) => updateFormData('longTermDebt_current', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Prior Year Financial Data ({formData.financialYear - 1})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sales_prior">Net Sales *</Label>
                <Input
                  id="sales_prior"
                  type="number"
                  step="0.001"
                  value={formData.sales_prior || ''}
                  onChange={(e) => updateFormData('sales_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="grossProfit_prior">Gross Profit *</Label>
                <Input
                  id="grossProfit_prior"
                  type="number"
                  step="0.001"
                  value={formData.grossProfit_prior || ''}
                  onChange={(e) => updateFormData('grossProfit_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="receivables_prior">Accounts Receivable *</Label>
                <Input
                  id="receivables_prior"
                  type="number"
                  step="0.001"
                  value={formData.receivables_prior || ''}
                  onChange={(e) => updateFormData('receivables_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="totalAssets_prior">Total Assets *</Label>
                <Input
                  id="totalAssets_prior"
                  type="number"
                  step="0.001"
                  value={formData.totalAssets_prior || ''}
                  onChange={(e) => updateFormData('totalAssets_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="currentAssets_prior">Current Assets *</Label>
                <Input
                  id="currentAssets_prior"
                  type="number"
                  step="0.001"
                  value={formData.currentAssets_prior || ''}
                  onChange={(e) => updateFormData('currentAssets_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="ppe_prior">Property, Plant & Equipment (Net) *</Label>
                <Input
                  id="ppe_prior"
                  type="number"
                  step="0.001"
                  value={formData.ppe_prior || ''}
                  onChange={(e) => updateFormData('ppe_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="depreciation_prior">Depreciation & Amortization *</Label>
                <Input
                  id="depreciation_prior"
                  type="number"
                  step="0.001"
                  value={formData.depreciation_prior || ''}
                  onChange={(e) => updateFormData('depreciation_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="sgaExpense_prior">SG&A Expenses *</Label>
                <Input
                  id="sgaExpense_prior"
                  type="number"
                  step="0.001"
                  value={formData.sgaExpense_prior || ''}
                  onChange={(e) => updateFormData('sgaExpense_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="longTermDebt_prior">Long-term Debt *</Label>
                <Input
                  id="longTermDebt_prior"
                  type="number"
                  step="0.001"
                  value={formData.longTermDebt_prior || ''}
                  onChange={(e) => updateFormData('longTermDebt_prior', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Calculate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{formData.companyName}</h3>
                <p className="text-gray-600">Financial Year: {formData.financialYear}</p>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  All financial data has been entered. Click "Calculate M-Score" to analyze for fraud indicators.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={handleCalculate}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Calculating...' : 'Calculate M-Score'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
