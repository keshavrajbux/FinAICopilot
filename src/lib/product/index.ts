/**
 * Product Layer - FinAI Copilot (Fintech)
 *
 * Domain-specific financial analysis features built on the core orchestration framework.
 *
 * RULES:
 * - product/ imports from core/ (the orchestrator)
 * - product/ NEVER imports from enterprise/
 * - enterprise/ imports from product/ to add multi-tenancy on top
 */

export {
  FinancialAnalysisAgent,
  calculateAnalysis,
  calculateMetrics,
  generateInsights,
  validateFinancialData,
  safeValidateFinancialData,
  FinancialDataSchema,
  THRESHOLDS,
} from './analysis';

export type {
  FinancialData,
  AnalysisResults,
  FinancialMetrics,
  FinancialInsight,
  InsightSeverity,
} from './analysis';
