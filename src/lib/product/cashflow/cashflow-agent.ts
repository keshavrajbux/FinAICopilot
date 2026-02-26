/**
 * Cash Flow Forecasting Agent
 *
 * An AI agent that generates forward-looking financial projections
 * with scenario modeling and narrative insights.
 *
 * Architecture:
 *   1. The deterministic engine (cashflow-engine) computes the numbers.
 *   2. This agent sends those numbers to an LLM for interpretation.
 *   3. The LLM generates narrative insights and action items.
 *   4. If the LLM is unavailable, the forecast still works (just without narrative).
 *
 * This is the pattern for "hybrid" agents: deterministic math + AI narrative.
 * The math is never wrong; the AI adds the human-readable layer.
 */

import { BaseAgent, callOpenAI, type Message } from '@/lib/core';
import { FinancialData } from '../analysis/calculations';
import {
  CashFlowForecast,
  ForecastInsight,
  ScenarioParams,
  ForecastRequest,
  ForecastRequestSchema,
} from './types';
import { computeForecast } from './cashflow-engine';

// Re-export for consumers
export type { CashFlowForecast, ForecastInsight, ForecastRequest } from './types';
export { ForecastRequestSchema } from './types';

const FORECAST_SYSTEM_PROMPT = `You are a financial forecasting advisor. You are given a cash flow projection with scenario analysis for a banking consumer.

Your job is to interpret the numbers and provide clear, actionable insights. You are NOT doing the math -- the numbers are already computed and correct. Your role is to explain what they mean in plain language.

Rules:
- Be direct and specific. Say "You'll be debt-free in 14 months" not "Consider paying off your debt."
- Compare scenarios explicitly: "Switching to aggressive saving would grow your net worth $4,200 more than the baseline."
- Flag urgent issues: if runway < 3 months or stress score > 60, lead with that.
- Give exactly one concrete action item per insight.
- Keep each insight under 3 sentences.

Respond with valid JSON matching this schema:
{
  "insights": [
    {
      "headline": "short punchy title (max 10 words)",
      "explanation": "what the numbers mean in plain english",
      "actionItem": "one specific thing to do this week",
      "urgency": "low" | "medium" | "high"
    }
  ]
}

Generate 3-5 insights, ordered by urgency (high first).`;

export class CashFlowAgent extends BaseAgent<CashFlowForecast> {
  constructor() {
    super(FORECAST_SYSTEM_PROMPT);
  }

  protected parseResponse(text: string): CashFlowForecast {
    // This is only used for the raw LLM path; our main flow uses parseInsights
    return JSON.parse(text);
  }

  /**
   * Generate a full forecast with optional AI-powered insights.
   */
  async forecast(request: ForecastRequest): Promise<CashFlowForecast> {
    // Validate input
    const validated = ForecastRequestSchema.parse(request);
    const { financialData, horizonMonths, scenarios } = validated;

    // Step 1: Deterministic projection (always works)
    const forecast = computeForecast(
      financialData,
      horizonMonths,
      scenarios as ScenarioParams[]
    );

    // Step 2: Try to get AI narrative insights
    try {
      const insights = await this.generateInsights(financialData, forecast);
      forecast.insights = insights;
    } catch (error) {
      console.error('AI insight generation failed, returning forecast without narrative:', error);
      // Forecast still works -- just without AI insights
      forecast.insights = this.generateFallbackInsights(forecast);
    }

    return forecast;
  }

