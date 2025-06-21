const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const User = require('../models/User');

// GET /api/users/leaderboard - Obtenir le classement global (avant toutes les routes /:userId)
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 100, userId } = req.query;

    const walletFilter = { walletAddress: { $exists: true, $ne: null } };
    const topUsers = await User.find(walletFilter).sort({ currentScore: -1 }).limit(parseInt(limit)).select('userId worldUsername walletAddress profilePictureUrl currentScore');

    let userRank = null;
    if (userId) {
      const currentUser = await User.findOne({ userId });
      if (currentUser) {
        const higherCount = await User.countDocuments({ ...walletFilter, currentScore: { $gt: currentUser.currentScore } });
        userRank = higherCount + 1;
      }
    }

    const totalPlayers = await User.countDocuments(walletFilter);

    res.json({ success: true, leaderboard: topUsers, userRank, totalPlayers });
  } catch (error) {
    console.error('Erreur récupération leaderboard:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du leaderboard' });
  }
});

// POST /api/users - Créer ou récupérer un utilisateur
router.post('/', async (req, res) => {
  try {
    const { userId, username } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId est requis' });
    }
    
    const user = await UserService.findOrCreateUser(userId, username);
    res.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        globalStats: user.globalStats,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
        hasMemory: user.memoryContext.length > 0,
        cruBalance: user.cruBalance || 0
      }
    });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création utilisateur' });
  }
});

// GET /api/users/:userId - Récupérer l'historique d'un utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await UserService.getUserHistory(userId);
    
    if (!history) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'historique' });
  }
});

// POST /api/users/:userId/conversations - Démarrer une nouvelle conversation
router.post('/:userId/conversations', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;
    
    const result = await UserService.startNewConversation(userId, username);
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      user: {
        userId: result.user.userId,
        username: result.user.username,
        memoryContext: result.user.memoryContext
      }
    });
  } catch (error) {
    console.error('Erreur démarrage conversation:', error);
    res.status(500).json({ error: 'Erreur serveur lors du démarrage de la conversation' });
  }
});

// GET /api/users/:userId/conversations/:sessionId - Récupérer une conversation
router.get('/:userId/conversations/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const conversation = await UserService.getConversationMessages(userId, sessionId);
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Erreur récupération conversation:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la conversation' });
  }
});

// POST /api/users/:userId/conversations/:sessionId/messages - Sauvegarder un message
router.post('/:userId/conversations/:sessionId/messages', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { message, emotionAnalysis, scoreChange } = req.body;
    
    if (!message || !message.role || !message.content) {
      return res.status(400).json({ error: 'Message invalide' });
    }
    
    const result = await UserService.saveMessage(userId, sessionId, message, emotionAnalysis, scoreChange);
    
    res.json({
      success: true,
      message: result.message,
      conversationScore: result.conversation.totalScore,
      memoryContext: result.user.memoryContext
    });
  } catch (error) {
    console.error('Erreur sauvegarde message:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde du message' });
  }
});

// DELETE /api/users/:userId/conversations/:sessionId - Supprimer une conversation
router.delete('/:userId/conversations/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    await UserService.deleteConversation(userId, sessionId);
    
    res.json({
      success: true,
      message: 'Conversation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression conversation:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de la conversation' });
  }
});

// GET /api/users/:userId/memory - Récupérer le contexte mémoire d'un utilisateur
router.get('/:userId/memory', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserService.findOrCreateUser(userId);
    
    res.json({
      success: true,
      memoryContext: user.memoryContext,
      globalStats: user.globalStats
    });
  } catch (error) {
    console.error('Erreur récupération mémoire:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la mémoire' });
  }
});

// PUT /api/users/:userId/score - Met à jour le score actuel de l'utilisateur
router.put('/:userId/score', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentScore } = req.body;

    if (typeof currentScore !== 'number') {
      return res.status(400).json({ error: 'currentScore doit être un nombre' });
    }

    const user = await UserService.findOrCreateUser(userId);
    user.currentScore = currentScore;
    await user.save();

    res.json({
      success: true,
      currentScore: user.currentScore
    });
  } catch (error) {
    console.error('Erreur mise à jour score:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du score' });
  }
});

module.exports = router; 