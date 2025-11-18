import { FinancialData, MScoreResult, MScoreComponents, RedFlag } from '@/types';

export function calculateBeneishMScore(data: FinancialData): MScoreResult {
  const dsri = (data.receivables_current / data.sales_current) /
               (data.receivables_prior / data.sales_prior);

  const grossMarginPrior = (data.sales_prior - data.grossProfit_prior) / data.sales_prior;
  const grossMarginCurrent = (data.sales_current - data.grossProfit_current) / data.sales_current;
  const gmi = grossMarginPrior / grossMarginCurrent;

  const nonCurrentAssetsCurrent = 1 - (data.currentAssets_current + data.ppe_current) / data.totalAssets_current;
  const nonCurrentAssetsPrior = 1 - (data.currentAssets_prior + data.ppe_prior) / data.totalAssets_prior;
  const aqi = nonCurrentAssetsCurrent / nonCurrentAssetsPrior;

  const sgi = data.sales_current / data.sales_prior;

  const depRatePrior = data.depreciation_prior / (data.ppe_prior + data.depreciation_prior);
  const depRateCurrent = data.depreciation_current / (data.ppe_current + data.depreciation_current);
  const depi = depRatePrior / depRateCurrent;

  const sgai = (data.sgaExpense_current / data.sales_current) /
               (data.sgaExpense_prior / data.sales_prior);

  const tata = (data.operatingIncome_current - data.operatingCashFlow_current) /
               data.totalAssets_current;

  const leverageCurrent = (data.longTermDebt_current + data.currentAssets_current) / data.totalAssets_current;
  const leveragePrior = (data.longTermDebt_prior + data.currentAssets_prior) / data.totalAssets_prior;
  const lvgi = leverageCurrent / leveragePrior;

  const mScore = -4.84
    + (0.92 * dsri)
    + (0.528 * gmi)
    + (0.404 * aqi)
    + (0.892 * sgi)
    + (0.115 * depi)
    - (0.172 * sgai)
    + (4.679 * tata)
    - (0.327 * lvgi);

  let interpretation: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK';
  let fraudLikelihood: number;

  if (mScore > -1.78) {
    interpretation = 'HIGH_RISK';
    fraudLikelihood = Math.min(95, 50 + ((mScore + 1.78) * 20));
  } else if (mScore > -2.22) {
    interpretation = 'MODERATE_RISK';
    fraudLikelihood = 30 + ((mScore + 2.22) / 0.44 * 20);
  } else {
    interpretation = 'LOW_RISK';
    fraudLikelihood = Math.max(5, 30 + ((mScore + 2.22) * 10));
  }

  const redFlags: RedFlag[] = [];

  if (dsri > 1.031) {
    redFlags.push({
      component: 'dsri',
      value: dsri,
      threshold: 1.031,
      message: 'Receivables growing faster than sales - possible revenue inflation',
      severity: 'high'
    });
  }
  if (gmi > 1.041) {
    redFlags.push({
      component: 'gmi',
      value: gmi,
      threshold: 1.041,
      message: 'Declining gross margins may indicate future problems',
      severity: 'moderate'
    });
  }
  if (aqi > 1.039) {
    redFlags.push({
      component: 'aqi',
      value: aqi,
      threshold: 1.039,
      message: 'Increase in soft assets may indicate cost capitalization',
      severity: 'moderate'
    });
  }
  if (sgi > 1.134) {
    redFlags.push({
      component: 'sgi',
      value: sgi,
      threshold: 1.134,
      message: 'Rapid sales growth increases fraud incentives',
      severity: 'moderate'
    });
  }
  if (depi > 1.077) {
    redFlags.push({
      component: 'depi',
      value: depi,
      threshold: 1.077,
      message: 'Slowing depreciation may indicate asset overvaluation',
      severity: 'moderate'
    });
  }
  if (sgai < 0.893) {
    redFlags.push({
      component: 'sgai',
      value: sgai,
      threshold: 0.893,
      message: 'Declining SG&A relative to sales may be unsustainable',
      severity: 'low'
    });
  }
  if (tata > 0.018) {
    redFlags.push({
      component: 'tata',
      value: tata,
      threshold: 0.018,
      message: 'High accruals suggest potential earnings manipulation',
      severity: 'high'
    });
  }
  if (lvgi > 1.037) {
    redFlags.push({
      component: 'lvgi',
      value: lvgi,
      threshold: 1.037,
      message: 'Increasing leverage may indicate financial distress',
      severity: 'moderate'
    });
  }

  const components: MScoreComponents = {
    dsri,
    gmi,
    aqi,
    sgi,
    depi,
    sgai,
    tata,
    lvgi
  };

  return {
    mScore,
    components,
    interpretation,
    fraudLikelihood,
    redFlags
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount * 1000000);
}
