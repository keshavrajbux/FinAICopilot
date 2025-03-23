const BaseAgent = require('./BaseAgent');

class InvestmentAnalysisAgent extends BaseAgent {
  async analyzeInvestments(portfolio, marketData, userContext) {
    const context = {
      portfolio,
      marketData,
      userContext,
      riskTolerance: userContext.riskTolerance || 'moderate'
    };

    const task = `Analyze the investment portfolio and market data to provide insights and recommendations:

1. Evaluate portfolio performance and risk metrics
2. Identify diversification opportunities
3. Analyze market trends and potential opportunities
4. Compare portfolio allocation to user's risk tolerance
5. Generate personalized investment recommendations

Provide the analysis in the following JSON structure:
{
  "portfolioAnalysis": {
    "totalValue": number,
    "performance": {
      "daily": number,
      "weekly": number,
      "monthly": number,
      "yearly": number
    },
    "riskMetrics": {
      "beta": number,
      "sharpeRatio": number,
      "volatility": number
    }
  },
  "diversification": {
    "currentAllocation": {
      "asset_class": {
        "percentage": number,
        "value": number
      }
    },
    "recommendedAllocation": {
      "asset_class": {
        "percentage": number,
        "value": number
      }
    }
  },
  "opportunities": [
    {
      "type": string,
      "description": string,
      "potentialReturn": number,
      "riskLevel": string
    }
  ],
  "recommendations": [
    {
      "action": string,
      "description": string,
      "rationale": string,
      "priority": string
    }
  ]
}`;

    const prompt = await this.generatePrompt(context, task);
    return await this.callAPI(prompt);
  }
}

module.exports = InvestmentAnalysisAgent; 