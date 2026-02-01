/**
 * Shared Financial Calculations
 *
 * Single source of truth for all financial metric calculations.
 * Used by both client-side UI and server-side API/AI fallbacks.
 */

import { z } from 'zod';

/**
 * Financial health thresholds - centralized configuration
 */
export const THRESHOLDS = {
  // Savings rate thresholds
  EXCELLENT_SAVINGS_RATE: 20,
  GOOD_SAVINGS_RATE: 10,

  // Emergency fund thresholds (months of expenses)
  EXCELLENT_EMERGENCY_FUND: 6,
  GOOD_EMERGENCY_FUND: 3,

  // Debt-to-income ratio thresholds
  HEALTHY_DTI_RATIO: 36,
  CONCERNING_DTI_RATIO: 43,

  // Investment allocation thresholds
  EXCELLENT_INVESTMENT_RATIO: 40,
  GOOD_INVESTMENT_RATIO: 20,

  // Input validation limits
  MAX_MONETARY_VALUE: 100_000_000, // $100M max
  MIN_MONETARY_VALUE: 0,
} as const;

/**
 * Financial data input schema with validation
 */
export const FinancialDataSchema = z.object({
  monthlyIncome: z
    .number()
    .min(THRESHOLDS.MIN_MONETARY_VALUE, 'Monthly income cannot be negative')
    .max(THRESHOLDS.MAX_MONETARY_VALUE, 'Monthly income exceeds maximum allowed')
    .refine((n) => Number.isFinite(n), 'Monthly income must be a valid number'),
  monthlyExpenses: z
    .number()
    .min(THRESHOLDS.MIN_MONETARY_VALUE, 'Monthly expenses cannot be negative')
    .max(THRESHOLDS.MAX_MONETARY_VALUE, 'Monthly expenses exceeds maximum allowed')
    .refine((n) => Number.isFinite(n), 'Monthly expenses must be a valid number'),
  savings: z
    .number()
    .min(THRESHOLDS.MIN_MONETARY_VALUE, 'Savings cannot be negative')
    .max(THRESHOLDS.MAX_MONETARY_VALUE, 'Savings exceeds maximum allowed')
    .refine((n) => Number.isFinite(n), 'Savings must be a valid number'),
  investments: z
    .number()
    .min(THRESHOLDS.MIN_MONETARY_VALUE, 'Investments cannot be negative')
    .max(THRESHOLDS.MAX_MONETARY_VALUE, 'Investments exceeds maximum allowed')
    .refine((n) => Number.isFinite(n), 'Investments must be a valid number'),
  debt: z
    .number()
    .min(THRESHOLDS.MIN_MONETARY_VALUE, 'Debt cannot be negative')
    .max(THRESHOLDS.MAX_MONETARY_VALUE, 'Debt exceeds maximum allowed')
    .refine((n) => Number.isFinite(n), 'Debt must be a valid number'),
});

export type FinancialData = z.infer<typeof FinancialDataSchema>;

/**
 * Insight severity levels
 */
export type InsightSeverity = 'positive' | 'warning' | 'critical';

/**
 * Single financial insight
 */
export interface FinancialInsight {
  type: string;
  severity: InsightSeverity;
  message: string;
  recommendation: string;
}

/**
 * Calculated financial metrics
 */
export interface FinancialMetrics {
  savingsRate: number;
  netWorth: number;
  emergencyFundMonths: number;
  debtToIncomeRatio: number;
  monthlySavings: number;
}

/**
 * Complete analysis results
 */
export interface AnalysisResults {
  metrics: FinancialMetrics;
  insights: FinancialInsight[];
}

/**
 * Calculate all financial metrics from input data
 */
