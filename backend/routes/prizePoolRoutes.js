const express = require('express');
const PrizePool = require('../models/PrizePool');

const router = express.Router();

/**
 * GET /api/prize-pool/current
 * Renvoie le montant actuel du Prize Pool (en WLD).
 */
router.get('/current', async (req, res) => {
  try {
    // On s'attend à un seul document dans la collection.
    let pool = await PrizePool.findOne();

    // Si aucun document, on l'initialise à 20 WLD
    if (!pool) {
      pool = await PrizePool.create({ amount: 20 });
    }

    res.json({ amount: pool.amount });
  } catch (error) {
    console.error('[PRIZE] Error retrieving prize pool', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/prize-pool/force-refresh
 * Force le refresh du prize pool côté frontend (invisible à l'utilisateur)
 */
router.post('/force-refresh', async (req, res) => {
  try {
    console.log('[PRIZE] Force refresh demandé');
    
    // Récupérer la valeur actuelle du prize pool
    let pool = await PrizePool.findOne();
    
    if (!pool) {
      pool = await PrizePool.create({ amount: 2 });
    }
    
    // Retourner la valeur actuelle avec un flag de refresh
    res.json({ 
      amount: pool.amount,
      refreshed: true,
      timestamp: new Date().toISOString()
    });
    
    console.log(`[PRIZE] Force refresh envoyé: ${pool.amount} WLD`);
  } catch (error) {
    console.error('[PRIZE] Error force refresh', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 