export interface FinancialData {
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

export interface MScoreComponents {
  dsri: number;
  gmi: number;
  aqi: number;
  sgi: number;
  depi: number;
  sgai: number;
  tata: number;
  lvgi: number;
}

export interface RedFlag {
  component: keyof MScoreComponents;
  value: number;
  threshold: number;
  message: string;
  severity: 'high' | 'moderate' | 'low';
}

export interface MScoreResult {
  mScore: number;
  components: MScoreComponents;
  interpretation: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK';
  fraudLikelihood: number;
  redFlags: RedFlag[];
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'professional' | 'enterprise';
  files_used_this_month: number;
  max_files_per_month: number;
  max_file_size_mb: number;
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
}

export interface Testimonial {
  id: string;
  user_id: string;
  user_name: string;
  user_company?: string;
  rating: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingSetting {
  id: string;
  plan_name: string;
  base_price: number;
  discount_percentage: number;
  final_price: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_type: 'pdf' | 'docx' | 'xlsx';
  file_size: number;
  storage_path: string;
  ocr_text: string | null;
  extracted_data: ExtractedData | null;
  confidence_score: number;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface MScoreDetailsFromAPI {
  mScore: number;
  interpretation: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';
  components: {
    DSRI: { value: number; description: string };
    GMI: { value: number; description: string };
    AQI: { value: number; description: string };
    SGI: { value: number; description: string };
    DEPI: { value: number; description: string };
    SGAI: { value: number; description: string };
    LVGI: { value: number; description: string };
    TATA: { value: number; description: string };
  };
  redFlags: string[];
}

export interface CalculationSteps {
  formula: string;
  dataTable: Array<{
    field: string;
    currentYear: number;
    priorYear: number;
  }>;
  ratioCalculations: Array<{
    name: string;
    formula: string;
    calculation: string;
    result: number;
    interpretation: string;
  }>;
  finalCalculation: Array<{
    component: string;
    coefficient: number;
    value: number;
    contribution: number;
  }>;
  conclusion: string;
  warnings: string[];
}

export interface ExtractedData {
  financialData: Partial<FinancialData>;
  confidence: Record<string, number>;
  rawText: string;
  missingFields: string[];
  detectedYear?: number;
  detectedCompany?: string;
  ocrMethod?: 'basic' | 'google_vision' | 'google_vision_nlp' | 'deepseek';
  mScoreDetails?: MScoreDetailsFromAPI;
  calculationSteps?: CalculationSteps;
}

export interface FieldConfidence {
  value: number | string | null;
  confidence: number;
  source: 'ocr' | 'manual' | 'inferred';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

export interface ProcessingStatus {
  stage: 'uploading' | 'extracting' | 'parsing' | 'completed' | 'failed';
  progress: number;
  message: string;
}