export function calculateMetrics(data: FinancialData): FinancialMetrics {
  const monthlySavings = data.monthlyIncome - data.monthlyExpenses;
  const savingsRate = data.monthlyIncome > 0
    ? (monthlySavings / data.monthlyIncome) * 100
    : 0;
  const netWorth = data.savings + data.investments - data.debt;
  const emergencyFundMonths = data.monthlyExpenses > 0
    ? data.savings / data.monthlyExpenses
    : 0;
  const debtToIncomeRatio = data.monthlyIncome > 0
    ? (data.debt / (data.monthlyIncome * 12)) * 100
    : 0;

  return {
    savingsRate,
    netWorth,
    emergencyFundMonths,
    debtToIncomeRatio,
    monthlySavings,
  };
}

/**
 * Determine severity based on metric and thresholds
 */
function getSavingsRateSeverity(rate: number): InsightSeverity {
  if (rate >= THRESHOLDS.EXCELLENT_SAVINGS_RATE) return 'positive';
  if (rate >= THRESHOLDS.GOOD_SAVINGS_RATE) return 'warning';
  return 'critical';
}

function getEmergencyFundSeverity(months: number): InsightSeverity {
  if (months >= THRESHOLDS.EXCELLENT_EMERGENCY_FUND) return 'positive';
  if (months >= THRESHOLDS.GOOD_EMERGENCY_FUND) return 'warning';
  return 'critical';
}

function getDebtRatioSeverity(ratio: number): InsightSeverity {
  if (ratio <= THRESHOLDS.HEALTHY_DTI_RATIO) return 'positive';
  if (ratio <= THRESHOLDS.CONCERNING_DTI_RATIO) return 'warning';
  return 'critical';
}

function getNetWorthSeverity(netWorth: number, annualIncome: number): InsightSeverity {
  if (netWorth > annualIncome) return 'positive';
  if (netWorth > 0) return 'warning';
  return 'critical';
}

/**
 * Generate insights based on calculated metrics
 */
