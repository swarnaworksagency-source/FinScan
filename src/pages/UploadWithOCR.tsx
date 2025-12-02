import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { FinancialData, ExtractedData, ProcessingStatus } from '@/types';
import { calculateBeneishMScore } from '@/lib/beneish';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FileUploader } from '@/components/FileUploader';
import { FinancialDataReview } from '@/components/FinancialDataReview';
import {
  uploadDocumentToStorage,
  createDocumentRecord,
  processDocument,
  mergeExtractedData,
  validateExtractedData
} from '@/lib/documentProcessor';

export default function UploadWithOCR() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | undefined>();
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError('');
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setProcessingStatus(undefined);
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile || !user) return;

    setLoading(true);
    setError('');

    try {
      setProcessingStatus({
        stage: 'uploading',
        progress: 10,
        message: 'Uploading document...'
      });

      const { path, error: uploadError } = await uploadDocumentToStorage(selectedFile, user.id);

      if (uploadError) {
        throw new Error(uploadError);
      }

      setProcessingStatus({
        stage: 'uploading',
        progress: 20,
        message: 'Creating document record...'
      });

      const { document, error: createError } = await createDocumentRecord(user.id, selectedFile, path);

      if (createError || !document) {
        throw new Error(createError || 'Failed to create document record');
      }

      const { data, error: processError } = await processDocument(document.id, setProcessingStatus);

      if (processError || !data) {
        throw new Error(processError || 'Failed to process document');
      }

      setExtractedData(data);

      const mergedData = mergeExtractedData(data.financialData, {});
      setFormData(mergedData);

      setProcessingStatus({
        stage: 'completed',
        progress: 100,
        message: 'Processing complete! Review the extracted data below.'
      });

      setTimeout(() => {
        setStep(2);
      }, 1500);

    } catch (err: any) {
      console.error('Error processing document:', err);
      setError(err.message || 'Failed to process document');
      setProcessingStatus({
        stage: 'failed',
        progress: 0,
        message: err.message || 'Processing failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');

    try {
      const validation = validateExtractedData(formData);

      if (!validation.isValid) {
        setError(`Please fill required fields: ${validation.errors.join(', ')}`);
        setLoading(false);
        return;
      }

      const result = calculateBeneishMScore(formData);

      const { data: analysis, error: insertError } = await supabase
        .from('fraud_analyses')
        .insert({
          user_id: user!.id,
          company_name: formData.companyName,
          analysis_data: {
            financial_data: formData,
            m_score_components: result.components,
            red_flags: result.redFlags
          },
          m_score: result.mScore,
          risk_level: result.interpretation === 'HIGH_RISK' ? 'high' :
                      result.interpretation === 'MODERATE_RISK' ? 'moderate' : 'low'
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
    { number: 1, title: 'Upload Document' },
    { number: 2, title: 'Review Data' },
    { number: 3, title: 'Calculate' }
  ];

  const progressPercent = (step / steps.length) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Smart Document Analysis</h1>
        </div>
        <p className="text-gray-600">
          Upload your financial document (PDF/DOCX/XLSX) and let AI extract the data automatically
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
        <div className="space-y-6">
          <FileUploader
            onFileSelect={handleFileSelect}
            onRemove={handleFileRemove}
            selectedFile={selectedFile}
            processingStatus={processingStatus}
          />

          {selectedFile && !extractedData && !processingStatus && (
            <div className="flex justify-end">
              <Button
                onClick={handleUploadAndProcess}
                disabled={loading}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <FileText className="w-5 h-5 mr-2" />
                {loading ? 'Processing...' : 'Process Document'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">How it works:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Upload your financial statement (PDF, Word, or Excel)</li>
                <li>AI automatically extracts financial data from the document</li>
                <li>Review and edit the extracted data</li>
                <li>Calculate Beneish M-Score for fraud detection</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {step === 2 && extractedData && (
        <div className="space-y-6">
          <FinancialDataReview
            extractedData={extractedData}
            formData={formData}
            onUpdate={updateFormData}
          />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            <Button onClick={() => setStep(3)} size="lg">
              Continue to Review
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Calculate M-Score</CardTitle>
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
                  All financial data has been reviewed. Click "Calculate M-Score" to analyze for fraud indicators.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Edit
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
