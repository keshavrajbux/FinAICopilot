const SpendingAnalysisAgent = require('../../agents/SpendingAnalysisAgent');
const { mockTransactions, mockUserContext, mockOpenAIResponse } = require('../utils/testData');

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

describe('SpendingAnalysisAgent', () => {
  let agent;
  let mockResponse;

  beforeEach(() => {
    agent = new SpendingAnalysisAgent();
    mockResponse = {
      ...mockOpenAIResponse,
      choices: [{
        message: {
          content: JSON.stringify({
            categories: {
              Food: {
                total: 150.50,
                percentage: 70.5,
                transactions: [mockTransactions[0]]
              },
              Entertainment: {
                total: 15.99,
                percentage: 7.5,
                transactions: [mockTransactions[1]]
              },
              Transportation: {
                total: 45.00,
                percentage: 22.0,
                transactions: [mockTransactions[2]]
              }
            },
            recurringExpenses: [
              {
                description: 'Netflix Subscription',
                amount: 15.99,
                frequency: 'monthly',
                category: 'Entertainment'
              }
            ],
            budgetComparison: {
              overBudget: false,
              overBudgetCategories: [],
              totalSpending: 211.49
            },
            recommendations: [
              {
                type: 'budget_optimization',
                description: 'Consider meal planning to reduce food expenses',
                potentialSavings: 50
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

  test('should analyze spending patterns correctly', async () => {
    const result = await agent.analyzeSpending(mockTransactions, mockUserContext);

    // Verify the result structure
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('recurringExpenses');
    expect(result).toHaveProperty('budgetComparison');
    expect(result).toHaveProperty('recommendations');

    // Verify category calculations
    expect(result.categories.Food.total).toBe(150.50);
    expect(result.categories.Food.percentage).toBe(70.5);

    // Verify recurring expenses
    expect(result.recurringExpenses).toHaveLength(1);
    expect(result.recurringExpenses[0].description).toBe('Netflix Subscription');

    // Verify budget comparison
    expect(result.budgetComparison.totalSpending).toBe(211.49);
    expect(result.budgetComparison.overBudget).toBe(false);

    // Verify recommendations
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].type).toBe('budget_optimization');
  });

  test('should handle API errors gracefully', async () => {
    agent.openai.chat.completions.create.mockRejectedValue(new Error('API Error'));

    await expect(agent.analyzeSpending(mockTransactions, mockUserContext))
      .rejects
      .toThrow('Failed to process financial analysis');
  });

  test('should generate correct prompt structure', async () => {
    const prompt = await agent.generatePrompt(
      { transactions: mockTransactions, userContext: mockUserContext },
      'test task'
    );

    expect(prompt).toContain('Financial Analysis Agent');
    expect(prompt).toContain(JSON.stringify(mockTransactions));
    expect(prompt).toContain(JSON.stringify(mockUserContext));
    expect(prompt).toContain('test task');
  });
}); 