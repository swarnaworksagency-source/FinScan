import { FinancialData, MScoreResult, MScoreComponents, RedFlag } from '@/types';

// Safe division to avoid NaN/Infinity
function safeDiv(numerator: number, denominator: number): number {
  if (denominator === 0 || isNaN(denominator) || isNaN(numerator)) {
    return 1; // Return 1 as default for ratios
  }
  const result = numerator / denominator;
  if (!isFinite(result) || isNaN(result)) {
    return 1;
  }
  return result;
}

export function calculateBeneishMScore(data: FinancialData): MScoreResult {
  // DSRI = (Piutang_t / Penjualan_t) / (Piutang_t-1 / Penjualan_t-1)
  const receivablesSalesRatioCurrent = safeDiv(data.receivables_current, data.sales_current);
  const receivablesSalesRatioPrior = safeDiv(data.receivables_prior, data.sales_prior);
  const dsri = safeDiv(receivablesSalesRatioCurrent, receivablesSalesRatioPrior);

  // GMI = [(Penjualan_t-1 - LK_t-1) / Penjualan_t-1] / [(Penjualan_t - LK_t) / Penjualan_t]
  // Note: Laba Kotor = Laba Bruto = Gross Profit
  const grossMarginPrior = safeDiv(data.sales_prior - data.grossProfit_prior, data.sales_prior);
  const grossMarginCurrent = safeDiv(data.sales_current - data.grossProfit_current, data.sales_current);
  const gmi = safeDiv(grossMarginPrior, grossMarginCurrent);

  // AQI = [1 - (Aset Lancar_t + PP&E_t) / Total Aset_t] / [1 - (Aset Lancar_t-1 + PP&E_t-1) / Total Aset_t-1]
  const nonCurrentAssetsCurrent = 1 - safeDiv(data.currentAssets_current + data.ppe_current, data.totalAssets_current);
  const nonCurrentAssetsPrior = 1 - safeDiv(data.currentAssets_prior + data.ppe_prior, data.totalAssets_prior);
  const aqi = safeDiv(nonCurrentAssetsCurrent, nonCurrentAssetsPrior);

  // SGI = Penjualan_t / Penjualan_t-1
  const sgi = safeDiv(data.sales_current, data.sales_prior);

  // DEPI = [Dep_t-1 / (PP&E_t-1 + Dep_t-1)] / [Dep_t / (PP&E_t + Dep_t)]
  const depRatePrior = safeDiv(data.depreciation_prior, data.ppe_prior + data.depreciation_prior);
  const depRateCurrent = safeDiv(data.depreciation_current, data.ppe_current + data.depreciation_current);
  const depi = safeDiv(depRatePrior, depRateCurrent);

  // SGAI = (SGA_t / Penjualan_t) / (SGA_t-1 / Penjualan_t-1)
  const sgaRatioCurrent = safeDiv(data.sgaExpense_current, data.sales_current);
  const sgaRatioPrior = safeDiv(data.sgaExpense_prior, data.sales_prior);
  const sgai = safeDiv(sgaRatioCurrent, sgaRatioPrior);

  // TATA = (Laba Usaha_t - Arus Kas Operasi_t) / Total Aset_t
  const accruals = data.operatingIncome_current - data.operatingCashFlow_current;
  const tata = safeDiv(accruals, data.totalAssets_current);

  // LVGI = [(Liabilitas JP_t + Aset Lancar_t) / Total Aset_t] / [(Liabilitas JP_t-1 + Aset Lancar_t-1) / Total Aset_t-1]
  const leverageCurrent = safeDiv(data.longTermDebt_current + data.currentAssets_current, data.totalAssets_current);
  const leveragePrior = safeDiv(data.longTermDebt_prior + data.currentAssets_prior, data.totalAssets_prior);
  const lvgi = safeDiv(leverageCurrent, leveragePrior);

  // M-Score = -4.84 + 0.92*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.679*TATA - 0.327*LVGI
  const mScore = -4.84
    + (0.92 * dsri)
    + (0.528 * gmi)
    + (0.404 * aqi)
    + (0.892 * sgi)
    + (0.115 * depi)
    - (0.172 * sgai)
    + (4.679 * tata)
    - (0.327 * lvgi);

  // Ensure mScore is a valid number
  const finalMScore = isNaN(mScore) || !isFinite(mScore) ? 0 : mScore;

  let interpretation: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK';
  let fraudLikelihood: number;

  if (finalMScore > -1.78) {
    interpretation = 'HIGH_RISK';
    fraudLikelihood = Math.min(95, 50 + ((finalMScore + 1.78) * 20));
  } else if (finalMScore > -2.22) {
    interpretation = 'MODERATE_RISK';
    fraudLikelihood = 30 + ((finalMScore + 2.22) / 0.44 * 20);
  } else {
    interpretation = 'LOW_RISK';
    fraudLikelihood = Math.max(5, 30 + ((finalMScore + 2.22) * 10));
  }

  const redFlags: RedFlag[] = [];

  // Check for red flags with proper thresholds
  if (dsri > 1.031) {
    redFlags.push({
      component: 'dsri',
      value: dsri,
      threshold: 1.031,
      message: 'DSRI tinggi: Piutang usaha tumbuh lebih cepat dari penjualan - kemungkinan inflasi pendapatan',
      severity: 'high'
    });
  }
  if (gmi > 1.041) {
    redFlags.push({
      component: 'gmi',
      value: gmi,
      threshold: 1.041,
      message: 'GMI tinggi: Margin laba kotor menurun - bisa mengindikasikan masalah di masa depan',
      severity: 'moderate'
    });
  }
  if (aqi > 1.039) {
    redFlags.push({
      component: 'aqi',
      value: aqi,
      threshold: 1.039,
      message: 'AQI tinggi: Peningkatan soft assets - kemungkinan kapitalisasi biaya',
      severity: 'moderate'
    });
  }
  if (sgi > 1.134) {
    redFlags.push({
      component: 'sgi',
      value: sgi,
      threshold: 1.134,
      message: 'SGI tinggi: Pertumbuhan penjualan sangat cepat - meningkatkan insentif fraud',
      severity: 'moderate'
    });
  }
  if (depi > 1.077) {
    redFlags.push({
      component: 'depi',
      value: depi,
      threshold: 1.077,
      message: 'DEPI tinggi: Penyusutan melambat - mungkin overvaluasi aset',
      severity: 'moderate'
    });
  }
  if (sgai < 0.893) {
    redFlags.push({
      component: 'sgai',
      value: sgai,
      threshold: 0.893,
      message: 'SGAI rendah: SG&A menurun relatif terhadap penjualan - mungkin tidak sustainable',
      severity: 'low'
    });
  }
  if (tata > 0.018) {
    redFlags.push({
      component: 'tata',
      value: tata,
      threshold: 0.018,
      message: 'TATA tinggi: Akrual tinggi menunjukkan kemungkinan manipulasi laba',
      severity: 'high'
    });
  }
  if (lvgi > 1.037) {
    redFlags.push({
      component: 'lvgi',
      value: lvgi,
      threshold: 1.037,
      message: 'LVGI tinggi: Leverage meningkat - mungkin mengindikasikan tekanan keuangan',
      severity: 'moderate'
    });
  }

  const components: MScoreComponents = {
    dsri: isNaN(dsri) || !isFinite(dsri) ? 1 : dsri,
    gmi: isNaN(gmi) || !isFinite(gmi) ? 1 : gmi,
    aqi: isNaN(aqi) || !isFinite(aqi) ? 1 : aqi,
    sgi: isNaN(sgi) || !isFinite(sgi) ? 1 : sgi,
    depi: isNaN(depi) || !isFinite(depi) ? 1 : depi,
    sgai: isNaN(sgai) || !isFinite(sgai) ? 1 : sgai,
    tata: isNaN(tata) || !isFinite(tata) ? 0 : tata,
    lvgi: isNaN(lvgi) || !isFinite(lvgi) ? 1 : lvgi
  };

  return {
    mScore: finalMScore,
    components,
    interpretation,
    fraudLikelihood,
    redFlags
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
