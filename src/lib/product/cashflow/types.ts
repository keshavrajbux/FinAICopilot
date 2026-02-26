/**
 * Cash Flow Forecasting Types
 *
 * Domain types for forward-looking financial projections.
 * Designed around real banking consumer needs:
 *   - "When will I be debt-free?"
 *   - "How many months can I survive a job loss?"
 *   - "What if I boost my savings rate?"
 */

import { z } from 'zod';
import { FinancialData, FinancialDataSchema } from '../analysis/calculations';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** A scenario describes a "what-if" adjustment to the baseline forecast */
export type ScenarioType =
  | 'baseline'             // No changes -- current trajectory
  | 'aggressive_saving'    // Increase savings rate to 20%+
  | 'debt_avalanche'       // Redirect surplus toward highest-rate debt
  | 'income_disruption'    // Simulate N months of lost income
  | 'income_boost'         // Simulate a raise or side income
  | 'custom';              // User-supplied adjustments

export interface ScenarioParams {
  type: ScenarioType;
  /** For income_disruption: how many months of zero income */
  disruptionMonths?: number;
  /** For income_boost: monthly amount of additional income */
  additionalIncome?: number;
  /** For custom: override monthly savings amount */
  monthlySavingsOverride?: number;
  /** For custom: override monthly debt payment */
  monthlyDebtPaymentOverride?: number;
  /** Annual interest rate on debt (default 18% for credit card) */
  debtInterestRate?: number;
  /** Annual return rate on investments (default 7% for index funds) */
  investmentReturnRate?: number;
  /** Annual return rate on savings (default 4.5% for HYSA) */
  savingsReturnRate?: number;
}

export const ForecastRequestSchema = z.object({
  financialData: FinancialDataSchema,
  horizonMonths: z.number().int().min(1).max(120).default(12),
  scenarios: z.array(z.object({
    type: z.enum([
      'baseline', 'aggressive_saving', 'debt_avalanche',
      'income_disruption', 'income_boost', 'custom',
    ]),
    disruptionMonths: z.number().int().min(1).max(24).optional(),
    additionalIncome: z.number().min(0).optional(),
    monthlySavingsOverride: z.number().optional(),
    monthlyDebtPaymentOverride: z.number().min(0).optional(),
    debtInterestRate: z.number().min(0).max(100).optional(),
    investmentReturnRate: z.number().min(-50).max(100).optional(),
    savingsReturnRate: z.number().min(0).max(100).optional(),
  })).min(1).max(5).default([{ type: 'baseline' }]),
});

export type ForecastRequest = z.infer<typeof ForecastRequestSchema>;

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** One month of projected state */
export interface MonthlyProjection {
  month: number;                  // 1-indexed month in the forecast
  income: number;
  expenses: number;
  debtPayment: number;            // Payment toward debt principal + interest
  netCashFlow: number;            // Income - expenses - debtPayment
  savingsBalance: number;         // Running savings total (includes interest)
  investmentBalance: number;      // Running investment total (includes returns)
  debtBalance: number;            // Remaining debt (decreasing)
  netWorth: number;               // savings + investments - debt
}

/** Summary metrics for a single scenario's projection */
export interface ForecastSummary {
  /** Months until debt reaches $0 (null if never within horizon) */
  monthsToDebtFree: number | null;
  /** Months until savings would run out at current burn rate if income stops */
  runwayMonths: number;
  /** Projected net worth at end of horizon */
  endNetWorth: number;
  /** Projected net worth change over the horizon */
  netWorthDelta: number;
  /** Projected total interest paid on debt over the horizon */
  totalDebtInterestPaid: number;
  /** Projected total investment returns over the horizon */
  totalInvestmentReturns: number;
  /** Projected total savings interest earned over the horizon */
  totalSavingsInterest: number;
  /** Month in which net worth first turns positive (null if already positive or never) */
  monthToPositiveNetWorth: number | null;
  /** Financial stress score: 0 (safe) to 100 (critical) */
  stressScore: number;
}

/** A complete forecast for one scenario */
export interface ScenarioForecast {
  scenario: ScenarioParams;
  projections: MonthlyProjection[];
  summary: ForecastSummary;
}

/** AI-generated narrative insight about a forecast */
export interface ForecastInsight {
  headline: string;
  explanation: string;
  actionItem: string;
  urgency: 'low' | 'medium' | 'high';
}

/** The full output of the forecasting agent */
export interface CashFlowForecast {
  /** Original input data snapshot */
  currentState: FinancialData;
  /** Horizon in months */
  horizonMonths: number;
  /** One forecast per requested scenario */
  scenarios: ScenarioForecast[];
  /** AI-generated insights comparing scenarios (empty if AI unavailable) */
  insights: ForecastInsight[];
  /** When the forecast was generated */
  generatedAt: string;
}
