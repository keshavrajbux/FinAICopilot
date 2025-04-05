/**
 * monitoringController.js
 * Controller for managing continuous financial monitoring
 */
const express = require('express');
const router = express.Router();
const continuousMonitoringAgent = require('../agents/ContinuousMonitoringAgent');
const dataExtractionService = require('../services/DataExtractionService');

/**
 * Start monitoring a user's financial data
 * POST /api/monitoring/start
 */
router.post('/start', async (req, res) => {
  try {
    const { userId, sources } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const result = await continuousMonitoringAgent.startMonitoring(userId, sources || []);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Stop monitoring a user's financial data
 * POST /api/monitoring/stop
 */
router.post('/stop', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const result = continuousMonitoringAgent.stopMonitoring(userId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get available data sources for monitoring
 * GET /api/monitoring/sources
 */
router.get('/sources', (req, res) => {
  try {
    // These are the sources we support for data extraction
    const availableSources = [
      { id: 'email', name: 'Email Accounts', description: 'Extract financial data from email receipts and notifications' },
      { id: 'notifications', name: 'Device Notifications', description: 'Access transaction notifications from your device' },
      { id: 'bankAccount', name: 'Bank Accounts', description: 'Connect directly to your bank accounts' },
      { id: 'creditCard', name: 'Credit Cards', description: 'Monitor credit card transactions and balances' }
    ];
    
    return res.status(200).json({ success: true, sources: availableSources });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Manually sync user data from all connected sources
 * POST /api/monitoring/sync
 */
router.post('/sync', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const result = await continuousMonitoringAgent.syncUserData(userId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get insights and alerts for a user
 * GET /api/monitoring/insights/:userId
 */
router.get('/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const result = continuousMonitoringAgent.getUserInsights(userId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Set financial goals for a user
 * POST /api/monitoring/goals
 */
router.post('/goals', async (req, res) => {
  try {
    const { userId, goals } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    if (!Array.isArray(goals)) {
      return res.status(400).json({ success: false, message: 'Goals must be an array' });
    }
    
    const result = continuousMonitoringAgent.setUserGoals(userId, goals);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Connect to a specific data source
 * POST /api/monitoring/connect
 */
router.post('/connect', async (req, res) => {
  try {
    const { userId, source, credentials } = req.body;
    
    if (!userId || !source) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and source are required' 
      });
    }
    
    // In a real app, we would validate the credentials more thoroughly
    if (!credentials || !credentials.apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Valid credentials are required'
      });
    }
    
    const result = await dataExtractionService.connectAndExtract(source, credentials);
    
    if (result.success) {
      // If extraction was successful, start monitoring this source
      await continuousMonitoringAgent.startMonitoring(userId, [source]);
    }
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 