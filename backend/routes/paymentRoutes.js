const express = require('express');
const crypto = require('crypto');
// Utilise fetch global si disponible, sinon fallback vers node-fetch (CommonJS)
const fetch = global.fetch ? global.fetch : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const Payment = require('../models/Payment');
const User = require('../models/User');
const PrizePool = require('../models/PrizePool');

const router = express.Router();

/**
 * Map the CRU package to the amount of WLD to pay.
 */
const PACKAGE_TO_WLD = {
  3: 1,
  8: 2,
  30: 5,
};

/**
 * POST /api/payments/initiate
 * Body: { userId: string, cruPackage: number }
 * Returns: { id: string } where id is the reference for the on-chain payment.
 */
router.post('/initiate', async (req, res) => {
  console.log('[PAY][INIT] 🆕 Incoming request');
  console.log('[PAY][INIT] Headers', req.headers);
  console.log('[PAY][INIT] Body', req.body);
  try {
    const { userId, cruPackage } = req.body;

    if (!userId || !cruPackage) {
      return res.status(400).json({ error: 'userId et cruPackage requis' });
    }

    const wldAmount = PACKAGE_TO_WLD[cruPackage];
    if (!wldAmount) {
      return res.status(400).json({ error: 'cruPackage invalide' });
    }

    const reference = crypto.randomUUID().replace(/-/g, '');

    // Sauvegarde en base pour vérification future
    const paymentDoc = await Payment.create({ reference, userId, cruPackage, wldAmount });
    console.log('[PAY][INIT] Payment document created', paymentDoc);

    return res.json({ id: reference });
  } catch (error) {
    console.error('[PAY][INIT] 🛑 Error', error);
    console.error('Erreur initiate payment:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/payments/confirm
 * Body: { payload: MiniAppPaymentSuccessPayload }
 * Vérifie la transaction via l'API Developer Portal puis crédite le joueur.
 */
router.post('/confirm', async (req, res) => {
  console.log('[PAY][CONFIRM] 🆕 Incoming request');
  console.log('[PAY][CONFIRM] Headers', req.headers);
  console.log('[PAY][CONFIRM] Body', req.body?.payload);
  try {
    // Vérifie que les variables d'environnement sont bien présentes
    if (!process.env.APP_ID || !process.env.DEV_PORTAL_API_KEY) {
      console.warn('[PAY][CONFIRM] ⚠️ APP_ID or DEV_PORTAL_API_KEY not set in env');
    }

    const { payload } = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, error: 'payload manquant' });
    }

    const payment = await Payment.findOne({ reference: payload.reference });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Référence introuvable' });
    }

    // Vérifie via Developer Portal
    console.log('[PAY][CONFIRM] Querying Developer Portal');
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
        },
      }
    );
    const transaction = await response.json();
    console.log('[PAY][CONFIRM] Developer Portal response', transaction);

    console.log('[PAY][CONFIRM] 🌐 Fetch Developer Portal status', response.status);

    if (transaction.reference === payment.reference && transaction.status !== 'failed') {
      console.log('[PAY][CONFIRM] Transaction succeeded, crediting user');
      payment.status = 'success';
      payment.transactionId = payload.transaction_id;
      await payment.save();

      // Créditer l'utilisateur
      const user = await User.findOne({ userId: payment.userId });
      if (user) {
        user.cruBalance = (user.cruBalance || 0) + payment.cruPackage;
        await user.save();
        console.log('[PAY][CONFIRM] User credited', { userId: user.userId, newBalance: user.cruBalance });
      }

      // 🎁 Mise à jour du Prize Pool : +0.7 WLD pour chaque achat de 3 CRU
      if (payment.cruPackage === 3) {
        // On s'attend à un seul document dans la collection
        let pool = await PrizePool.findOne();
        if (!pool) {
          pool = await PrizePool.create({ amount: 20 });
        }
        pool.amount = +(pool.amount + 0.7).toFixed(4); // Arrondi léger
        await pool.save();
        console.log('[PAY][CONFIRM] Prize Pool increased', { newAmount: pool.amount });
      }

      return res.json({ success: true });
    }

    // Si on arrive ici, c'est un échec
    console.warn('[PAY][CONFIRM] Transaction failed or mismatch');
    payment.status = 'failed';
    await payment.save();
    return res.json({ success: false });
  } catch (error) {
    console.error('[PAY][CONFIRM] 🛑 Error', error);
    console.error('Erreur confirm payment:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/payments/confirm-transfer
 * Body: { payload: { transaction_id: string, status: string } }
 * Confirme les transferts directs (utilisateurs indonésiens) et crédite le joueur.
 * Contrairement à /confirm, ce endpoint ne vérifie pas via Developer Portal car
 * les transferts directs n'ont pas de référence de paiement associée.
 */
router.post('/confirm-transfer', async (req, res) => {
  console.log('[TRANSFER][CONFIRM] 🆕 Incoming request');
  console.log('[TRANSFER][CONFIRM] Headers', req.headers);
  console.log('[TRANSFER][CONFIRM] Body', req.body?.payload);
  
  try {
    const { payload } = req.body;
    if (!payload) {
      return res.status(400).json({ success: false, error: 'payload manquant' });
    }

    const { transaction_id, status } = payload;
    if (!transaction_id) {
      return res.status(400).json({ success: false, error: 'transaction_id manquant' });
    }

    // Vérifier si la transaction a réussi
    if (status === 'error') {
      console.log('[TRANSFER][CONFIRM] Transaction failed with error status');
      return res.json({ success: false, error: 'Transaction failed' });
    }

    console.log('[TRANSFER][CONFIRM] ✅ Transaction succeeded, looking for pending payment to credit');

    // 🔑 CORRECTION: Pour les transferts, nous devons trouver le dernier paiement en attente
    // car ils n'ont pas de référence spécifique comme les paiements normaux
    
    // Chercher le dernier paiement en attente de la même journée (dans les dernières 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingPayment = await Payment.findOne({ 
      status: 'pending',
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 }); // Le plus récent en premier

    if (!pendingPayment) {
      console.warn('[TRANSFER][CONFIRM] ⚠️ No pending payment found for transfer');
      return res.status(404).json({ 
        success: false, 
        error: 'Aucun paiement en attente trouvé pour ce transfert' 
      });
    }

    console.log('[TRANSFER][CONFIRM] 📋 Found pending payment:', {
      reference: pendingPayment.reference,
      userId: pendingPayment.userId,
      cruPackage: pendingPayment.cruPackage
    });

    // Marquer le paiement comme réussi
    pendingPayment.status = 'success';
    pendingPayment.transactionId = transaction_id;
    await pendingPayment.save();

    // Créditer l'utilisateur
    const user = await User.findOne({ userId: pendingPayment.userId });
    if (user) {
      user.cruBalance = (user.cruBalance || 0) + pendingPayment.cruPackage;
      await user.save();
      console.log('[TRANSFER][CONFIRM] ✅ User credited', { 
        userId: user.userId, 
        creditsAdded: pendingPayment.cruPackage,
        newBalance: user.cruBalance 
      });
    } else {
      console.warn('[TRANSFER][CONFIRM] ⚠️ User not found:', pendingPayment.userId);
    }

    // 🎁 Mise à jour du Prize Pool : +0.7 WLD pour chaque achat de 3 CRU
    if (pendingPayment.cruPackage === 3) {
      let pool = await PrizePool.findOne();
      if (!pool) {
        pool = await PrizePool.create({ amount: 20 });
      }
      pool.amount = +(pool.amount + 0.7).toFixed(4);
      await pool.save();
      console.log('[TRANSFER][CONFIRM] 🎁 Prize Pool increased', { newAmount: pool.amount });
    }

    return res.json({ 
      success: true,
      creditsAdded: pendingPayment.cruPackage,
      newBalance: user ? user.cruBalance : 0
    });

  } catch (error) {
    console.error('[TRANSFER][CONFIRM] 🛑 Error', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router; 