const express = require('express');
const router = express.Router();
const EchoBalanceService = require('../services/echoBalanceService');

// GET /api/echo-balance/:userId - Récupérer la balance et donner le bonus de connexion
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    // Essayer de donner le bonus de connexion
    const connectionBonus = await EchoBalanceService.giveConnectionBonus(userId);
    
    // Récupérer la balance actuelle
    const balanceInfo = await EchoBalanceService.getBalance(userId);
    
    res.json({
      success: true,
      balance: balanceInfo.balance || 0,
      lastClaim: balanceInfo.lastClaim,
      dailyMessageCount: balanceInfo.dailyMessageCount || 0,
      connectionBonus: connectionBonus
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/echo-balance/:userId/reset - Réinitialiser la balance après un claim
router.post('/:userId/reset', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const result = await EchoBalanceService.resetBalance(userId);
    
    if (result.success) {
      res.json({
        success: true,
        claimedAmount: result.claimedAmount,
        newBalance: result.newBalance
      });
    } else {
      res.status(400).json({ error: 'Failed to reset balance' });
    }
  } catch (error) {
    console.error('Error resetting balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 