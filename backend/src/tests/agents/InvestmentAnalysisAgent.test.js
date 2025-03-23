const InvestmentAnalysisAgent = require('../../agents/InvestmentAnalysisAgent');
const { mockPortfolio, mockMarketData, mockUserContext, mockOpenAIResponse } = require('../utils/testData');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

describe('InvestmentAnalysisAgent', () => {
  let agent;
  let mockResponse;

  beforeEach(() => {
    agent = new InvestmentAnalysisAgent();
    mockResponse = {
      ...mockOpenAIResponse,
      choices: [{
        message: {
          content: JSON.stringify({
            portfolioAnalysis: {
              totalValue: 12750.00,
              performance: {
                daily: 0.02,
                weekly: 0.05,
                monthly: 0.08,
                yearly: 0.15
              },
              riskMetrics: {
                beta: 1.2,
                sharpeRatio: 1.5,
                volatility: 0.18
              }
            },
            diversification: {
              currentAllocation: {
                stocks: {
                  percentage: 75,
                  value: 9562.50
                },
                bonds: {
                  percentage: 25,
                  value: 3187.50
                }
              },
              recommendedAllocation: {
                stocks: {
                  percentage: 70,
                  value: 8925.00
                },
                bonds: {
                  percentage: 30,
                  value: 3825.00
                }
              }
            },
            opportunities: [
              {
                type: 'stock',
                description: 'Consider adding more technology stocks',
                potentialReturn: 0.12,
                riskLevel: 'moderate'
              }
            ],
            recommendations: [
              {
                action: 'rebalance',
                description: 'Rebalance portfolio to match recommended allocation',
                rationale: 'Current allocation is slightly overweight in stocks',
                priority: 'medium'
              }
            ]
          })
        }
      }]
    };
    agent.openai.chat.completions.create.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should analyze investment portfolio correctly', async () => {
    const result = await agent.analyzeInvestments(mockPortfolio, mockMarketData, mockUserContext);

    // Verify the result structure
    expect(result).toHaveProperty('portfolioAnalysis');
    expect(result).toHaveProperty('diversification');
    expect(result).toHaveProperty('opportunities');
    expect(result).toHaveProperty('recommendations');

    // Verify portfolio analysis
    expect(result.portfolioAnalysis.totalValue).toBe(12750.00);
    expect(result.portfolioAnalysis.performance).toHaveProperty('daily');
    expect(result.portfolioAnalysis.riskMetrics).toHaveProperty('beta');

    // Verify diversification
    expect(result.diversification.currentAllocation.stocks.percentage).toBe(75);
    expect(result.diversification.recommendedAllocation.stocks.percentage).toBe(70);

    // Verify opportunities
    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0].type).toBe('stock');

    // Verify recommendations
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].action).toBe('rebalance');
  });

  test('should handle API errors gracefully', async () => {
    agent.openai.chat.completions.create.mockRejectedValue(new Error('API Error'));

    await expect(agent.analyzeInvestments(mockPortfolio, mockMarketData, mockUserContext))
      .rejects
      .toThrow('Failed to process financial analysis');
  });

  test('should use correct risk tolerance from user context', async () => {
    const prompt = await agent.generatePrompt(
      { portfolio: mockPortfolio, marketData: mockMarketData, userContext: mockUserContext },
      'test task'
    );

    expect(prompt).toContain('"riskTolerance":"moderate"');
  });
}); 