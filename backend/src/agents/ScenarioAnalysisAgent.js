const BaseAgent = require('./BaseAgent');

class ScenarioAnalysisAgent extends BaseAgent {
  async analyzeScenarios(financialData, userContext, scenarios) {
    const context = {
      financialData,
      userContext,
      scenarios: scenarios || this.generateDefaultScenarios()
    };

    const task = `Analyze different financial scenarios and provide insights:

1. Evaluate each scenario's impact on financial goals
2. Calculate key financial metrics for each scenario
3. Identify potential risks and opportunities
4. Compare scenarios to help with decision-making
5. Generate recommendations for scenario optimization

Provide the analysis in the following JSON structure:
{
  "scenarioAnalysis": {
    "scenario_name": {
      "summary": string,
      "metrics": {
        "netWorth": number,
        "monthlyCashFlow": number,
        "savingsRate": number,
        "debtToIncome": number
      },
      "risks": [
        {
          "description": string,
          "severity": string,
          "mitigation": string
        }
      ],
      "opportunities": [
        {
          "description": string,
          "potentialImpact": string,
          "actionRequired": string
        }
      ]
    }
  },
  "comparison": {
    "bestScenario": string,
    "worstScenario": string,
    "keyDifferences": [
      {
        "metric": string,
        "difference": number,
        "impact": string
      }
    ]
  },
  "recommendations": [
    {
      "scenario": string,
      "action": string,
      "rationale": string,
      "expectedOutcome": string
    }
  ]
}`;

    const prompt = await this.generatePrompt(context, task);
    return await this.callAPI(prompt);
  }

  generateDefaultScenarios() {
    return {
      optimistic: {
        name: "Optimistic Growth",
        assumptions: {
          incomeGrowth: 0.05,
          marketReturn: 0.08,
          inflation: 0.02
        }
      },
      baseline: {
        name: "Baseline",
        assumptions: {
          incomeGrowth: 0.03,
          marketReturn: 0.06,
          inflation: 0.03
        }
      },
      conservative: {
        name: "Conservative",
        assumptions: {
          incomeGrowth: 0.02,
          marketReturn: 0.04,
          inflation: 0.04
        }
      }
    };
  }
}

module.exports = ScenarioAnalysisAgent; 