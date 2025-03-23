const mockTransactions = [
  {
    id: 1,
    date: '2024-03-01',
    description: 'Grocery Shopping',
    amount: 150.50,
    category: 'Food'
  },
  {
    id: 2,
    date: '2024-03-02',
    description: 'Netflix Subscription',
    amount: 15.99,
    category: 'Entertainment'
  },
  {
    id: 3,
    date: '2024-03-03',
    description: 'Gas Station',
    amount: 45.00,
    category: 'Transportation'
  }
];

const mockPortfolio = {
  stocks: [
    {
      symbol: 'AAPL',
      shares: 10,
      currentPrice: 175.50,
      purchasePrice: 150.00
    },
    {
      symbol: 'GOOGL',
      shares: 5,
      currentPrice: 145.20,
      purchasePrice: 140.00
    }
  ],
  bonds: [
    {
      type: 'US Treasury',
      value: 10000,
      yield: 0.04
    }
  ]
};

const mockMarketData = {
  marketIndices: {
    sp500: 5200.50,
    nasdaq: 16500.75,
    dow: 39000.25
  },
  sectorPerformance: {
    technology: 0.05,
    healthcare: 0.02,
    finance: 0.03
  }
};

const mockUserContext = {
  userId: 'test-user-123',
  riskTolerance: 'moderate',
  financialGoals: [
    {
      type: 'retirement',
      targetAmount: 1000000,
      targetDate: '2040-12-31'
    },
    {
      type: 'emergency',
      targetAmount: 50000,
      targetDate: '2025-12-31'
    }
  ],
  monthlyBudget: {
    food: 500,
    housing: 2000,
    transportation: 300,
    entertainment: 200
  }
};

const mockOpenAIResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        // This will be overridden in specific test files
        test: 'mock response'
      })
    }
  }]
};

module.exports = {
  mockTransactions,
  mockPortfolio,
  mockMarketData,
  mockUserContext,
  mockOpenAIResponse
}; 