export function generateInsights(data: FinancialData, metrics: FinancialMetrics): FinancialInsight[] {
  const { savingsRate, netWorth, emergencyFundMonths, debtToIncomeRatio } = metrics;
  const annualIncome = data.monthlyIncome * 12;
  const investmentToNetWorthRatio = netWorth > 0 ? (data.investments / netWorth) * 100 : 0;

  return [
    // Savings Rate Insight
    {
      type: 'savings_rate',
      severity: getSavingsRateSeverity(savingsRate),
      message: savingsRate >= THRESHOLDS.EXCELLENT_SAVINGS_RATE
        ? `Impressive! You're saving ${savingsRate.toFixed(1)}% of your income`
        : savingsRate >= THRESHOLDS.GOOD_SAVINGS_RATE
          ? `You're saving ${savingsRate.toFixed(1)}% of your income, which is a good start`
          : `Your savings rate of ${savingsRate.toFixed(1)}% puts your financial future at risk`,
      recommendation: savingsRate < THRESHOLDS.EXCELLENT_SAVINGS_RATE
        ? 'Financial experts recommend saving at least 20% of your income. Try cutting back on non-essential expenses like dining out or subscription services you rarely use.'
        : "You're on the right track! Consider setting up automatic transfers to investment accounts to put your savings to work.",
    },

    // Emergency Fund Insight
    {
      type: 'emergency_fund',
      severity: getEmergencyFundSeverity(emergencyFundMonths),
      message: emergencyFundMonths >= THRESHOLDS.EXCELLENT_EMERGENCY_FUND
        ? `Peace of mind! Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses`
        : emergencyFundMonths >= THRESHOLDS.GOOD_EMERGENCY_FUND
          ? `Your emergency fund would last ${emergencyFundMonths.toFixed(1)} months - you're halfway there`
          : `Your emergency fund would only last ${emergencyFundMonths.toFixed(1)} months, leaving you vulnerable to financial shocks`,
      recommendation: emergencyFundMonths < THRESHOLDS.EXCELLENT_EMERGENCY_FUND
        ? 'Aim to save enough to cover 3-6 months of essential expenses. Start small by setting aside a portion of each paycheck until you reach this goal.'
        : 'Well done! Your emergency fund is well-established. Keep it in a high-yield savings account for easy access while still earning interest.',
    },

    // Debt-to-Income Ratio Insight
    {
      type: 'debt_ratio',
      severity: getDebtRatioSeverity(debtToIncomeRatio),
      message: debtToIncomeRatio <= THRESHOLDS.HEALTHY_DTI_RATIO
        ? `Excellent! Your debt-to-income ratio is a healthy ${debtToIncomeRatio.toFixed(1)}%`
        : debtToIncomeRatio <= THRESHOLDS.CONCERNING_DTI_RATIO
          ? `Your debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}% is approaching concerning levels`
          : `Warning: Your debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}% is critically high`,
      recommendation: debtToIncomeRatio > THRESHOLDS.HEALTHY_DTI_RATIO
        ? 'Focus on paying down high-interest debt first. Consider the snowball method (smallest balances first) or avalanche method (highest interest first) to reduce your debt burden.'
        : 'Your debt is at a manageable level. Consider setting up extra payments toward principal to reduce interest costs over time.',
    },

    // Net Worth Insight
    {
      type: 'net_worth',
      severity: getNetWorthSeverity(netWorth, annualIncome),
      message: netWorth > annualIncome
        ? `Congratulations! Your net worth of $${netWorth.toLocaleString()} exceeds your annual income`
        : netWorth > 0
          ? `Your net worth is $${netWorth.toLocaleString()} - positive, but there's room for growth`
          : `Your net worth is negative at -$${Math.abs(netWorth).toLocaleString()}, which means you owe more than you own`,
      recommendation: netWorth < 0
        ? 'Your financial priority should be shifting to positive net worth. Create a debt reduction plan, avoid taking on more debt, and focus on increasing your income.'
        : netWorth < annualIncome
          ? 'Build wealth by increasing your savings rate and investment contributions. Even small, consistent contributions can grow significantly over time.'
          : "You're building wealth effectively! Consider diversifying your investments and exploring tax-advantaged accounts to protect and grow your assets.",
    },

    // Investment Allocation Insight
    {
      type: 'investments',
      severity: investmentToNetWorthRatio >= THRESHOLDS.EXCELLENT_INVESTMENT_RATIO
        ? 'positive'
        : investmentToNetWorthRatio >= THRESHOLDS.GOOD_INVESTMENT_RATIO
          ? 'warning'
          : 'critical',
      message: investmentToNetWorthRatio >= THRESHOLDS.EXCELLENT_INVESTMENT_RATIO
        ? `Smart move! ${investmentToNetWorthRatio.toFixed(1)}% of your net worth is invested for growth`
        : investmentToNetWorthRatio >= THRESHOLDS.GOOD_INVESTMENT_RATIO
          ? `${investmentToNetWorthRatio.toFixed(1)}% of your net worth is invested, which is a decent start`
          : `Only ${investmentToNetWorthRatio.toFixed(1)}% of your net worth is invested, limiting your future financial growth`,
      recommendation: investmentToNetWorthRatio < THRESHOLDS.EXCELLENT_INVESTMENT_RATIO
        ? 'Consider increasing your investment allocation. Look into low-cost index funds or ETFs for long-term growth with minimal management required.'
        : 'Your investment allocation looks good! Make sure your portfolio is properly diversified across different asset classes to manage risk.',
    },
  ];
}

/**
 * Calculate complete analysis results from financial data
 * This is the main function to use for local/fallback calculations
 */
export function calculateAnalysis(data: FinancialData): AnalysisResults {
  const metrics = calculateMetrics(data);
  const insights = generateInsights(data, metrics);

  return { metrics, insights };
}

/**
 * Validate financial data input
 * Returns validated data or throws ZodError
 */
export function validateFinancialData(data: unknown): FinancialData {
  return FinancialDataSchema.parse(data);
}

/**
 * Safe validation that returns null on failure instead of throwing
 */
export function safeValidateFinancialData(data: unknown): FinancialData | null {
  const result = FinancialDataSchema.safeParse(data);
  return result.success ? result.data : null;
}
