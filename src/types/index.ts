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
