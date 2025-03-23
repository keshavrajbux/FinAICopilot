const SpendingAnalysisAgent = require('./SpendingAnalysisAgent');
const InvestmentAnalysisAgent = require('./InvestmentAnalysisAgent');
const ScenarioAnalysisAgent = require('./ScenarioAnalysisAgent');

class AgentOrchestrator {
  constructor() {
    this.spendingAgent = new SpendingAnalysisAgent();
    this.investmentAgent = new InvestmentAnalysisAgent();
    this.scenarioAgent = new ScenarioAnalysisAgent();
  }

  async analyzeFinancialHealth(userId, financialData) {
    try {
      // Run spending analysis
      const spendingAnalysis = await this.spendingAgent.analyzeSpending(
        financialData.transactions,
        financialData.userContext
      );

      // Run investment analysis if portfolio data exists
      let investmentAnalysis = null;
      if (financialData.portfolio && financialData.marketData) {
        investmentAnalysis = await this.investmentAgent.analyzeInvestments(
          financialData.portfolio,
          financialData.marketData,
          financialData.userContext
        );
      }

      // Run scenario analysis
      const scenarioAnalysis = await this.scenarioAgent.analyzeScenarios(
        financialData,
        financialData.userContext
      );

      // Combine all analyses into a comprehensive report
      return {
        userId,
        timestamp: new Date().toISOString(),
        spendingAnalysis,
        investmentAnalysis,
        scenarioAnalysis,
        summary: this.generateSummary(spendingAnalysis, investmentAnalysis, scenarioAnalysis)
      };
    } catch (error) {
      console.error('Error in financial health analysis:', error);
      throw new Error('Failed to complete financial analysis');
    }
  }

  generateSummary(spendingAnalysis, investmentAnalysis, scenarioAnalysis) {
    const summary = {
      keyFindings: [],
      recommendations: [],
      riskLevel: 'moderate',
      overallHealth: 'good'
    };

    // Extract key findings from spending analysis
    if (spendingAnalysis) {
      summary.keyFindings.push({
        type: 'spending',
        description: `Total spending: $${spendingAnalysis.budgetComparison.totalSpending.toFixed(2)}`,
        impact: spendingAnalysis.budgetComparison.overBudget ? 'high' : 'low'
      });

      // Add top recommendations
      spendingAnalysis.recommendations
        .slice(0, 2)
        .forEach(rec => summary.recommendations.push(rec));
    }

    // Extract key findings from investment analysis
    if (investmentAnalysis) {
      summary.keyFindings.push({
        type: 'investment',
        description: `Portfolio value: $${investmentAnalysis.portfolioAnalysis.totalValue.toFixed(2)}`,
        impact: 'medium'
      });

      // Add top recommendations
      investmentAnalysis.recommendations
        .slice(0, 2)
        .forEach(rec => summary.recommendations.push(rec));
    }

    // Extract key findings from scenario analysis
    if (scenarioAnalysis) {
      summary.keyFindings.push({
        type: 'scenario',
        description: `Best scenario: ${scenarioAnalysis.comparison.bestScenario}`,
        impact: 'high'
      });

      // Add top recommendations
      scenarioAnalysis.recommendations
        .slice(0, 2)
        .forEach(rec => summary.recommendations.push(rec));
    }

    // Determine overall risk level and health
    summary.riskLevel = this.calculateRiskLevel(summary.keyFindings);
    summary.overallHealth = this.calculateOverallHealth(summary.keyFindings);

    return summary;
  }

  calculateRiskLevel(findings) {
    const riskScores = findings.map(finding => {
      switch (finding.impact) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    });

    const averageRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
    if (averageRisk >= 2.5) return 'high';
    if (averageRisk >= 1.5) return 'moderate';
    return 'low';
  }

  calculateOverallHealth(findings) {
    const healthScores = findings.map(finding => {
      switch (finding.impact) {
        case 'high': return 1;
        case 'medium': return 2;
        case 'low': return 3;
        default: return 2;
      }
    });

    const averageHealth = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;
    if (averageHealth >= 2.5) return 'excellent';
    if (averageHealth >= 2) return 'good';
    if (averageHealth >= 1.5) return 'fair';
    return 'poor';
  }
}

module.exports = AgentOrchestrator; 