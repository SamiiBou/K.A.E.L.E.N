const express = require('express');
const router = express.Router();
const EchoBalanceService = require('../services/echoBalanceService');

// POST /api/world-id-verify - Récompenser la vérification World ID avec 1 ECHO
router.post('/', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID required' 
      });
    }
    
    console.log(`🌍 Tentative de récompense World ID pour l'utilisateur: ${userId}`);
    
    const result = await EchoBalanceService.giveWorldIdVerificationReward(userId);
    
    if (result.success) {
      console.log(`✅ Récompense World ID accordée: ${result.reward} ECHO pour ${userId}`);
      res.json({
        success: true,
        newBalance: result.newBalance,
        reward: result.reward,
        message: `+${result.reward} ECHO for World ID verification`
      });
    } else {
      // Si c'est un cooldown, retourner un status 429 (Too Many Requests)
      if (result.message && result.message.includes('already claimed')) {
        console.log(`⏰ Cooldown actif pour ${userId}: ${result.cooldownHours}h ${result.cooldownMinutes}m`);
        res.status(429).json({
          success: false,
          error: result.message,
          cooldownHours: result.cooldownHours || 0,
          cooldownMinutes: result.cooldownMinutes || 0
        });
      } else {
        console.log(`❌ Erreur lors de la récompense World ID pour ${userId}: ${result.message}`);
        res.status(400).json({ 
          success: false,
          error: result.message || 'Failed to give World ID reward' 
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur serveur lors de la récompense World ID:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router; 