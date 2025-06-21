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
    themeTracker: { type: Map, of: Number, default: {} }
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
UserSchema.index({ userId: 1 });
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ 'conversations.sessionId': 1 });
UserSchema.index({ currentScore: -1 });

// Méthode pour obtenir le nom d'affichage de l'utilisateur
UserSchema.methods.getDisplayName = function() {
  return this.worldUsername || this.username || this.walletAddress || 'Utilisateur anonyme';
};

module.exports = mongoose.model('User', UserSchema); 