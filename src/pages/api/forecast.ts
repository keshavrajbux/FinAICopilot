/**
 * POST /api/forecast
 *
 * Cash Flow Forecasting endpoint for consumer users.
 * Projects finances forward with scenario modeling and AI insights.
 *
 * Request body:
 * {
 *   "financialData": { monthlyIncome, monthlyExpenses, savings, investments, debt },
 *   "horizonMonths": 12,           // optional, default 12, max 120
 *   "scenarios": [                  // optional, default [{ type: "baseline" }]
 *     { "type": "baseline" },
 *     { "type": "aggressive_saving" },
 *     { "type": "debt_avalanche" },
 *     { "type": "income_disruption", "disruptionMonths": 3 }
 *   ]
 * }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { CashFlowAgent, ForecastRequestSchema } from '@/lib/product';
import {
  getAuthenticatedUser,
  setCorsHeaders,
  handleCorsPrelight,
  sendErrorResponse,
  sendUnauthorized,
  sendMethodNotAllowed,
} from '@/lib/api-utils';
import { applyRateLimit, AI_RATE_LIMIT } from '@/lib/rate-limit';
import { ZodError } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(req, res);

  if (handleCorsPrelight(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  if (applyRateLimit(req, res, AI_RATE_LIMIT)) {
    return;
  }

  try {
    // Auth (same pattern as analyze-finances)
    const { userId } = await getAuthenticatedUser(req, res);

    if (!userId && process.env.NODE_ENV === 'production') {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Validate request
    let forecastRequest;
    try {
      forecastRequest = ForecastRequestSchema.parse(req.body);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return sendErrorResponse(
          res,
          400,
          'Invalid forecast request: ' + validationError.errors.map(e => e.message).join(', ')
        );
      }
      return sendErrorResponse(res, 400, 'Invalid request format');
    }

    // Run the forecasting agent
    const agent = new CashFlowAgent();
    const forecast = await agent.forecast(forecastRequest);

    return res.status(200).json({
      success: true,
      data: forecast,
      _meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Attempt deterministic fallback
    try {
      const { computeForecast } = await import('@/lib/product');
      const validated = ForecastRequestSchema.parse(req.body);
      const forecast = computeForecast(
        validated.financialData,
        validated.horizonMonths,
        validated.scenarios as any[]
      );

      return res.status(200).json({
        success: true,
        data: forecast,
        _meta: {
          timestamp: new Date().toISOString(),
          fallback: true,
        },
      });
    } catch {
      return sendErrorResponse(res, 500, 'Unable to process forecast request', error);
    }
  }
}
