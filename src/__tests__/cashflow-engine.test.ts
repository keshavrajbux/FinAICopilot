import { projectScenario, computeForecast } from '@/lib/product/cashflow/cashflow-engine';
import { FinancialData } from '@/lib/calculations';
import { ScenarioParams } from '@/lib/product/cashflow/types';

/**
 * Tests for the deterministic cash flow projection engine.
 *
 * These validate the math, not the AI narrative -- the engine
 * is the ground truth that the LLM interprets.
 */

const sampleData: FinancialData = {
  monthlyIncome: 6000,
  monthlyExpenses: 4000,
  savings: 12000,
  investments: 20000,
  debt: 15000,
};

const healthyData: FinancialData = {
  monthlyIncome: 8000,
  monthlyExpenses: 3500,
  savings: 30000,
  investments: 50000,
  debt: 0,
};

const stressedData: FinancialData = {
  monthlyIncome: 3000,
  monthlyExpenses: 2800,
  savings: 500,
  investments: 0,
  debt: 25000,
};

describe('Cash Flow Projection Engine', () => {

  describe('projectScenario - baseline', () => {
    const baseline: ScenarioParams = { type: 'baseline' };

    it('produces the correct number of monthly projections', () => {
      const result = projectScenario(sampleData, baseline, 12);
      expect(result.projections).toHaveLength(12);
      expect(result.projections[0].month).toBe(1);
      expect(result.projections[11].month).toBe(12);
    });

    it('has non-negative savings and investment balances', () => {
      const result = projectScenario(sampleData, baseline, 24);
      for (const p of result.projections) {
        expect(p.savingsBalance).toBeGreaterThanOrEqual(0);
        expect(p.investmentBalance).toBeGreaterThanOrEqual(0);
      }
    });

    it('has non-negative debt balance', () => {
      const result = projectScenario(sampleData, baseline, 60);
      for (const p of result.projections) {
        expect(p.debtBalance).toBeGreaterThanOrEqual(0);
      }
    });

    it('net worth = savings + investments - debt at every month', () => {
      const result = projectScenario(sampleData, baseline, 12);
      for (const p of result.projections) {
        const expected = p.savingsBalance + p.investmentBalance - p.debtBalance;
        expect(p.netWorth).toBeCloseTo(expected, 1);
      }
    });

    it('income and expenses are correct each month', () => {
      const result = projectScenario(sampleData, baseline, 6);
      for (const p of result.projections) {
        expect(p.income).toBe(6000);
        expect(p.expenses).toBe(4000);
      }
    });
  });

  describe('projectScenario - debt_avalanche', () => {
    it('pays off debt faster than baseline', () => {
      const baseline = projectScenario(sampleData, { type: 'baseline' }, 60);
      const avalanche = projectScenario(sampleData, { type: 'debt_avalanche' }, 60);

      // Debt avalanche should reach zero debt sooner
      const baselineDebtFree = baseline.summary.monthsToDebtFree;
      const avalancheDebtFree = avalanche.summary.monthsToDebtFree;

      // Both should eventually be debt free in 60 months
      expect(avalancheDebtFree).not.toBeNull();

      // Avalanche should be equal or faster
      if (baselineDebtFree !== null && avalancheDebtFree !== null) {
        expect(avalancheDebtFree).toBeLessThanOrEqual(baselineDebtFree);
      }
    });

    it('pays less total interest than baseline', () => {
      const baseline = projectScenario(sampleData, { type: 'baseline' }, 60);
      const avalanche = projectScenario(sampleData, { type: 'debt_avalanche' }, 60);

      expect(avalanche.summary.totalDebtInterestPaid)
        .toBeLessThanOrEqual(baseline.summary.totalDebtInterestPaid);
    });
  });

  describe('projectScenario - aggressive_saving', () => {
    it('results in higher savings balance than baseline', () => {
      const baseline = projectScenario(healthyData, { type: 'baseline' }, 12);
      const aggressive = projectScenario(healthyData, { type: 'aggressive_saving' }, 12);

      const baselineFinalSavings = baseline.projections[11].savingsBalance;
      const aggressiveFinalSavings = aggressive.projections[11].savingsBalance;

      expect(aggressiveFinalSavings).toBeGreaterThan(baselineFinalSavings);
    });
  });

  describe('projectScenario - income_disruption', () => {
    it('sets income to 0 for the disruption period', () => {
      const result = projectScenario(sampleData, {
        type: 'income_disruption',
        disruptionMonths: 3,
      }, 6);

      // First 3 months: no income
      expect(result.projections[0].income).toBe(0);
      expect(result.projections[1].income).toBe(0);
      expect(result.projections[2].income).toBe(0);

      // Month 4+: income returns
      expect(result.projections[3].income).toBe(6000);
      expect(result.projections[4].income).toBe(6000);
    });

    it('draws down savings during disruption', () => {
      const result = projectScenario(sampleData, {
        type: 'income_disruption',
        disruptionMonths: 2,
      }, 6);

      // Savings should decrease in the first 2 months
      expect(result.projections[1].savingsBalance).toBeLessThan(sampleData.savings);
    });
  });

  describe('projectScenario - income_boost', () => {
    it('adds extra income each month', () => {
      const result = projectScenario(sampleData, {
        type: 'income_boost',
        additionalIncome: 1000,
      }, 6);

      expect(result.projections[0].income).toBe(7000);
      expect(result.projections[5].income).toBe(7000);
    });

    it('results in higher net worth than baseline', () => {
      const baseline = projectScenario(sampleData, { type: 'baseline' }, 12);
      const boosted = projectScenario(sampleData, {
        type: 'income_boost',
        additionalIncome: 1500,
      }, 12);

      expect(boosted.summary.endNetWorth).toBeGreaterThan(baseline.summary.endNetWorth);
    });
  });

  describe('ForecastSummary', () => {
    it('calculates runway months correctly', () => {
      const result = projectScenario(sampleData, { type: 'baseline' }, 12);
      // Runway = (savings + investments) / monthly expenses = (12000 + 20000) / 4000 = 8
      expect(result.summary.runwayMonths).toBe(8);
    });

    it('runway is 0 for someone with no assets', () => {
      const noAssets: FinancialData = {
        monthlyIncome: 3000,
        monthlyExpenses: 2500,
        savings: 0,
        investments: 0,
        debt: 5000,
      };
      const result = projectScenario(noAssets, { type: 'baseline' }, 12);
      expect(result.summary.runwayMonths).toBe(0);
    });

    it('stress score is high for stressed finances', () => {
      const result = projectScenario(stressedData, { type: 'baseline' }, 12);
      expect(result.summary.stressScore).toBeGreaterThan(40);
    });

    it('stress score is low for healthy finances', () => {
      const result = projectScenario(healthyData, { type: 'baseline' }, 12);
      expect(result.summary.stressScore).toBeLessThanOrEqual(20);
    });

    it('tracks total interest paid on debt', () => {
      const result = projectScenario(sampleData, { type: 'baseline' }, 12);
      expect(result.summary.totalDebtInterestPaid).toBeGreaterThan(0);
    });

    it('tracks investment returns', () => {
      const result = projectScenario(healthyData, { type: 'baseline' }, 12);
      expect(result.summary.totalInvestmentReturns).toBeGreaterThan(0);
    });

    it('tracks savings interest', () => {
      const result = projectScenario(healthyData, { type: 'baseline' }, 12);
      expect(result.summary.totalSavingsInterest).toBeGreaterThan(0);
    });
  });

  describe('computeForecast', () => {
    it('produces a forecast for each requested scenario', () => {
      const forecast = computeForecast(sampleData, 12, [
        { type: 'baseline' },
        { type: 'aggressive_saving' },
        { type: 'debt_avalanche' },
      ]);

      expect(forecast.scenarios).toHaveLength(3);
      expect(forecast.scenarios[0].scenario.type).toBe('baseline');
      expect(forecast.scenarios[1].scenario.type).toBe('aggressive_saving');
      expect(forecast.scenarios[2].scenario.type).toBe('debt_avalanche');
    });

    it('includes current state and metadata', () => {
      const forecast = computeForecast(sampleData, 6, [{ type: 'baseline' }]);

      expect(forecast.currentState).toEqual(sampleData);
      expect(forecast.horizonMonths).toBe(6);
      expect(forecast.generatedAt).toBeDefined();
      expect(forecast.insights).toEqual([]); // Engine doesn't generate insights
    });

    it('handles zero-income edge case', () => {
      const noIncome: FinancialData = {
        monthlyIncome: 0,
        monthlyExpenses: 2000,
        savings: 10000,
        investments: 5000,
        debt: 3000,
      };

      const forecast = computeForecast(noIncome, 12, [{ type: 'baseline' }]);
      const final = forecast.scenarios[0].projections[11];

      // Should draw down savings
      expect(final.savingsBalance).toBeLessThan(10000);
      // Net worth should decrease
      expect(forecast.scenarios[0].summary.netWorthDelta).toBeLessThan(0);
    });
  });

  describe('custom scenario with debt interest rate', () => {
    it('higher interest rate means more interest paid', () => {
      const lowRate = projectScenario(sampleData, {
        type: 'custom',
        debtInterestRate: 5,
      }, 12);

      const highRate = projectScenario(sampleData, {
        type: 'custom',
        debtInterestRate: 30,
      }, 12);

      expect(highRate.summary.totalDebtInterestPaid)
        .toBeGreaterThan(lowRate.summary.totalDebtInterestPaid);
    });
  });
});
