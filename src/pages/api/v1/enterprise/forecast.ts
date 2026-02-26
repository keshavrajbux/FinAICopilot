/**
 * Enterprise API Endpoint: Cash Flow Forecasting
 *
 * POST /api/v1/enterprise/forecast
 *
 * Multi-tenant cash flow projections with scenario modeling.
 * Financial institutions use this to offer "what-if" planning to their customers.
 */

import { NextApiResponse } from 'next';
import {
  withTenantAuth,
  logApiRequest,
  trackApiUsage,
  setCorsHeaders,
  handleCorsPrelight,
} from '@/lib/enterprise';
import type { TenantRequest, TenantConfig } from '@/lib/enterprise';
import {
  CashFlowAgent,
  ForecastRequestSchema,
  computeForecast,
} from '@/lib/product';
import type { CashFlowForecast, ScenarioParams } from '@/lib/product';

async function handleForecast(
  req: TenantRequest,
  res: NextApiResponse,
  tenant: TenantConfig
): Promise<void> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  setCorsHeaders(req, res, tenant);

  if (handleCorsPrelight(req, res, tenant)) {
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST requests are allowed' },
    });
    return;
  }

  try {
    const { userId, financialData, horizonMonths, scenarios } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_USER_ID', message: 'userId is required' },
      });
      return;
    }

    if (!financialData) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FINANCIAL_DATA', message: 'financialData is required' },
      });
      return;
    }

    // Validate forecast request
    let validated;
    try {
      validated = ForecastRequestSchema.parse({
        financialData,
        horizonMonths: horizonMonths ?? 12,
        scenarios: scenarios ?? [{ type: 'baseline' }],
      });
    } catch (validationError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: validationError instanceof Error ? validationError.message : 'Invalid request',
        },
      });
      return;
    }

    // Run forecast
    let forecast: CashFlowForecast;
    try {
      const agent = new CashFlowAgent();
      forecast = await agent.forecast(validated);
    } catch (agentError) {
      console.error('CashFlowAgent failed, using deterministic engine:', agentError);
      forecast = computeForecast(
        validated.financialData,
        validated.horizonMonths,
        validated.scenarios as ScenarioParams[]
      );
    }

    // Audit + usage tracking
    await logApiRequest(
      tenant.id,
      userId,
      'forecast_cashflow',
      'cash_flow_forecast',
      {
        horizonMonths: validated.horizonMonths,
        scenarioCount: validated.scenarios.length,
        scenarioTypes: validated.scenarios.map((s: { type: string }) => s.type),
      },
      req
    );

    await trackApiUsage(tenant.id, {
      requests: 1,
      responseTimeMs: Date.now() - startTime,
    });

    res.status(200).json({
      success: true,
      data: forecast,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('Error in enterprise forecast endpoint:', error);

    await logApiRequest(
      tenant.id,
      req.body?.userId,
      'forecast_cashflow_error',
      'cash_flow_forecast',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      req
    );

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred processing your forecast request',
        requestId,
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    });
  }
}

export default withTenantAuth(handleForecast);
