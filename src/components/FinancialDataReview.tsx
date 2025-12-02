import { FinancialData, ExtractedData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { getConfidenceLevel, getConfidenceColor } from '@/lib/documentProcessor';

interface FinancialDataReviewProps {
  extractedData: ExtractedData;
  formData: FinancialData;
  onUpdate: (field: keyof FinancialData, value: string | number) => void;
}

interface FieldInfo {
  key: keyof FinancialData;
  label: string;
  placeholder: string;
  section: 'company' | 'current' | 'prior';
}

const FIELD_DEFINITIONS: FieldInfo[] = [
  { key: 'companyName', label: 'Company Name', placeholder: 'PT Example Tbk', section: 'company' },
  { key: 'financialYear', label: 'Financial Year', placeholder: '2024', section: 'company' },
  { key: 'sales_current', label: 'Net Sales', placeholder: '115786.525', section: 'current' },
  { key: 'grossProfit_current', label: 'Gross Profit', placeholder: '40136.529', section: 'current' },
  { key: 'receivables_current', label: 'Accounts Receivable', placeholder: '9295.297', section: 'current' },
  { key: 'totalAssets_current', label: 'Total Assets', placeholder: '201713.313', section: 'current' },
  { key: 'currentAssets_current', label: 'Current Assets', placeholder: '79765.476', section: 'current' },
  { key: 'ppe_current', label: 'Property, Plant & Equipment (Net)', placeholder: '47813.979', section: 'current' },
  { key: 'depreciation_current', label: 'Depreciation & Amortization', placeholder: '5580.228', section: 'current' },
  { key: 'sgaExpense_current', label: 'SG&A Expenses', placeholder: '5048.503', section: 'current' },
  { key: 'operatingIncome_current', label: 'Operating Income', placeholder: '23088.184', section: 'current' },
  { key: 'operatingCashFlow_current', label: 'Operating Cash Flow', placeholder: '17507.956', section: 'current' },
  { key: 'longTermDebt_current', label: 'Long-term Debt', placeholder: '55627.969', section: 'current' },
  { key: 'sales_prior', label: 'Net Sales', placeholder: '108000', section: 'prior' },
  { key: 'grossProfit_prior', label: 'Gross Profit', placeholder: '38000', section: 'prior' },
  { key: 'receivables_prior', label: 'Accounts Receivable', placeholder: '8500', section: 'prior' },
  { key: 'totalAssets_prior', label: 'Total Assets', placeholder: '195000', section: 'prior' },
  { key: 'currentAssets_prior', label: 'Current Assets', placeholder: '75000', section: 'prior' },
  { key: 'ppe_prior', label: 'Property, Plant & Equipment (Net)', placeholder: '45000', section: 'prior' },
  { key: 'depreciation_prior', label: 'Depreciation & Amortization', placeholder: '5200', section: 'prior' },
  { key: 'sgaExpense_prior', label: 'SG&A Expenses', placeholder: '4800', section: 'prior' },
  { key: 'longTermDebt_prior', label: 'Long-term Debt', placeholder: '52000', section: 'prior' },
];

export function FinancialDataReview({
  extractedData,
  formData,
  onUpdate
}: FinancialDataReviewProps) {
  const getConfidenceIndicator = (field: keyof FinancialData) => {
    const confidence = extractedData.confidence[field] || 0;
    const level = getConfidenceLevel(confidence);
    const colorClass = getConfidenceColor(confidence);

    if (level === 'none') {
      return (
        <Badge variant="outline" className="ml-2">
          <XCircle className="w-3 h-3 mr-1" />
          Manual Input Required
        </Badge>
      );
    }

    return (
      <div className="flex items-center ml-2">
        {level === 'high' && <CheckCircle2 className={`w-4 h-4 ${colorClass}`} />}
        {level === 'medium' && <AlertTriangle className={`w-4 h-4 ${colorClass}`} />}
        {level === 'low' && <Info className={`w-4 h-4 ${colorClass}`} />}
        <span className={`text-xs ml-1 ${colorClass} font-medium`}>
          {confidence}% confident
        </span>
      </div>
    );
  };

  const renderField = (fieldInfo: FieldInfo) => {
    const value = formData[fieldInfo.key];
    const confidence = extractedData.confidence[fieldInfo.key] || 0;
    const level = getConfidenceLevel(confidence);

    return (
      <div key={fieldInfo.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldInfo.key} className="font-medium">
            {fieldInfo.label} *
          </Label>
          {getConfidenceIndicator(fieldInfo.key)}
        </div>
        <Input
          id={fieldInfo.key}
          type={fieldInfo.key === 'companyName' ? 'text' : 'number'}
          step="0.001"
          placeholder={fieldInfo.placeholder}
          value={value || ''}
          onChange={(e) => {
            const val = fieldInfo.key === 'companyName' || fieldInfo.key === 'financialYear'
              ? e.target.value
              : parseFloat(e.target.value) || 0;
            onUpdate(fieldInfo.key, val);
          }}
          className={`
            ${level === 'high' ? 'border-green-300 bg-green-50' : ''}
            ${level === 'medium' ? 'border-yellow-300 bg-yellow-50' : ''}
            ${level === 'low' ? 'border-orange-300 bg-orange-50' : ''}
            ${level === 'none' ? 'border-red-300 bg-red-50' : ''}
          `}
        />
      </div>
    );
  };

  const companyFields = FIELD_DEFINITIONS.filter(f => f.section === 'company');
  const currentFields = FIELD_DEFINITIONS.filter(f => f.section === 'current');
  const priorFields = FIELD_DEFINITIONS.filter(f => f.section === 'prior');

  const overallConfidence = Math.round(
    Object.values(extractedData.confidence).reduce((a, b) => a + b, 0) /
    Object.keys(extractedData.confidence).length
  );

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">
              Extraction Confidence: {overallConfidence}%
            </p>
            <p className="text-sm">
              Fields are color-coded by confidence level. Green = high confidence (auto-filled),
              Yellow = medium (please review), Red = low or missing (manual input required).
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            {extractedData.detectedCompany && (
              <span className="text-green-600">
                Detected: {extractedData.detectedCompany}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {companyFields.map(renderField)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Year Financial Data</CardTitle>
          <CardDescription>
            {formData.financialYear && `Year ${formData.financialYear}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {currentFields.map(renderField)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prior Year Financial Data</CardTitle>
          <CardDescription>
            {formData.financialYear && `Year ${formData.financialYear - 1}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {priorFields.map(renderField)}
          </div>
        </CardContent>
      </Card>

      {extractedData.missingFields.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">
              {extractedData.missingFields.length} fields could not be extracted
            </p>
            <p className="text-sm">
              Please manually enter: {extractedData.missingFields.slice(0, 5).join(', ')}
              {extractedData.missingFields.length > 5 && ` and ${extractedData.missingFields.length - 5} more`}
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
