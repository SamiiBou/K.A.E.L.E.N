const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  emotionAnalysis: {
    color: {
      type: String,
      default: 'bg-gray-300'
    },
    intensity: {
      type: Number,
      default: 0
    },
    emotionType: {
      type: String,
      default: 'neutral'
    }
  },
  scoreChange: {
    type: Number,
    default: 0
  }
});

const ConversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  messages: [MessageSchema],
  totalScore: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  aiState: {
    trust: { type: Number, default: 50 },
    curiosity: { type: Number, default: 50 },
    boredom: { type: Number, default: 20 }
  },
  emotionalProfile: {
    dominantEmotions: [String],
    averageIntensity: Number,
    interactionPatterns: [String],
    keyUserInfo: {
      type: Map,
      of: String,
      default: {}
    },
    favoriteEmotions: [String],
    personalityInsights: [String],
    themeTracker: { type: Map, of: Number, default: {} },
    topics: [String],
    keyInfo: {
      timestamp: Date,
      extractedData: { type: Map, of: mongoose.Schema.Types.Mixed }
    }
  },
  conversationSummary: {
    mainTopics: [String],
    emotionalJourney: String,
    keyRevelations: [String],
    userMood: String
  }
});

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  // Informations World Wallet
  walletAddress: {
    type: String,
    unique: true,
    sparse: true // Permet d'avoir des valeurs null/undefined sans conflit d'unicité
  },
  worldUsername: {
    type: String,
    sparse: true
  },
  profilePictureUrl: {
    type: String
  },
  authMethod: {
    type: String,
    enum: ['traditional', 'world_wallet'],
    default: 'traditional'
  },
  // Ancien système (à maintenir pour la compatibilité)
  username: {
    type: String,
    required: function() {
      return this.authMethod === 'traditional';
    }
  },
  conversations: [ConversationSchema],
  globalStats: {
    totalConversations: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    keyUserInfo: {
      type: Map,
      of: String,
      default: {}
    },
    favoriteEmotions: [String],
    personalityInsights: [String],
    themeTracker: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  memoryContext: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // Score actuel de l'utilisateur (mis à jour en temps réel par le front-end)
  currentScore: {
    type: Number,
    default: 0
  },
  // Solde d'énergie CRU du joueur
  cruBalance: {
    type: Number,
    default: 0
  },
  // Flag pour tracker si l'utilisateur a utilisé son premier message gratuit
  hasUsedFirstMessage: {
    type: Boolean,
    default: false
  },
  // Balance ECHO du joueur (accumulée via différentes actions)
  echoBalance: {
    type: Number,
    default: 0
  },
  // Dernière connexion pour donner le bonus de 0.1 ECHO
  lastConnectionBonus: {
    type: Date,
    default: null
  },
  // Dernière vérification World ID pour la récompense de 1 ECHO
  lastWorldIdVerification: {
    type: Date,
    default: null
  },
  // Dernier claim ECHO (pour réinitialiser la balance)
  lastEchoClaim: {
    type: Date,
    default: null
  },
  // Dernier message envoyé (pour éviter le spam)
  lastMessageSent: {
    type: Date,
    default: null
  },
  // Nombre de messages envoyés aujourd'hui (pour limiter les abus)
  dailyMessageCount: {
    type: Number,
    default: 0
  },
  // Date de réinitialisation du compteur de messages
  dailyMessageCountReset: {
    type: Date,
    default: Date.now
  },
  
  // === PERMISSIONS DE NOTIFICATIONS ===
  // Statut de la permission de notification
  notificationPermission: {
    type: String,
    enum: ['granted', 'denied', 'not_requested', 'unknown'],
    default: 'not_requested'
  },
  // Si la permission a été demandée (pour éviter de redemander)
  notificationPermissionRequested: {
    type: Boolean,
    default: false
  },
  // Timestamp de la dernière demande/mise à jour de permission
  notificationPermissionTimestamp: {
    type: Date,
    default: null
  }
});

// Assure que l'adresse wallet est toujours stockée en minuscules et sans espaces superflus
UserSchema.pre('save', function(next) {
  if (this.walletAddress) {
    this.walletAddress = this.walletAddress.toLowerCase().trim();
  }
  next();
});

// Index pour améliorer les performances de recherche
UserSchema.index({ 'conversations.sessionId': 1 });
UserSchema.index({ currentScore: -1 });
UserSchema.index({ notificationPermission: 1 }); // Pour segmenter les utilisateurs selon leurs permissions

// Méthode pour obtenir le nom d'affichage de l'utilisateur
UserSchema.methods.getDisplayName = function() {
  return this.worldUsername || this.username || this.walletAddress || 'Utilisateur anonyme';
};

module.exports = mongoose.model('User', UserSchema); 