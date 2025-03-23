const ScenarioAnalysisAgent = require('../../agents/ScenarioAnalysisAgent');
const { mockTransactions, mockPortfolio, mockUserContext, mockOpenAIResponse } = require('../utils/testData');

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

describe('ScenarioAnalysisAgent', () => {
  let agent;
  let mockResponse;

  beforeEach(() => {
    agent = new ScenarioAnalysisAgent();
    mockResponse = {
      ...mockOpenAIResponse,
      choices: [{
        message: {
          content: JSON.stringify({
            scenarioAnalysis: {
              optimistic: {
                summary: 'Strong growth scenario with favorable market conditions',
                metrics: {
                  netWorth: 1500000,
                  monthlyCashFlow: 5000,
                  savingsRate: 0.25,
                  debtToIncome: 0.25
                },
                risks: [
                  {
                    description: 'Market volatility',
                    severity: 'low',
                    mitigation: 'Maintain diversified portfolio'
                  }
                ],
                opportunities: [
                  {
                    description: 'Increased investment returns',
                    potentialImpact: 'high',
                    actionRequired: 'Maintain aggressive investment strategy'
                  }
                ]
              },
              baseline: {
                summary: 'Moderate growth scenario with stable market conditions',
                metrics: {
                  netWorth: 1200000,
                  monthlyCashFlow: 4000,
                  savingsRate: 0.20,
                  debtToIncome: 0.30
                },
                risks: [
                  {
                    description: 'Inflation pressure',
                    severity: 'medium',
                    mitigation: 'Regular portfolio rebalancing'
                  }
                ],
                opportunities: [
                  {
                    description: 'Steady income growth',
                    potentialImpact: 'medium',
                    actionRequired: 'Maintain balanced investment approach'
                  }
                ]
              },
              conservative: {
                summary: 'Conservative scenario with market uncertainty',
                metrics: {
                  netWorth: 1000000,
                  monthlyCashFlow: 3000,
                  savingsRate: 0.15,
                  debtToIncome: 0.35
                },
                risks: [
                  {
                    description: 'Economic downturn',
                    severity: 'high',
                    mitigation: 'Build emergency fund'
                  }
                ],
                opportunities: [
                  {
                    description: 'Focus on debt reduction',
                    potentialImpact: 'medium',
                    actionRequired: 'Prioritize debt payments'
                  }
                ]
              }
            },
            comparison: {
              bestScenario: 'optimistic',
              worstScenario: 'conservative',
              keyDifferences: [
                {
                  metric: 'netWorth',
                  difference: 500000,
                  impact: 'significant'
                }
              ]
            },
            recommendations: [
              {
                scenario: 'baseline',
                action: 'Maintain current strategy',
                rationale: 'Balanced approach with manageable risks',
                expectedOutcome: 'Steady progress toward goals'
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

  test('should analyze scenarios correctly', async () => {
    const result = await agent.analyzeScenarios(
      { transactions: mockTransactions, portfolio: mockPortfolio },
      mockUserContext
    );

    // Verify the result structure
    expect(result).toHaveProperty('scenarioAnalysis');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('recommendations');

    // Verify scenario analysis
    expect(result.scenarioAnalysis).toHaveProperty('optimistic');
    expect(result.scenarioAnalysis).toHaveProperty('baseline');
    expect(result.scenarioAnalysis).toHaveProperty('conservative');

    // Verify metrics
    expect(result.scenarioAnalysis.optimistic.metrics.netWorth).toBe(1500000);
    expect(result.scenarioAnalysis.baseline.metrics.netWorth).toBe(1200000);
    expect(result.scenarioAnalysis.conservative.metrics.netWorth).toBe(1000000);

    // Verify comparison
    expect(result.comparison.bestScenario).toBe('optimistic');
    expect(result.comparison.worstScenario).toBe('conservative');

    // Verify recommendations
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].scenario).toBe('baseline');
  });

  test('should handle API errors gracefully', async () => {
    agent.openai.chat.completions.create.mockRejectedValue(new Error('API Error'));

    await expect(agent.analyzeScenarios(
      { transactions: mockTransactions, portfolio: mockPortfolio },
      mockUserContext
    )).rejects.toThrow('Failed to process financial analysis');
  });

  test('should generate default scenarios when none provided', async () => {
    const result = await agent.analyzeScenarios(
      { transactions: mockTransactions, portfolio: mockPortfolio },
      mockUserContext
    );

    expect(result.scenarioAnalysis).toHaveProperty('optimistic');
    expect(result.scenarioAnalysis).toHaveProperty('baseline');
    expect(result.scenarioAnalysis).toHaveProperty('conservative');
  });
}); 