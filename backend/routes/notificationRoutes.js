const express = require('express');
const User = require('../models/User');

const router = express.Router();

/**
 * PUT /api/notifications/permission
 * Met à jour le statut des permissions de notifications pour un utilisateur
 */
router.put('/permission', async (req, res) => {
  try {
    const { userId, walletAddress, status, timestamp } = req.body;

    // Validation des paramètres
    if (!userId && !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'userId ou walletAddress requis'
      });
    }

    if (!status || !['granted', 'denied', 'not_requested', 'unknown'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide. Valeurs acceptées: granted, denied, not_requested, unknown'
      });
    }

    // Construire la requête de recherche
    const query = {};
    if (userId) {
      query.userId = userId;
    } else {
      // Normaliser l'adresse wallet
      query.walletAddress = walletAddress.toLowerCase().trim();
    }

    console.log('🔔 [Notifications] Mise à jour permission:', {
      query,
      status,
      timestamp: timestamp ? new Date(timestamp).toISOString() : 'N/A'
    });

    // Trouver et mettre à jour l'utilisateur
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les champs de notification
    user.notificationPermission = status;
    user.notificationPermissionRequested = true;
    user.notificationPermissionTimestamp = timestamp ? new Date(timestamp) : new Date();

    await user.save();

    console.log('✅ [Notifications] Permission mise à jour:', {
      userId: user.userId,
      walletAddress: user.walletAddress,
      newStatus: status,
      timestamp: user.notificationPermissionTimestamp
    });

    res.json({
      success: true,
      data: {
        userId: user.userId,
        notificationPermission: user.notificationPermission,
        notificationPermissionRequested: user.notificationPermissionRequested,
        notificationPermissionTimestamp: user.notificationPermissionTimestamp
      }
    });

  } catch (error) {
    console.error('❌ [Notifications] Erreur mise à jour permission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour des permissions'
    });
  }
});

/**
 * GET /api/notifications/permission/:identifier
 * Récupère le statut des permissions de notifications pour un utilisateur
 */
router.get('/permission/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { type } = req.query; // 'userId' ou 'wallet'

    // Construire la requête de recherche
    const query = {};
    if (type === 'wallet') {
      query.walletAddress = identifier.toLowerCase().trim();
    } else {
      // Par défaut, chercher par userId
      query.userId = identifier;
    }

    console.log('🔍 [Notifications] Récupération permission:', query);

    const user = await User.findOne(query, {
      userId: 1,
      walletAddress: 1,
      notificationPermission: 1,
      notificationPermissionRequested: 1,
      notificationPermissionTimestamp: 1
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        notificationPermission: user.notificationPermission || 'not_requested',
        notificationPermissionRequested: user.notificationPermissionRequested || false,
        notificationPermissionTimestamp: user.notificationPermissionTimestamp
      }
    });

  } catch (error) {
    console.error('❌ [Notifications] Erreur récupération permission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des permissions'
    });
  }
});

/**
 * GET /api/notifications/stats
 * Récupère les statistiques des permissions de notifications
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 [Notifications] Récupération statistiques');

    const stats = await User.aggregate([
      {
        $group: {
          _id: '$notificationPermission',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Calculer le total et les pourcentages
    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const detailed = stats.map(stat => ({
      status: stat.status || 'not_requested',
      count: stat.count,
      percentage: total > 0 ? Math.round((stat.count / total) * 100) : 0
    }));

    // S'assurer que tous les statuts sont présents
    const allStatuses = ['granted', 'denied', 'not_requested', 'unknown'];
    const completeStats = allStatuses.map(status => {
      const found = detailed.find(stat => stat.status === status);
      return found || { status, count: 0, percentage: 0 };
    });

    res.json({
      success: true,
      data: {
        total,
        breakdown: completeStats,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('❌ [Notifications] Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

/**
 * GET /api/notifications/users
 * Récupère la liste des utilisateurs selon leur statut de permission
 */
router.get('/users', async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

    // Construire le filtre
    const filter = {};
    if (status && ['granted', 'denied', 'not_requested', 'unknown'].includes(status)) {
      filter.notificationPermission = status;
    }

    console.log('👥 [Notifications] Récupération utilisateurs:', {
      filter,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const users = await User.find(filter, {
      userId: 1,
      walletAddress: 1,
      worldUsername: 1,
      notificationPermission: 1,
      notificationPermissionTimestamp: 1,
      lastSeen: 1
    })
    .sort({ notificationPermissionTimestamp: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('❌ [Notifications] Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
});

module.exports = router; 