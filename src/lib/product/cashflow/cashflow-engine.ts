/**
 * Cash Flow Projection Engine
 *
 * Deterministic, month-by-month financial projection.
 * This is the "local calculations" equivalent for forecasting --
 * it always works, needs no AI, and produces the ground-truth numbers.
 *
 * The AI agent adds narrative on top; this engine does the math.
 */

import { FinancialData } from '../analysis/calculations';
import {
  ScenarioParams,
  MonthlyProjection,
  ForecastSummary,
  ScenarioForecast,
  CashFlowForecast,
} from './types';

// ---------------------------------------------------------------------------
// Defaults (based on real-world US averages as of 2025-2026)
// ---------------------------------------------------------------------------

const DEFAULTS = {
  /** Average US credit card APR */
  debtInterestRate: 22.8,
  /** Long-term S&P 500 average annual return */
  investmentReturnRate: 7.0,
  /** High-yield savings account rate */
  savingsReturnRate: 4.5,
  /** Minimum debt payment as % of balance if no explicit payment */
  minDebtPaymentPct: 2.0,
  /** Floor for monthly debt payment */
  minDebtPaymentFloor: 25,
} as const;

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * Project a single scenario forward month by month.
 */
export function projectScenario(
  data: FinancialData,
  scenario: ScenarioParams,
  horizonMonths: number
): ScenarioForecast {
  const monthlyRate = (annual: number) => annual / 100 / 12;

  // Resolve rates
  const debtRate = monthlyRate(scenario.debtInterestRate ?? DEFAULTS.debtInterestRate);
  const investRate = monthlyRate(scenario.investmentReturnRate ?? DEFAULTS.investmentReturnRate);
  const savingsRate = monthlyRate(scenario.savingsReturnRate ?? DEFAULTS.savingsReturnRate);

  // Starting balances
  let savingsBalance = data.savings;
  let investmentBalance = data.investments;
  let debtBalance = data.debt;

  // Determine monthly income/expense based on scenario
  const baseIncome = data.monthlyIncome;
  const baseExpenses = data.monthlyExpenses;
  const baseSurplus = baseIncome - baseExpenses;

  let totalDebtInterestPaid = 0;
  let totalInvestmentReturns = 0;
  let totalSavingsInterest = 0;

  const projections: MonthlyProjection[] = [];
  let monthToDebtFree: number | null = null;
  let monthToPositiveNetWorth: number | null = null;
  const startNetWorth = data.savings + data.investments - data.debt;

  for (let month = 1; month <= horizonMonths; month++) {
    // --- Determine this month's income ---
    let income = baseIncome;
    if (scenario.type === 'income_disruption') {
      const disruptionEnd = scenario.disruptionMonths ?? 3;
      if (month <= disruptionEnd) {
        income = 0;
      }
    }
    if (scenario.type === 'income_boost') {
      income += scenario.additionalIncome ?? 0;
    }

    // --- Determine this month's expenses (unchanged across scenarios) ---
    const expenses = baseExpenses;

    // --- Compute debt interest for this month ---
    const debtInterest = debtBalance > 0 ? debtBalance * debtRate : 0;
    totalDebtInterestPaid += debtInterest;

    // --- Determine debt payment ---
    let debtPayment = 0;
    if (debtBalance > 0) {
      // Minimum payment: max of floor or % of balance
      const minPayment = Math.max(
        DEFAULTS.minDebtPaymentFloor,
        debtBalance * (DEFAULTS.minDebtPaymentPct / 100)
      );

      if (scenario.monthlyDebtPaymentOverride !== undefined) {
        debtPayment = scenario.monthlyDebtPaymentOverride;
      } else if (scenario.type === 'debt_avalanche') {
        // Throw all surplus at debt
        const surplus = Math.max(0, income - expenses);
        debtPayment = Math.max(minPayment, surplus);
      } else if (scenario.type === 'aggressive_saving') {
        // Only pay minimum on debt
        debtPayment = minPayment;
      } else {
        // Baseline: pay minimum + a bit extra if there's surplus
        const surplus = Math.max(0, income - expenses);
        debtPayment = Math.min(minPayment + surplus * 0.3, debtBalance + debtInterest);
      }

      // Can't pay more than what's owed
      debtPayment = Math.min(debtPayment, debtBalance + debtInterest);
    }

    // --- Update debt balance ---
    debtBalance = Math.max(0, debtBalance + debtInterest - debtPayment);

    // Track when debt is paid off
    if (debtBalance === 0 && monthToDebtFree === null && data.debt > 0) {
      monthToDebtFree = month;
    }

    // --- Net cash flow after expenses and debt ---
    const netCashFlow = income - expenses - debtPayment;

    // --- Allocate surplus or deficit ---
    if (netCashFlow >= 0) {
      if (scenario.type === 'aggressive_saving') {
        // 70% to savings, 30% to investments
        savingsBalance += netCashFlow * 0.7;
        investmentBalance += netCashFlow * 0.3;
      } else if (scenario.monthlySavingsOverride !== undefined) {
        const toSavings = Math.min(scenario.monthlySavingsOverride, netCashFlow);
        savingsBalance += toSavings;
        investmentBalance += Math.max(0, netCashFlow - toSavings);
      } else {
        // Default: 60% savings, 40% investments
        savingsBalance += netCashFlow * 0.6;
        investmentBalance += netCashFlow * 0.4;
      }
    } else {
      // Deficit: draw from savings first, then investments
      const deficit = Math.abs(netCashFlow);
      if (savingsBalance >= deficit) {
        savingsBalance -= deficit;
      } else {
        const remaining = deficit - savingsBalance;
        savingsBalance = 0;
        investmentBalance = Math.max(0, investmentBalance - remaining);
      }
    }

    // --- Apply interest/returns on balances ---
    const savingsInterest = savingsBalance * savingsRate;
    savingsBalance += savingsInterest;
    totalSavingsInterest += savingsInterest;

    const investReturn = investmentBalance * investRate;
    investmentBalance += investReturn;
    totalInvestmentReturns += investReturn;

    // --- Net worth ---
    const netWorth = savingsBalance + investmentBalance - debtBalance;

    if (startNetWorth <= 0 && netWorth > 0 && monthToPositiveNetWorth === null) {
      monthToPositiveNetWorth = month;
    }

    projections.push({
      month,
      income: round2(income),
      expenses: round2(expenses),
      debtPayment: round2(debtPayment),
      netCashFlow: round2(netCashFlow),
      savingsBalance: round2(savingsBalance),
      investmentBalance: round2(investmentBalance),
      debtBalance: round2(debtBalance),
      netWorth: round2(netWorth),
    });
  }

  // --- Summary ---
  const endProjection = projections[projections.length - 1];
  const endNetWorth = endProjection.netWorth;

  // Runway: months of expenses covered by current liquid assets
  const monthlyBurn = baseExpenses;
  const liquidAssets = data.savings + data.investments;
  const runwayMonths = monthlyBurn > 0 ? Math.floor(liquidAssets / monthlyBurn) : 999;

  // Stress score: 0-100
  const stressScore = calculateStressScore(data, endProjection, runwayMonths, projections);

  const summary: ForecastSummary = {
    monthsToDebtFree: monthToDebtFree,
    runwayMonths,
    endNetWorth: round2(endNetWorth),
    netWorthDelta: round2(endNetWorth - startNetWorth),
    totalDebtInterestPaid: round2(totalDebtInterestPaid),
    totalInvestmentReturns: round2(totalInvestmentReturns),
    totalSavingsInterest: round2(totalSavingsInterest),
    monthToPositiveNetWorth: monthToPositiveNetWorth,
    stressScore,
  };

  return { scenario, projections, summary };
}

