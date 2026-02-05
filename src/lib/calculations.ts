/**
 * Backward-compatibility re-export
 *
 * The canonical location for financial calculations is now:
 *   @/lib/product/analysis/calculations
 *
 * This file re-exports everything so existing imports continue to work.
 */

export {
  THRESHOLDS,
  FinancialDataSchema,
  calculateMetrics,
  generateInsights,
  calculateAnalysis,
  validateFinancialData,
  safeValidateFinancialData,
} from './product/analysis/calculations';

export type {
  FinancialData,
  InsightSeverity,
  FinancialInsight,
  FinancialMetrics,
  AnalysisResults,
} from './product/analysis/calculations';
