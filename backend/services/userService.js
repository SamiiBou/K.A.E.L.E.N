const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const MemoryService = require('./memoryService');

class UserService {
  // Crée un nouvel utilisateur ou récupère un existant
  static async findOrCreateUser(userId, username = 'Utilisateur Anonyme') {
    try {
      // Utilisation d'une opération atomique pour éviter les conditions de course
      const user = await User.findOneAndUpdate(
        { userId }, // Critère de recherche
        {
          $setOnInsert: { // Seulement lors de la création
            userId,
            username,
            conversations: [],
            globalStats: {
              totalConversations: 0,
              totalMessages: 0,
              highestScore: 0,
              averageScore: 0,
              favoriteEmotions: [],
              personalityInsights: [],
              themeTracker: {}
            },
            memoryContext: '',
            createdAt: new Date()
          },
          $set: { // À chaque fois
            lastSeen: new Date()
          }
        },
        {
          upsert: true, // Créer si n'existe pas
          new: true,    // Retourner le document modifié
          runValidators: true
        }
      );
      
      // Log seulement si c'est une création (pas de lastSeen précédent récent)
      const wasJustCreated = new Date() - user.createdAt < 1000;
      if (wasJustCreated) {
        console.log(`✅ Nouvel utilisateur créé: ${userId}`);
      } else {
        console.log(`🔄 Utilisateur existant récupéré: ${userId}`);
      }
      
      return user;
    } catch (error) {
      console.error('❌ Erreur lors de la création/récupération utilisateur:', error);
      throw error;
    }
  }

  // Démarre une nouvelle conversation
  static async startNewConversation(userId, username) {
    try {
      const user = await this.findOrCreateUser(userId, username);
      const sessionId = uuidv4();
      
      const newConversation = {
        sessionId,
        messages: [],
        totalScore: 0,
        startedAt: new Date(),
        lastActivity: new Date(),
        aiState: {
          trust: 50,
          curiosity: 50,
          boredom: 20
        },
        emotionalProfile: {
          dominantEmotions: [],
          averageIntensity: 0,
          interactionPatterns: []
        }
      };
      
      user.conversations.push(newConversation);
      user.globalStats.totalConversations += 1;
      await user.save();
      
      return { user, sessionId };
    } catch (error) {
      console.error('Erreur lors du démarrage conversation:', error);
      throw error;
    }
  }