/**
 * Run the full forecast engine across all requested scenarios.
 */
export function computeForecast(
  data: FinancialData,
  horizonMonths: number,
  scenarios: ScenarioParams[]
): CashFlowForecast {
  const scenarioForecasts = scenarios.map((s) => projectScenario(data, s, horizonMonths));

  return {
    currentState: data,
    horizonMonths,
    scenarios: scenarioForecasts,
    insights: [], // Insights are added by the AI agent layer
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Stress Score
// ---------------------------------------------------------------------------

/**
 * Financial stress score: 0 (safe) → 100 (critical).
 *
 * Factors:
 * - Savings runway (how many months can you survive without income?)
 * - Debt-to-income ratio
 * - Net cash flow trajectory (are things getting better or worse?)
 * - Net worth trajectory
 */
function calculateStressScore(
  data: FinancialData,
  endProjection: MonthlyProjection,
  runwayMonths: number,
  projections: MonthlyProjection[]
): number {
  let score = 0;

  // 1. Runway (0-30 points): < 1 month = 30, 1-3 = 20, 3-6 = 10, 6+ = 0
  if (runwayMonths < 1) score += 30;
  else if (runwayMonths < 3) score += 20;
  else if (runwayMonths < 6) score += 10;

  // 2. DTI ratio (0-25 points)
  const annualIncome = data.monthlyIncome * 12;
  const dti = annualIncome > 0 ? (data.debt / annualIncome) * 100 : 100;
  if (dti > 50) score += 25;
  else if (dti > 36) score += 15;
  else if (dti > 20) score += 5;

  // 3. Cash flow trajectory (0-25 points): is net cash flow declining?
  if (projections.length >= 3) {
    const first3Avg = (projections[0].netCashFlow + projections[1].netCashFlow + projections[2].netCashFlow) / 3;
    const last3 = projections.slice(-3);
    const last3Avg = (last3[0].netCashFlow + last3[1].netCashFlow + last3[2].netCashFlow) / 3;
    if (last3Avg < 0) score += 25;
    else if (last3Avg < first3Avg * 0.5) score += 15;
    else if (last3Avg < first3Avg) score += 5;
  }

  // 4. Net worth direction (0-20 points)
  const startNW = data.savings + data.investments - data.debt;
  if (endProjection.netWorth < startNW) {
    score += endProjection.netWorth < 0 ? 20 : 10;
  }

  return Math.min(100, Math.max(0, score));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
