
import { calculateBeneishMScore } from './src/lib/beneish';
import { FinancialData } from './src/types';

// Mock data based on a hypothetical scenario
// You can replace these values with the ones from the user's reference document if available.
const mockData: FinancialData = {
    companyName: 'Test Company',
    financialYear: 2024,
    sales_current: 100000,
    sales_prior: 90000,
    cogs_current: 60000,
    cogs_prior: 50000,
    grossProfit_current: 40000, // Derived
    grossProfit_prior: 40000, // Derived
    receivables_current: 20000,
    receivables_prior: 15000,
    totalAssets_current: 200000,
    totalAssets_prior: 180000,
    currentAssets_current: 80000,
    currentAssets_prior: 70000,
    cash_current: 10000,
    cash_prior: 8000,
    ppe_current: 100000,
    ppe_prior: 90000,
    depreciation_current: 5000,
    depreciation_prior: 4500,
    // SGA Breakdown
    sellingExpense_current: 10000,
    sellingExpense_prior: 9000,
    generalExpense_current: 5000,
    generalExpense_prior: 4000,
    adminExpense_current: 5000,
    adminExpense_prior: 5000,
    sgaExpense_current: 20000, // Sum
    sgaExpense_prior: 18000, // Sum
    operatingIncome_current: 15000,
    operatingCashFlow_current: 12000,
    taxPayable_current: 2000,
    taxPayable_prior: 1500,
    longTermDebt_current: 50000,
    longTermDebt_prior: 45000,
    currentLiabilities_current: 30000,
    currentLiabilities_prior: 25000,
};

console.log('--- Beneish M-Score Calculation Verification ---');
console.log('Input Data:', JSON.stringify(mockData, null, 2));

const result = calculateBeneishMScore(mockData);

console.log('\n--- Results ---');
console.log('M-Score:', result.mScore);
console.log('Risk Level:', result.interpretation);
console.log('Fraud Likelihood:', result.fraudLikelihood);
console.log('\n--- Components ---');
console.log(JSON.stringify(result.components, null, 2));

console.log('\n--- Red Flags ---');
console.log(JSON.stringify(result.redFlags, null, 2));

// specific checks for revisions
console.log('\n--- Specific Revision Checks ---');
// TATA Check
// TATA = (Change WC - Change Cash - Change Tax - Dep) / Total Assets
// Change WC = (Current Assets - Current Liabilities) - (Prior CA - Prior CL)
const wc_current = mockData.currentAssets_current - mockData.currentLiabilities_current;
const wc_prior = mockData.currentAssets_prior - mockData.currentLiabilities_prior;
const change_wc = wc_current - wc_prior;
const change_cash = mockData.cash_current - mockData.cash_prior;
const change_tax = mockData.taxPayable_current - mockData.taxPayable_prior;
const tata_numerator = change_wc - change_cash - change_tax - mockData.depreciation_current;
const tata_check = tata_numerator / mockData.totalAssets_current;
console.log(`TATA Check: ${tata_check.toFixed(4)} (Expected approx: ${result.components.tata.toFixed(4)})`);

// LVGI Check
// LVGI = [(LTD_t + CL_t) / TA_t] / [(LTD_t-1 + CL_t-1) / TA_t-1]
const lev_current = (mockData.longTermDebt_current + mockData.currentLiabilities_current) / mockData.totalAssets_current;
const lev_prior = (mockData.longTermDebt_prior + mockData.currentLiabilities_prior) / mockData.totalAssets_prior;
const lvgi_check = lev_current / lev_prior;
console.log(`LVGI Check: ${lvgi_check.toFixed(4)} (Expected approx: ${result.components.lvgi.toFixed(4)})`);

// SGAI Check
// SGAI = (SGA_t / Sales_t) / (SGA_t-1 / Sales_t-1)
const sga_ratio_current = (mockData.sellingExpense_current + mockData.generalExpense_current + mockData.adminExpense_current) / mockData.sales_current;
const sga_ratio_prior = (mockData.sellingExpense_prior + mockData.generalExpense_prior + mockData.adminExpense_prior) / mockData.sales_prior;
const sgai_check = sga_ratio_current / sga_ratio_prior;
console.log(`SGAI Check: ${sgai_check.toFixed(4)} (Expected approx: ${result.components.sgai.toFixed(4)})`);
