/**
 * ContinuousMonitoringAgent.js
 * Agent that continuously monitors financial data and provides real-time insights
 */

const BaseAgent = require('./BaseAgent');
const dataExtractionService = require('../services/DataExtractionService');

class ContinuousMonitoringAgent extends BaseAgent {
  constructor() {
    super('continuous_monitoring');
    this.monitoredUsers = new Map(); // userId -> monitoring data
    this.alertThresholds = {
      lowBalance: 200, // Alert when balance drops below $200
      highSpending: 0.7, // Alert when spending is 70% of income
      savingsRate: 0.2, // Alert when savings rate is below 20%
      billDueSoon: 5, // Alert when bill is due in 5 days or less
    };
    this.lastSyncTimes = new Map(); // userId -> last sync time
  }

  /**
   * Start monitoring a user's financial data
   * @param {string} userId - User ID to monitor
   * @param {Object} sources - Data sources to monitor
   * @returns {Promise<Object>} - Monitoring status
   */
  async startMonitoring(userId, sources = []) {
    try {
      this.logger.info(`Starting financial monitoring for user: ${userId}`);
      
      if (!this.monitoredUsers.has(userId)) {
        this.monitoredUsers.set(userId, {
          userId,
          activeSources: new Set(sources),
          financialProfile: {
            income: 0,
            expenses: 0,
            savings: 0,
            assets: 0,
            liabilities: 0,
          },
          insights: [],
          alerts: [],
          goals: []
        });
      } else {
        // Add new sources to existing monitored user
        const userData = this.monitoredUsers.get(userId);
        sources.forEach(source => userData.activeSources.add(source));
      }

      // Perform initial data sync
      await this.syncUserData(userId);
      
      return {
        success: true,
        userId,
        message: `Monitoring started for ${sources.length} data sources`,
      };
    } catch (error) {
      this.logger.error(`Error starting monitoring for user ${userId}: ${error.message}`);
      return {
        success: false,
        userId,
        error: error.message
      };
    }
  }

  /**
   * Sync user's financial data from all connected sources
   * @param {string} userId - User ID to sync
   * @returns {Promise<Object>} - Sync result
   */
  async syncUserData(userId) {
    if (!this.monitoredUsers.has(userId)) {
      throw new Error(`User ${userId} is not being monitored`);
    }

    const userData = this.monitoredUsers.get(userId);
    const extractionPromises = [];

    // For each active source, extract data
    userData.activeSources.forEach(source => {
      // In a real implementation, we would retrieve actual credentials
      const mockCredentials = { userId, apiKey: 'mock-api-key-' + source };
      extractionPromises.push(dataExtractionService.connectAndExtract(source, mockCredentials));
    });

    const extractionResults = await Promise.all(extractionPromises);
    this.lastSyncTimes.set(userId, new Date());

    // Process the extracted data to update the user's financial profile
    await this.processExtractedData(userId, extractionResults);

    // Generate insights based on the updated profile
    await this.generateInsights(userId);

    return {
      success: true,
      syncTime: this.lastSyncTimes.get(userId),
      sources: extractionResults.map(result => result.source)
    };
  }

  /**
   * Process data extracted from various sources
   * @param {string} userId - User ID
   * @param {Array} extractionResults - Results from data extraction
   */
  async processExtractedData(userId, extractionResults) {
    const userData = this.monitoredUsers.get(userId);
    const profile = userData.financialProfile;
    
    // Reset financial metrics to recalculate
    profile.income = 0;
    profile.expenses = 0;
    profile.assets = 0;
    profile.liabilities = 0;

    extractionResults.forEach(result => {
      if (!result.success) return;

      const { source, data } = result;

      // Process based on source type
      switch (source) {
        case 'email':
          this.processEmailData(profile, data);
          break;
        case 'notifications':
          this.processNotificationData(profile, data);
          break;
        case 'bankAccount':
          this.processBankAccountData(profile, data);
          break;
        case 'creditCard':
          this.processCreditCardData(profile, data);
          break;
        default:
          this.logger.warn(`Unknown data source: ${source}`);
      }
    });

    // Calculate savings
    profile.savings = profile.income - profile.expenses;

    // Update the user data in our store
    this.monitoredUsers.set(userId, userData);
  }

  /**
   * Process email data
   */
  processEmailData(profile, data) {
    // Process transactions
    if (data.transactions) {
      data.transactions.forEach(transaction => {
        if (transaction.amount > 0) {
          profile.income += transaction.amount;
        } else {
          profile.expenses += Math.abs(transaction.amount);
        }
      });
    }

    // Process bills
    if (data.bills) {
      data.bills.forEach(bill => {
        profile.liabilities += bill.amount;
      });
    }
  }

  /**
   * Process notification data
   */
  processNotificationData(profile, data) {
    // Process transactions
    if (data.transactions) {
      data.transactions.forEach(transaction => {
        if (transaction.amount > 0) {
          profile.income += transaction.amount;
        } else {
          profile.expenses += Math.abs(transaction.amount);
        }
      });
    }
  }

  /**
   * Process bank account data
   */
  processBankAccountData(profile, data) {
    if (data.accounts) {
      data.accounts.forEach(account => {
        // Add to assets
        profile.assets += account.balance;

        // Process transactions
        if (account.transactions) {
          account.transactions.forEach(transaction => {
            if (transaction.amount > 0) {
              profile.income += transaction.amount;
            } else {
              profile.expenses += Math.abs(transaction.amount);
            }
          });
        }
      });
    }
  }

