/**
 * Enterprise API Endpoint: Financial Analysis
 *
 * POST /api/v1/enterprise/analyze
 *
 * This is the main endpoint that financial institutions will integrate with.
 * It provides AI-powered financial analysis with tenant isolation and compliance.
 */

import { NextApiResponse } from 'next';
import {
  withTenantAuth,
  logApiRequest,
  trackApiUsage,
  setCorsHeaders,
  handleCorsPrelight,
  tenantManager,
} from '@/lib/enterprise';
import type { TenantRequest, TenantConfig } from '@/lib/enterprise';
import {
  FinancialAnalysisAgent,
  validateFinancialData,
  calculateAnalysis,
} from '@/lib/product';
import type { FinancialData, AnalysisResults } from '@/lib/product';

interface AnalyzeRequest {
  userId: string; // Tenant's end user ID
  financialData: FinancialData;
  requestType?: 'financial_health' | 'quick_check' | 'detailed';
  includeRecommendations?: boolean;
  metadata?: Record<string, any>;
}

interface AnalyzeResponse {
  success: boolean;
  data: AnalysisResults;
  metadata: {
    requestId: string;
    timestamp: string;
    processingTimeMs: number;
    model: string;
    tokensUsed?: number;
  };
}

async function handleAnalyze(
  req: TenantRequest,
  res: NextApiResponse,
  tenant: TenantConfig
): Promise<void> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Set CORS headers
  setCorsHeaders(req, res, tenant);

  // Handle preflight
  if (handleCorsPrelight(req, res, tenant)) {
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed'
      }
    });
  }

  try {
    // Parse and validate request
    const {
      userId,
      financialData,
      requestType = 'financial_health',
      includeRecommendations = true,
      metadata
    } = req.body as AnalyzeRequest;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'userId is required'
        }
      });
    }

    if (!financialData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FINANCIAL_DATA',
          message: 'financialData is required'
        }
      });
    }

    // Validate financial data structure
    let validatedData: FinancialData;
    try {
      validatedData = validateFinancialData(financialData);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FINANCIAL_DATA',
          message: validationError instanceof Error ? validationError.message : 'Invalid financial data format'
        }
      });
    }

    // Register or update user
    await tenantManager.registerUser(tenant.id, userId, metadata);

    // Store financial data in database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Set tenant context for RLS
    await tenantManager.setTenantContext(tenant.id);

    // Save financial data
    await supabase.from('financial_data').insert([
      {
        tenant_id: tenant.id,
        user_id: userId,
        financial_data: validatedData
      }
    ]);

    // Perform AI analysis
    const analysisAgent = new FinancialAnalysisAgent();
    let analysisResults: AnalysisResults;
    let tokensUsed = 0;
    let modelUsed = 'local';

    try {
      analysisResults = await analysisAgent.analyze(validatedData);
      modelUsed = 'openai'; // or 'claude' depending on which succeeded
      tokensUsed = estimateTokens(validatedData, analysisResults);
    } catch (aiError) {
      console.error('AI analysis failed, using local calculations:', aiError);
      analysisResults = calculateAnalysis(validatedData);
    }

    // Save analysis results
    await supabase.from('financial_analyses').insert([
      {
        tenant_id: tenant.id,
        user_id: userId,
        analysis_data: analysisResults,
        tokens_used: tokensUsed,
        model_used: modelUsed,
        response_time_ms: Date.now() - startTime
      }
    ]);

    // Log the API request
    await logApiRequest(
      tenant.id,
      userId,
      'analyze_finances',
      'financial_analysis',
      {
        requestType,
        includeRecommendations,
        hasMetadata: !!metadata
      },
      req
    );

    // Track usage for billing
    await trackApiUsage(tenant.id, {
      tokens: tokensUsed,
      requests: 1,
      responseTimeMs: Date.now() - startTime
    });

    // Build response
    const response: AnalyzeResponse = {
      success: true,
      data: analysisResults,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        model: modelUsed,
        tokensUsed: tokensUsed > 0 ? tokensUsed : undefined
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in enterprise analyze endpoint:', error);

    // Log the error
    await logApiRequest(
      tenant.id,
      req.body?.userId,
      'analyze_finances_error',
      'financial_analysis',
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      req
    );

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred processing your request',
        requestId
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime
      }
    });
  }
}

// Estimate tokens used (rough approximation)
function estimateTokens(input: FinancialData, output: AnalysisResults): number {
  const inputStr = JSON.stringify(input);
  const outputStr = JSON.stringify(output);
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil((inputStr.length + outputStr.length) / 4);
}

// Export handler with tenant authentication middleware
export default withTenantAuth(handleAnalyze);
