const BaseAgent = require('./BaseAgent');

class SpendingAnalysisAgent extends BaseAgent {
  async analyzeSpending(transactions, userContext) {
    const context = {
      transactions,
      userContext,
      timeRange: 'last 30 days' // Can be made configurable
    };

    const task = `Analyze the provided transactions to identify spending patterns and provide insights:

1. Categorize transactions into standard categories (e.g., Housing, Food, Transportation, etc.)
2. Calculate total spending by category
3. Identify recurring expenses and their frequency
4. Compare spending to user's stated budget (if available)
5. Identify potential areas of overspending
6. Generate 3-5 actionable recommendations for budget optimization

Provide the analysis in the following JSON structure:
{
  "categories": {
    "category_name": {
      "total": number,
      "percentage": number,
      "transactions": array
    }
  },
  "recurringExpenses": [
    {
      "description": string,
      "amount": number,
      "frequency": string,
      "category": string
    }
  ],
  "budgetComparison": {
    "overBudget": boolean,
    "overBudgetCategories": array,
    "totalSpending": number
  },
  "recommendations": [
    {
      "type": string,
      "description": string,
      "potentialSavings": number
    }
  ]
}`;

    const prompt = await this.generatePrompt(context, task);
    return await this.callAPI(prompt);
  }
}

module.exports = SpendingAnalysisAgent; 