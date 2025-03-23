const AgentOrchestrator = require('../../agents/AgentOrchestrator');
const { mockTransactions, mockPortfolio, mockMarketData, mockUserContext } = require('../utils/testData');

// Mock the individual agents
jest.mock('../../agents/SpendingAnalysisAgent');
jest.mock('../../agents/InvestmentAnalysisAgent');
jest.mock('../../agents/ScenarioAnalysisAgent');

describe('AgentOrchestrator', () => {
  let orchestrator;
  let mockSpendingAnalysis;
  let mockInvestmentAnalysis;
  let mockScenarioAnalysis;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();

    // Setup mock responses
    mockSpendingAnalysis = {
      categories: {
        Food: { total: 150.50, percentage: 70.5 },
        Entertainment: { total: 15.99, percentage: 7.5 },
        Transportation: { total: 45.00, percentage: 22.0 }
      },
      budgetComparison: {
        overBudget: false,
        totalSpending: 211.49
      },
      recommendations: [
        {
          type: 'budget_optimization',
          description: 'Consider meal planning',
          potentialSavings: 50
        }
      ]
    };

    mockInvestmentAnalysis = {
      portfolioAnalysis: {
        totalValue: 12750.00,
        performance: {
          daily: 0.02,
          weekly: 0.05
        }
      },
      recommendations: [
        {
          action: 'rebalance',
          description: 'Rebalance portfolio',
          priority: 'medium'
        }
      ]
    };

    mockScenarioAnalysis = {
      scenarioAnalysis: {
        optimistic: {
          metrics: { netWorth: 1500000 }
        },
        baseline: {
          metrics: { netWorth: 1200000 }
        },
        conservative: {
          metrics: { netWorth: 1000000 }
        }
      },
      comparison: {
        bestScenario: 'optimistic',
        worstScenario: 'conservative'
      },
      recommendations: [
        {
          scenario: 'baseline',
          action: 'Maintain strategy',
          rationale: 'Balanced approach'
        }
      ]
    };

    // Mock agent methods
    orchestrator.spendingAgent.analyzeSpending.mockResolvedValue(mockSpendingAnalysis);
    orchestrator.investmentAgent.analyzeInvestments.mockResolvedValue(mockInvestmentAnalysis);
    orchestrator.scenarioAgent.analyzeScenarios.mockResolvedValue(mockScenarioAnalysis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should coordinate all agents for comprehensive analysis', async () => {
    const result = await orchestrator.analyzeFinancialHealth('test-user-123', {
      transactions: mockTransactions,
      portfolio: mockPortfolio,
      marketData: mockMarketData,
      userContext: mockUserContext
    });

    // Verify all agents were called
    expect(orchestrator.spendingAgent.analyzeSpending).toHaveBeenCalledWith(
      mockTransactions,
      mockUserContext
    );
    expect(orchestrator.investmentAgent.analyzeInvestments).toHaveBeenCalledWith(
      mockPortfolio,
      mockMarketData,
      mockUserContext
    );
    expect(orchestrator.scenarioAgent.analyzeScenarios).toHaveBeenCalledWith(
      expect.any(Object),
      mockUserContext
    );

    // Verify result structure
    expect(result).toHaveProperty('userId', 'test-user-123');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('spendingAnalysis', mockSpendingAnalysis);
    expect(result).toHaveProperty('investmentAnalysis', mockInvestmentAnalysis);
    expect(result).toHaveProperty('scenarioAnalysis', mockScenarioAnalysis);
    expect(result).toHaveProperty('summary');
  });

  test('should handle missing portfolio data gracefully', async () => {
    const result = await orchestrator.analyzeFinancialHealth('test-user-123', {
      transactions: mockTransactions,
      userContext: mockUserContext
    });

    expect(result.investmentAnalysis).toBeNull();
    expect(result.summary.keyFindings).not.toContainEqual(
      expect.objectContaining({ type: 'investment' })
    );
  });

  test('should calculate risk level correctly', () => {
    const findings = [
      { impact: 'high' },
      { impact: 'medium' },
      { impact: 'low' }
    ];

    const riskLevel = orchestrator.calculateRiskLevel(findings);
    expect(riskLevel).toBe('moderate');
  });

  test('should calculate overall health correctly', () => {
    const findings = [
      { impact: 'high' },
      { impact: 'medium' },
      { impact: 'low' }
    ];

    const health = orchestrator.calculateOverallHealth(findings);
    expect(health).toBe('fair');
  });

  test('should handle agent errors gracefully', async () => {
    orchestrator.spendingAgent.analyzeSpending.mockRejectedValue(new Error('Spending analysis failed'));

    await expect(orchestrator.analyzeFinancialHealth('test-user-123', {
      transactions: mockTransactions,
      portfolio: mockPortfolio,
      marketData: mockMarketData,
      userContext: mockUserContext
    })).rejects.toThrow('Failed to complete financial analysis');
  });
}); 