import {
  calculateMetrics,
  calculateAnalysis,
  validateFinancialData,
  safeValidateFinancialData,
  generateInsights,
  THRESHOLDS,
  FinancialData,
} from '@/lib/calculations';

describe('Financial Calculations', () => {
  const validData: FinancialData = {
    monthlyIncome: 5000,
    monthlyExpenses: 3000,
    savings: 15000,
    investments: 25000,
    debt: 10000,
  };

  describe('calculateMetrics', () => {
    it('should calculate monthly savings correctly', () => {
      const metrics = calculateMetrics(validData);
      expect(metrics.monthlySavings).toBe(2000); // 5000 - 3000
    });

    it('should calculate savings rate correctly', () => {
      const metrics = calculateMetrics(validData);
      expect(metrics.savingsRate).toBe(40); // (2000 / 5000) * 100
    });

    it('should calculate net worth correctly', () => {
      const metrics = calculateMetrics(validData);
      expect(metrics.netWorth).toBe(30000); // 15000 + 25000 - 10000
    });

    it('should calculate emergency fund months correctly', () => {
      const metrics = calculateMetrics(validData);
      expect(metrics.emergencyFundMonths).toBe(5); // 15000 / 3000
    });

    it('should calculate debt-to-income ratio correctly', () => {
      const metrics = calculateMetrics(validData);
      // (10000 / (5000 * 12)) * 100 = 16.67%
      expect(metrics.debtToIncomeRatio).toBeCloseTo(16.67, 1);
    });

    it('should handle zero income without dividing by zero', () => {
      const zeroIncomeData: FinancialData = {
        ...validData,
        monthlyIncome: 0,
      };
      const metrics = calculateMetrics(zeroIncomeData);
      expect(metrics.savingsRate).toBe(0);
      expect(metrics.debtToIncomeRatio).toBe(0);
    });

    it('should handle zero expenses without dividing by zero', () => {
      const zeroExpenseData: FinancialData = {
        ...validData,
        monthlyExpenses: 0,
      };
      const metrics = calculateMetrics(zeroExpenseData);
      expect(metrics.emergencyFundMonths).toBe(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights for healthy finances', () => {
      const metrics = calculateMetrics(validData);
      const insights = generateInsights(validData, metrics);

      expect(insights).toHaveLength(5);
      expect(insights.map(i => i.type)).toEqual([
        'savings_rate',
        'emergency_fund',
        'debt_ratio',
        'net_worth',
        'investments',
      ]);
    });

    it('should mark excellent savings rate as positive', () => {
      const metrics = calculateMetrics(validData);
      const insights = generateInsights(validData, metrics);
      const savingsInsight = insights.find(i => i.type === 'savings_rate');

      expect(savingsInsight?.severity).toBe('positive');
    });

    it('should mark low emergency fund as critical', () => {
      const lowSavingsData: FinancialData = {
        ...validData,
        savings: 1000, // Only 0.33 months
      };
      const metrics = calculateMetrics(lowSavingsData);
      const insights = generateInsights(lowSavingsData, metrics);
      const emergencyInsight = insights.find(i => i.type === 'emergency_fund');

      expect(emergencyInsight?.severity).toBe('critical');
    });

    it('should mark high debt ratio as critical', () => {
      const highDebtData: FinancialData = {
        ...validData,
        debt: 100000, // Very high relative to income
      };
      const metrics = calculateMetrics(highDebtData);
      const insights = generateInsights(highDebtData, metrics);
      const debtInsight = insights.find(i => i.type === 'debt_ratio');

      expect(debtInsight?.severity).toBe('critical');
    });
  });

  describe('calculateAnalysis', () => {
    it('should return both metrics and insights', () => {
      const analysis = calculateAnalysis(validData);

      expect(analysis).toHaveProperty('metrics');
      expect(analysis).toHaveProperty('insights');
      expect(analysis.metrics).toHaveProperty('savingsRate');
      expect(analysis.insights.length).toBeGreaterThan(0);
    });
  });

  describe('validateFinancialData', () => {
    it('should accept valid data', () => {
      expect(() => validateFinancialData(validData)).not.toThrow();
    });

    it('should reject negative values', () => {
      const negativeData = { ...validData, monthlyIncome: -1000 };
      expect(() => validateFinancialData(negativeData)).toThrow();
    });

    it('should reject values exceeding maximum', () => {
      const hugeData = { ...validData, monthlyIncome: THRESHOLDS.MAX_MONETARY_VALUE + 1 };
      expect(() => validateFinancialData(hugeData)).toThrow();
    });

    it('should reject non-numeric values', () => {
      const invalidData = { ...validData, monthlyIncome: 'not a number' };
      expect(() => validateFinancialData(invalidData)).toThrow();
    });

    it('should reject missing fields', () => {
      const incompleteData = { monthlyIncome: 5000 };
      expect(() => validateFinancialData(incompleteData)).toThrow();
    });
  });

  describe('safeValidateFinancialData', () => {
    it('should return data for valid input', () => {
      const result = safeValidateFinancialData(validData);
      expect(result).toEqual(validData);
    });

    it('should return null for invalid input', () => {
      const result = safeValidateFinancialData({ invalid: true });
      expect(result).toBeNull();
    });
  });

  describe('THRESHOLDS', () => {
    it('should have expected threshold values', () => {
      expect(THRESHOLDS.EXCELLENT_SAVINGS_RATE).toBe(20);
      expect(THRESHOLDS.EXCELLENT_EMERGENCY_FUND).toBe(6);
      expect(THRESHOLDS.HEALTHY_DTI_RATIO).toBe(36);
    });
  });
});