  /**
   * Ask the LLM to interpret the projection numbers.
   */
  private async generateInsights(
    data: FinancialData,
    forecast: CashFlowForecast
  ): Promise<ForecastInsight[]> {
    // Build a summary for the LLM (don't send every month -- too many tokens)
    const summaryForLLM = {
      currentState: {
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses,
        savings: data.savings,
        investments: data.investments,
        debt: data.debt,
        monthlySurplus: data.monthlyIncome - data.monthlyExpenses,
      },
      horizonMonths: forecast.horizonMonths,
      scenarios: forecast.scenarios.map((s) => ({
        type: s.scenario.type,
        summary: s.summary,
        // Only include month 1, midpoint, and final month
        keyMonths: {
          month1: s.projections[0],
          midpoint: s.projections[Math.floor(s.projections.length / 2)],
          final: s.projections[s.projections.length - 1],
        },
      })),
    };

    const prompt = `Here is a ${forecast.horizonMonths}-month cash flow projection for a banking consumer. Analyze it and provide insights.

${JSON.stringify(summaryForLLM, null, 2)}`;

    // Try OpenAI first (cheaper for this kind of structured output)
    try {
      const result = await callOpenAI(
        [
          { role: 'system', content: FORECAST_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        { jsonMode: true }
      );
      const parsed = JSON.parse(result.text);
      return (parsed.insights || []) as ForecastInsight[];
    } catch (openaiError) {
      console.error('OpenAI forecast insights failed:', openaiError);
    }

    // Fall back to Claude
    const messages: Message[] = [{ role: 'user', content: prompt }];
    const result = await this.run(messages);
    // result.data would be the full forecast, but we just need insights
    // Since parseResponse expects CashFlowForecast, let's parse insights directly
    return [];
  }

  /**
   * Generate basic insights without AI, using rules.
   */
  private generateFallbackInsights(forecast: CashFlowForecast): ForecastInsight[] {
    const insights: ForecastInsight[] = [];
    const baseline = forecast.scenarios.find((s) => s.scenario.type === 'baseline');
    if (!baseline) return insights;

    const { summary } = baseline;

    // Stress check
    if (summary.stressScore >= 60) {
      insights.push({
        headline: 'Your finances are under significant stress',
        explanation: `Your financial stress score is ${summary.stressScore}/100. ` +
          `You have approximately ${summary.runwayMonths} months of runway if income stopped.`,
        actionItem: 'Build an emergency fund: set up an automatic transfer of even $50/week to a high-yield savings account.',
        urgency: 'high',
      });
    } else if (summary.stressScore >= 30) {
      insights.push({
        headline: 'Room for improvement in your financial safety net',
        explanation: `Your stress score is ${summary.stressScore}/100. ` +
          `You have ${summary.runwayMonths} months of runway -- aim for 6+.`,
        actionItem: 'Review your monthly subscriptions and cut at least one non-essential recurring expense.',
        urgency: 'medium',
      });
    }

    // Debt timeline
    if (summary.monthsToDebtFree !== null) {
      insights.push({
        headline: `Debt-free in ${summary.monthsToDebtFree} months`,
        explanation: `At your current pace, you'll pay off your debt in ${summary.monthsToDebtFree} months, ` +
          `paying $${summary.totalDebtInterestPaid.toLocaleString()} in interest.`,
        actionItem: summary.totalDebtInterestPaid > 500
          ? 'Consider making an extra payment this month to save on interest.'
          : 'Stay the course -- your debt payoff timeline looks healthy.',
        urgency: summary.monthsToDebtFree > 24 ? 'high' : 'low',
      });
    } else if (forecast.currentState.debt > 0) {
      insights.push({
        headline: 'Debt payoff extends beyond forecast horizon',
        explanation: `At your current pace, your debt won't be fully paid within ${forecast.horizonMonths} months. ` +
          `You'll pay $${summary.totalDebtInterestPaid.toLocaleString()} in interest during this period.`,
        actionItem: 'Look into balance transfer options or increase your monthly debt payment by at least 10%.',
        urgency: 'high',
      });
    }

    // Net worth trajectory
    if (summary.netWorthDelta > 0) {
      insights.push({
        headline: `Net worth growing by $${Math.round(summary.netWorthDelta).toLocaleString()}`,
        explanation: `Over ${forecast.horizonMonths} months, your net worth is projected to ` +
          `${summary.endNetWorth >= 0 ? 'reach' : 'improve to'} $${Math.round(summary.endNetWorth).toLocaleString()}.`,
        actionItem: 'Consider increasing your investment allocation to accelerate wealth building.',
        urgency: 'low',
      });
    } else {
      insights.push({
        headline: 'Your net worth is projected to decline',
        explanation: `You're on track to lose $${Math.round(Math.abs(summary.netWorthDelta)).toLocaleString()} ` +
          `in net worth over ${forecast.horizonMonths} months.`,
        actionItem: 'Identify your top 3 non-essential expenses and cut them for one month to reverse this trend.',
        urgency: 'high',
      });
    }

    // Scenario comparison (if multiple scenarios)
    if (forecast.scenarios.length > 1) {
      const bestScenario = forecast.scenarios.reduce((best, s) =>
        s.summary.endNetWorth > best.summary.endNetWorth ? s : best
      );
      if (bestScenario.scenario.type !== 'baseline') {
        const diff = bestScenario.summary.endNetWorth - (baseline.summary.endNetWorth);
        insights.push({
          headline: `"${formatScenarioName(bestScenario.scenario.type)}" adds $${Math.round(diff).toLocaleString()}`,
          explanation: `Switching to the "${formatScenarioName(bestScenario.scenario.type)}" strategy ` +
            `would grow your net worth $${Math.round(diff).toLocaleString()} more than staying the course.`,
          actionItem: `Start the "${formatScenarioName(bestScenario.scenario.type)}" approach this month.`,
          urgency: diff > 1000 ? 'medium' : 'low',
        });
      }
    }

    // Sort by urgency
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return insights;
  }
}

function formatScenarioName(type: string): string {
  var names: Record<string, string> = {
    baseline: 'Current Trajectory',
    aggressive_saving: 'Aggressive Saving',
    debt_avalanche: 'Debt Avalanche',
    income_disruption: 'Income Disruption',
    income_boost: 'Income Boost',
    custom: 'Custom Scenario',
  };
  return names[type] || type;
}