  /**
   * Process credit card data
   */
  processCreditCardData(profile, data) {
    if (data.cards) {
      data.cards.forEach(card => {
        // Add to liabilities
        profile.liabilities += card.balance;

        // Process transactions
        if (card.transactions) {
          card.transactions.forEach(transaction => {
            // Credit card transactions are usually expenses
            profile.expenses += transaction.amount;
          });
        }
      });
    }
  }

  /**
   * Generate financial insights and alerts based on the user's data
   * @param {string} userId - User ID
   */
  async generateInsights(userId) {
    const userData = this.monitoredUsers.get(userId);
    const profile = userData.financialProfile;
    
    // Clear previous insights and alerts
    userData.insights = [];
    userData.alerts = [];
    
    // Calculate key financial ratios
    const savingsRate = profile.income > 0 ? profile.savings / profile.income : 0;
    const spendingRate = profile.income > 0 ? profile.expenses / profile.income : 0;
    const debtToAssetRatio = profile.assets > 0 ? profile.liabilities / profile.assets : Infinity;
    
    // Generate insights
    
    // 1. Savings rate insight
    if (savingsRate < this.alertThresholds.savingsRate) {
      userData.insights.push({
        type: 'savings_rate',
        severity: 'warning',
        message: `Your savings rate is ${(savingsRate * 100).toFixed(1)}%, which is below the recommended 20%`,
        recommendation: 'Try to reduce discretionary spending or find additional income sources'
      });
      
      userData.alerts.push({
        type: 'low_savings_rate',
        message: 'Your savings rate is below the recommended threshold',
        timestamp: new Date()
      });
    } else {
      userData.insights.push({
        type: 'savings_rate',
        severity: 'positive',
        message: `Your savings rate is ${(savingsRate * 100).toFixed(1)}%, which is healthy`,
        recommendation: 'Consider investing your extra savings for long-term growth'
      });
    }
    
    // 2. Spending insights
    if (spendingRate > this.alertThresholds.highSpending) {
      userData.insights.push({
        type: 'high_spending',
        severity: 'warning',
        message: `You're spending ${(spendingRate * 100).toFixed(1)}% of your income`,
        recommendation: 'Review your expenses and identify areas to cut back'
      });
      
      userData.alerts.push({
        type: 'high_spending_rate',
        message: 'Your spending exceeds 70% of your income',
        timestamp: new Date()
      });
    }
    
    // 3. Financial health insights
    if (profile.assets <= profile.liabilities) {
      userData.insights.push({
        type: 'net_worth',
        severity: 'critical',
        message: 'Your liabilities exceed your assets, indicating financial risk',
        recommendation: 'Focus on paying down high-interest debt and building emergency savings'
      });
      
      userData.alerts.push({
        type: 'negative_net_worth',
        message: 'Your liabilities exceed your assets',
        timestamp: new Date()
      });
    }
    
    // 4. Income insights
    if (profile.income < 1000) {
      userData.insights.push({
        type: 'low_income',
        severity: 'warning',
        message: 'Your income appears to be below sustainable levels',
        recommendation: 'Explore additional income sources or career advancement opportunities'
      });
    }
    
    // Update the user data with new insights and alerts
    this.monitoredUsers.set(userId, userData);
    
    return {
      success: true,
      insightsGenerated: userData.insights.length,
      alertsGenerated: userData.alerts.length
    };
  }

  /**
   * Stop monitoring a user's financial data
   * @param {string} userId - User ID to stop monitoring
   * @returns {Object} - Result of stopping monitoring
   */
  stopMonitoring(userId) {
    if (this.monitoredUsers.has(userId)) {
      this.monitoredUsers.delete(userId);
      this.lastSyncTimes.delete(userId);
      this.logger.info(`Stopped monitoring for user: ${userId}`);
      return {
        success: true,
        message: `Monitoring stopped for user: ${userId}`
      };
    }
    
    return {
      success: false,
      message: `User ${userId} is not being monitored`
    };
  }

  /**
   * Get all insights and alerts for a user
   * @param {string} userId - User ID
   * @returns {Object} - User's financial insights and alerts
   */
  getUserInsights(userId) {
    if (!this.monitoredUsers.has(userId)) {
      return {
        success: false,
        message: `User ${userId} is not being monitored`
      };
    }
    
    const userData = this.monitoredUsers.get(userId);
    const lastSync = this.lastSyncTimes.get(userId);
    
    return {
      success: true,
      userId,
      lastSyncTime: lastSync,
      profile: userData.financialProfile,
      insights: userData.insights,
      alerts: userData.alerts,
      goals: userData.goals
    };
  }

  /**
   * Set financial goals for a user
   * @param {string} userId - User ID
   * @param {Array} goals - Array of financial goals
   * @returns {Object} - Result of setting goals
   */
  setUserGoals(userId, goals) {
    if (!this.monitoredUsers.has(userId)) {
      return {
        success: false,
        message: `User ${userId} is not being monitored`
      };
    }
    
    const userData = this.monitoredUsers.get(userId);
    userData.goals = goals;
    this.monitoredUsers.set(userId, userData);
    
    return {
      success: true,
      message: `Set ${goals.length} goals for user ${userId}`
    };
  }

  /**
   * Override the process method from BaseAgent to handle continuous monitoring
   */
  async process(data) {
    const { action, userId } = data;
    
    switch (action) {
      case 'start_monitoring':
        return this.startMonitoring(userId, data.sources);
      case 'sync_data':
        return this.syncUserData(userId);
      case 'get_insights':
        return this.getUserInsights(userId);
      case 'set_goals':
        return this.setUserGoals(userId, data.goals);
      case 'stop_monitoring':
        return this.stopMonitoring(userId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

module.exports = new ContinuousMonitoringAgent(); 