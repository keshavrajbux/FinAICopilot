// Define mock data directly instead of importing from backend
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

class DemoService {
  constructor() {
    this.isDemoMode = false;
    this.currentScenario = null;
  }

  startDemo(scenario) {
    this.isDemoMode = true;
    this.currentScenario = scenario;
    return {
      success: true,
      message: 'Demo mode activated successfully',
      data: {
        transactions: scenario.transactions,
        portfolio: scenario.portfolio,
        marketData: mockMarketData,
        userContext: {
          ...mockUserContext,
          riskTolerance: this.getRiskTolerance(scenario),
        },
      },
    };
  }

  getRiskTolerance(scenario) {
    switch (scenario.name) {
      case 'Conservative Saver':
        return 'conservative';
      case 'Aggressive Investor':
        return 'aggressive';
      default:
        return 'moderate';
    }
  }

  async analyzeSpending() {
    if (!this.isDemoMode) {
      throw new Error('Demo mode is not active');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      categories: {
        Food: {
          total: this.currentScenario.transactions
            .filter(t => t.category === 'Food')
            .reduce((acc, t) => acc + t.amount, 0),
          percentage: 40,
          transactions: this.currentScenario.transactions.filter(t => t.category === 'Food'),
        },
        Entertainment: {
          total: this.currentScenario.transactions
            .filter(t => t.category === 'Entertainment')
            .reduce((acc, t) => acc + t.amount, 0),
          percentage: 30,
          transactions: this.currentScenario.transactions.filter(t => t.category === 'Entertainment'),
        },
        Transportation: {
          total: this.currentScenario.transactions
            .filter(t => t.category === 'Transportation')
            .reduce((acc, t) => acc + t.amount, 0),
          percentage: 30,
          transactions: this.currentScenario.transactions.filter(t => t.category === 'Transportation'),
        },
      },
      recommendations: [
        {
          type: 'budget_optimization',
          description: 'Consider meal planning to reduce food expenses',
          potentialSavings: 50,
        },
        {
          type: 'savings_opportunity',
          description: 'Look for entertainment subscription bundles',
          potentialSavings: 20,
        },
      ],
    };
  }

  async analyzeInvestments() {
    if (!this.isDemoMode) {
      throw new Error('Demo mode is not active');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      portfolioAnalysis: {
        totalValue: this.currentScenario.portfolio.stocks.reduce(
          (acc, stock) => acc + (stock.shares * stock.currentPrice),
          0
        ) + this.currentScenario.portfolio.bonds.reduce(
          (acc, bond) => acc + bond.value,
          0
        ),
        performance: {
          daily: 0.02,
          weekly: 0.05,
          monthly: 0.08,
          yearly: 0.15,
        },
      },
      recommendations: [
        {
          type: 'portfolio_rebalance',
          description: 'Consider rebalancing your portfolio to match your risk tolerance',
          priority: 'medium',
        },
      ],
    };
  }

  async analyzeScenarios() {
    if (!this.isDemoMode) {
      throw new Error('Demo mode is not active');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      scenarios: {
        optimistic: {
          netWorth: 1500000,
          monthlyCashFlow: 5000,
          savingsRate: 0.25,
        },
        baseline: {
          netWorth: 1200000,
          monthlyCashFlow: 4000,
          savingsRate: 0.20,
        },
        conservative: {
          netWorth: 1000000,
          monthlyCashFlow: 3000,
          savingsRate: 0.15,
        },
      },
      recommendations: [
        {
          type: 'scenario_optimization',
          description: 'Focus on increasing your savings rate to achieve better outcomes',
          priority: 'high',
        },
      ],
    };
  }

  stopDemo() {
    this.isDemoMode = false;
    this.currentScenario = null;
    return {
      success: true,
      message: 'Demo mode deactivated successfully',
    };
  }
}

export default new DemoService(); 