  // Récupère une conversation existante
  static async getConversation(userId, sessionId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      const conversation = user.conversations.find(conv => conv.sessionId === sessionId);
      if (!conversation) {
        // Si la conversation n'existe pas, en créer une nouvelle
        const result = await this.startNewConversation(userId, user.username);
        return result;
      }
      
      return { user, conversation };
    } catch (error) {
      console.error('Erreur lors de la récupération conversation:', error);
      throw error;
    }
  }

  // Sauvegarde un message dans la conversation
  static async saveMessage(userId, sessionId, message, emotionAnalysis = null, scoreChange = 0, newAiState = null, newThemeTracker = null) {
    try {
      const user = await User.findOne({ userId });
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      const conversation = user.conversations.find(conv => conv.sessionId === sessionId);
      if (!conversation) {
        throw new Error('Conversation non trouvée');
      }
      
      // Ajoute le message avec l'analyse émotionnelle
      const newMessage = {
        id: message.id || Date.now().toString(),
        role: message.role,
        content: message.content,
        timestamp: message.timestamp || new Date(),
        emotionAnalysis,
        scoreChange: message.role === 'assistant' ? scoreChange : 0
      };
      
      conversation.messages.push(newMessage);
      conversation.lastActivity = new Date();
      
      // Met à jour l'état de l'IA de la conversation
      if (newAiState && message.role === 'assistant') {
        conversation.aiState = newAiState;
      }

      // Met à jour le tracker de thèmes à long terme de l'utilisateur
      if (newThemeTracker && message.role === 'assistant') {
        user.globalStats.themeTracker = newThemeTracker;
      }

      // Met à jour le score total de la conversation
      if (scoreChange !== 0) {
        conversation.totalScore += scoreChange;
        // Synchronise le score courant au niveau utilisateur
        user.currentScore = conversation.totalScore;
      }
      
      // Met à jour le profil émotionnel de la conversation
      if (emotionAnalysis && message.role === 'assistant') {
        const profile = MemoryService.analyzeEmotionalProfile(conversation.messages);
        conversation.emotionalProfile = {
          dominantEmotions: profile.dominantEmotions,
          averageIntensity: profile.averageIntensity,
          interactionPatterns: []
        };
      }
      
      // Appel de l'extraction d'info après avoir sauvegardé le message
      if (message.role === 'assistant') {
        await MemoryService.extractAndStoreKeyInfo(user, conversation);
      }
      
      await user.save();
      
      // Met à jour les statistiques globales si c'est un message de l'utilisateur
      if (message.role === 'user') {
        await MemoryService.updateUserStats(userId, newMessage, emotionAnalysis, scoreChange, conversation);
      }
      
      return { user, conversation, message: newMessage };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde message:', error);
      throw error;
    }
  }

  // Récupère l'historique complet d'un utilisateur
  static async getUserHistory(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) {
        return null;
      }
      
      // Trie les conversations par date de dernière activité
      user.conversations.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      
      return {
        userId: user.userId,
        username: user.username,
        globalStats: user.globalStats,
        totalConversations: user.conversations.length,
        conversations: user.conversations.map(conv => ({
          sessionId: conv.sessionId,
          messageCount: conv.messages.length,
          totalScore: conv.totalScore,
          startedAt: conv.startedAt,
          lastActivity: conv.lastActivity,
          emotionalProfile: conv.emotionalProfile
        })),
        memoryContext: user.memoryContext,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen
      };
    } catch (error) {
      console.error('Erreur lors de la récupération historique:', error);
      throw error;
    }
  }

  // Récupère les messages d'une conversation spécifique
  static async getConversationMessages(userId, sessionId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      const conversation = user.conversations.find(conv => conv.sessionId === sessionId);
      if (!conversation) {
        throw new Error('Conversation non trouvée');
      }
      
      return {
        sessionId: conversation.sessionId,
        messages: conversation.messages,
        totalScore: conversation.totalScore,
        emotionalProfile: conversation.emotionalProfile,
        startedAt: conversation.startedAt,
        lastActivity: conversation.lastActivity
      };
    } catch (error) {
      console.error('Erreur lors de la récupération messages:', error);
      throw error;
    }
  }

  // Supprime une conversation
  static async deleteConversation(userId, sessionId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      const conversationIndex = user.conversations.findIndex(conv => conv.sessionId === sessionId);
      if (conversationIndex === -1) {
        throw new Error('Conversation non trouvée');
      }
      
      user.conversations.splice(conversationIndex, 1);
      user.globalStats.totalConversations = Math.max(0, user.globalStats.totalConversations - 1);
      
      // Recalcule les statistiques globales
      await this.recalculateGlobalStats(user);
      await user.save();
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression conversation:', error);
      throw error;
    }
  }

  // Recalcule les statistiques globales d'un utilisateur
  static async recalculateGlobalStats(user) {
    let totalMessages = 0;
    let totalScore = 0;
    let highestScore = 0;
    const allEmotions = [];
    
    user.conversations.forEach(conv => {
      totalMessages += conv.messages.length;
      totalScore += conv.totalScore;
      
      if (conv.totalScore > highestScore) {
        highestScore = conv.totalScore;
      }
      
      conv.messages.forEach(msg => {
        if (msg.emotionAnalysis && msg.emotionAnalysis.emotionType) {
          allEmotions.push(msg.emotionAnalysis.emotionType);
        }
      });
    });
    
    // Calcule les émotions les plus fréquentes
    const emotionCounts = {};
    allEmotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    const favoriteEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);
    
    user.globalStats = {
      totalConversations: user.conversations.length,
      totalMessages,
      highestScore,
      averageScore: totalMessages > 0 ? totalScore / totalMessages : 0,
      favoriteEmotions,
      personalityInsights: MemoryService.analyzePersonalityTraits(user)
    };
    
    // Régénère le contexte mémoire
    user.memoryContext = MemoryService.generateMemoryContext(user);
  }
}

module.exports = UserService; 