import { NextApiRequest, NextApiResponse } from 'next';
import {
  FinancialAnalysisAgent,
  validateFinancialData,
  calculateAnalysis,
} from '@/lib/product';
import type { AnalysisResults, FinancialData } from '@/lib/product';
import { supabaseAdmin } from '@/lib/supabase-admin';
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

/**
 * POST /api/analyze-finances
 *
 * Analyzes financial data and returns insights.
 * Requires authentication in production.
 * Saves data to database if available.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers (secure, origin-checked)
  setCorsHeaders(req, res);

  // Handle preflight
  if (handleCorsPrelight(req, res)) {
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  // Apply rate limiting (AI endpoints have stricter limits)
  if (applyRateLimit(req, res, AI_RATE_LIMIT)) {
    return; // Request was rate limited
  }

  try {
    // Authenticate user
    const { userId, error: authError } = await getAuthenticatedUser(req, res);

    let effectiveUserId: string;

    if (!userId) {
      // In production, require authentication
      if (process.env.NODE_ENV === 'production') {
        return sendUnauthorized(res, authError || 'Authentication required');
      }
      // In development, allow demo user
      effectiveUserId = 'demo-user-dev';
    } else {
      effectiveUserId = userId;
    }

    // Validate input data with Zod
    let financialData: FinancialData;
    try {
      financialData = validateFinancialData(req.body);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        return sendErrorResponse(
          res,
          400,
          'Invalid financial data: ' + validationError.errors.map(e => e.message).join(', ')
        );
      }
      return sendErrorResponse(res, 400, 'Invalid financial data format');
    }

    // Save financial data to database (if admin client is available)
    let dataSaved = false;
    if (supabaseAdmin) {
      try {
        const { error: saveError } = await supabaseAdmin
          .from('financial_data')
          .insert([{
            user_id: effectiveUserId,
            financial_data: financialData,
            created_at: new Date().toISOString(),
          }]);

        if (saveError) {
          // Log error server-side only, don't expose to client
          console.error('Database save error:', saveError.message);
        } else {
          dataSaved = true;
        }
      } catch (dbError) {
        console.error('Database exception:', dbError);
      }
    }

    // Perform AI analysis with fallback
    let analysisResults: AnalysisResults;
    try {
      const analysisAgent = new FinancialAnalysisAgent();
      analysisResults = await analysisAgent.analyze(financialData);
    } catch (aiError) {
      console.error('AI analysis error, using local calculations:', aiError);
      analysisResults = calculateAnalysis(financialData);
    }

    // Save analysis results
    if (supabaseAdmin && dataSaved) {
      try {
        await supabaseAdmin
          .from('financial_analyses')
          .insert([{
            user_id: effectiveUserId,
            analysis_data: analysisResults,
            created_at: new Date().toISOString(),
          }]);
      } catch (analysisDbError) {
        // Non-critical, log and continue
        console.error('Failed to save analysis:', analysisDbError);
      }
    }

    // Return successful response
    return res.status(200).json({
      ...analysisResults,
      _meta: {
        dataSaved,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Attempt fallback analysis on any unhandled error
    try {
      const validatedData = validateFinancialData(req.body);
      const fallbackResults = calculateAnalysis(validatedData);

      return res.status(200).json({
        ...fallbackResults,
        _meta: {
          dataSaved: false,
          timestamp: new Date().toISOString(),
          fallback: true,
        },
      });
    } catch {
      // Complete failure - return safe error message
      return sendErrorResponse(res, 500, 'Unable to process request', error);
    }
  }
}
