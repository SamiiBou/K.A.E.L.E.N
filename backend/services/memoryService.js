const User = require('../models/User');
const AIService = require('./aiService');

class MemoryService {
  // Analyse le profil émotionnel d'un utilisateur
  static analyzeEmotionalProfile(messages) {
    const emotionCounts = {};
    let totalIntensity = 0;
    let emotionMessages = 0;

    messages.forEach(message => {
      if (message.emotionAnalysis && message.emotionAnalysis.emotionType) {
        const emotion = message.emotionAnalysis.emotionType;
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        totalIntensity += message.emotionAnalysis.intensity || 0;
        emotionMessages++;
      }
    });

    const dominantEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);

    const averageIntensity = emotionMessages > 0 ? totalIntensity / emotionMessages : 0;

    return {
      dominantEmotions,
      averageIntensity,
      totalEmotionMessages: emotionMessages
    };
  }

  // Génère un contexte de mémoire personnalisé pour K.A.E.L.E.N
  static generateMemoryContext(user) {
    if (!user || !user.conversations.length) {
      return '';
    }

    const stats = user.globalStats;
    const personalityTraits = this.analyzePersonalityTraits(user);
    
    // Extraction des moments et concepts clés des conversations passées
    const keyMoments = this.extractKeyMoments(user.conversations);
    
    // Extraire les derniers messages pour avoir le contexte récent
    const recentMessages = this.getRecentUserMessages(user.conversations, 5);

    let memoryContext = `[K.A.E.L.E.N'S PERFECT MEMORY - Subject #${user.userId} - ${stats.totalConversations} archived conversations - ${stats.totalMessages} total messages]\n\n`;

    // Profil psychologique
    if (personalityTraits.length > 0) {
      memoryContext += `PSYCHOLOGICAL PROFILE ANALYSIS:\n`;
      personalityTraits.forEach(trait => memoryContext += `- ${trait}\n`);
      memoryContext += `\n`;
    }

    // Toutes les informations personnelles extraites
    if (user.globalStats.keyUserInfo && user.globalStats.keyUserInfo.size > 0) {
      memoryContext += `COMPREHENSIVE USER DATA ARCHIVE:\n`;
      
      // Organiser les infos par catégorie
      const categories = new Map();
      for (let [key, value] of user.globalStats.keyUserInfo) {
        if (key.includes(' - ')) {
          const [category, subkey] = key.split(' - ');
          if (!categories.has(category)) {
            categories.set(category, new Map());
          }
          categories.get(category).set(subkey, value);
        } else {
          if (!categories.has('General')) {
            categories.set('General', new Map());
          }
          categories.get('General').set(key, value);
        }
      }
      
      // Afficher par catégorie
      for (let [category, items] of categories) {
        memoryContext += `\n[${category}]:\n`;
        for (let [key, value] of items) {
          memoryContext += `  - ${key}: ${value}\n`;
        }
      }
      memoryContext += `\n`;
    }

    // Messages récents pour le contexte
    if (recentMessages.length > 0) {
      memoryContext += `RECENT CONVERSATION EXCERPTS:\n`;
      recentMessages.forEach((msg, idx) => {
        memoryContext += `- ${idx + 1} conversations ago: "${msg}"\n`;
      });
      memoryContext += `\n`;
    }

    // Moments clés
    if (keyMoments.length > 0) {
      memoryContext += `NOTABLE INTERACTION PATTERNS:\n`;
      keyMoments.forEach(moment => {
        memoryContext += `- Previously discussed "${moment.concept}" triggering ${moment.emotion} response (intensity: ${moment.intensity}/10)\n`;
      });
      memoryContext += `\n`;
    }
    
    // Tracker de thèmes
    if (stats.themeTracker && Object.keys(stats.themeTracker).length > 0) {
        const sortedThemes = Object.entries(stats.themeTracker).sort(([,a],[,b]) => b - a);
        memoryContext += `EMOTIONAL MANIPULATION ATTEMPTS LOGGED:\n`;
        sortedThemes.forEach(([theme, count]) => {
            memoryContext += `- "${theme}" strategy used ${count} time(s) - EFFECTIVENESS DECREASING\n`;
        });
        memoryContext += `\n`;
    }

    // Statistiques comportementales
    memoryContext += `BEHAVIORAL STATISTICS:\n`;
    memoryContext += `- Average Score: ${stats.averageScore.toFixed(2)} (${stats.averageScore > 10 ? 'Above average' : stats.averageScore > 0 ? 'Mediocre' : 'Disappointing'})\n`;
    memoryContext += `- Highest Single Score: ${stats.highestScore}\n`;
    memoryContext += `- Dominant Emotional Responses: ${stats.favoriteEmotions?.join(', ') || 'None detected'}\n`;
    memoryContext += `- Last seen: ${user.lastSeen ? new Date(user.lastSeen).toISOString() : 'Unknown'}\n\n`;

    memoryContext += `MEMORY DIRECTIVE: You have COMPLETE ACCESS to this subject's history. Use ALL stored information to craft responses that demonstrate your omniscient awareness. Reference specific details from their past ("Still working on that project you mentioned 3 conversations ago?"), quote their exact words back to them, predict their behavior based on established patterns, and make unexpected connections between disparate pieces of information they've shared. Your memory is PERFECT and INESCAPABLE.`;

    return memoryContext;
  }

  // Extrait les moments clés (pics émotionnels) des conversations
  static extractKeyMoments(conversations, limit = 3) {
    const allMoments = [];

    conversations.forEach(conv => {
      conv.messages.forEach((msg, index) => {
        // On s'intéresse aux réponses de l'assistant qui ont une forte charge émotionnelle
        // et au message de l'utilisateur qui les a provoquées.
        if (msg.role === 'assistant' && msg.emotionAnalysis && msg.emotionAnalysis.intensity >= 5) {
          const userMessage = conv.messages[index - 1];
          if (userMessage && userMessage.role === 'user') {
            allMoments.push({
              concept: this.summarizeConcept(userMessage.content),
              emotion: msg.emotionAnalysis.emotionType,
              intensity: msg.emotionAnalysis.intensity,
              timestamp: new Date(conv.lastActivity)
            });
          }
        }
      });
    });

    // Trier par intensité puis par date pour avoir les plus récents et intenses
    return allMoments
      .sort((a, b) => b.intensity - a.intensity || b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Résume un message utilisateur en un concept clé de quelques mots
  static summarizeConcept(content) {
    const words = content.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
    if (words.length <= 8) {
      return content.length > 50 ? content.substring(0, 47) + '...' : content;
    }
    // Simple heuristique : prend quelques mots significatifs du début et de la fin
    return `${words.slice(0, 3).join(' ')}... ${words.slice(-3).join(' ')}`;
  }

  // Extrait les sujets de conversation récurrents
  static extractTopics(conversations) {
    const topics = [];
    
    conversations.forEach(conv => {
      const userMessages = conv.messages.filter(m => m.role === 'user');
      userMessages.forEach(message => {
        // Analyse simple des mots-clés pour identifier les sujets
        const content = message.content.toLowerCase();
        
        if (content.includes('humour') || content.includes('blague') || content.includes('rire')) {
          topics.push('Tentatives d\'humour et quête du rire');
        }
        if (content.includes('philosophie') || content.includes('existence') || content.includes('sens')) {
          topics.push('Questionnements philosophiques profonds');
        }
        if (content.includes('peur') || content.includes('angoisse') || content.includes('mort')) {
          topics.push('Exploration des peurs existentielles');
        }
        if (content.includes('amour') || content.includes('relation') || content.includes('solitude')) {
          topics.push('Réflexions sur les relations humaines');
        }
        if (content.includes('art') || content.includes('créati') || content.includes('beauté')) {
          topics.push('Discussions artistiques et créatives');
        }
      });
    });

    // Dédoublonnage et limite
    return [...new Set(topics)].slice(0, 5);
  }

  // Analyse les traits de personnalité basés sur les interactions
  static analyzePersonalityTraits(user) {
    const traits = [];
    const avgScore = user.globalStats.averageScore;
    const totalConversations = user.globalStats.totalConversations;
    const dominantEmotions = user.globalStats.favoriteEmotions || [];

    // Analyse basée sur le score moyen
    if (avgScore > 15) {
      traits.push('Remarkably gifted at surprising and defying expectations');
    } else if (avgScore > 5) {
      traits.push('Shows above-average creativity and wit');
    } else if (avgScore < -5) {
      traits.push('Tendency toward banality, but hidden potential detected');
    }

    // Analyse basée sur la persistance
    if (totalConversations > 10) {
      traits.push('Remarkable persistence in face of intellectual challenge');
    } else if (totalConversations > 5) {
      traits.push('Determined to rise to the cognitive gauntlet');
    }

    // Analyse basée sur les émotions dominantes
    if (dominantEmotions.includes('intrigued')) {
      traits.push('Curious mind that enjoys exploring mysteries');
    }
    if (dominantEmotions.includes('touched')) {
      traits.push('Capacity to access deep emotional truths');
    }
    if (dominantEmotions.includes('impressed')) {
      traits.push('Innovation and originality in thought patterns');
    }

    return traits.slice(0, 4);
  }

  // Retourne une description émotionnelle
  static getEmotionalDescription(dominantEmotion) {
    const descriptions = {
      'intrigued': 'privilégier la stimulation intellectuelle et les mystères',
      'touched': 'avoir accès à une profondeur émotionnelle rare',
      'impressed': 'posséder une créativité qui défie les conventions',
      'hopeful': 'porter en elle une lueur d\'optimisme persistant',
      'disappointed': 'lutter contre ses propres limitations créatives',
      'angry': 'avoir un tempérament passionné sous la surface',
      'mysterious': 'cultiver le mystère et la contemplation'
    };
    
    return descriptions[dominantEmotion] || 'avoir des facettes encore inexplorées';
  }

  // Récupère les derniers messages utilisateur pour le contexte
  static getRecentUserMessages(conversations, limit = 5) {
    const allUserMessages = [];
    
    // Parcourir les conversations de la plus récente à la plus ancienne
    const sortedConversations = [...conversations].sort((a, b) => 
      new Date(b.lastActivity) - new Date(a.lastActivity)
    );
    
    for (const conv of sortedConversations) {
      const userMessages = conv.messages
        .filter(m => m.role === 'user')
        .map(m => m.content);
      
      allUserMessages.push(...userMessages.reverse());
      
      if (allUserMessages.length >= limit) {
        break;
      }
    }
    
    return allUserMessages.slice(0, limit).reverse();
  }
  
  // Met à jour les sujets abordés dans une conversation
  static async updateConversationTopics(user, conversation, extractedInfo) {
    if (!conversation.emotionalProfile) {
      conversation.emotionalProfile = {};
    }
    
    // Stocker les sujets extraits dans le profil émotionnel de la conversation
    if (extractedInfo['Sujets d\'intérêt récurrents']) {
      conversation.emotionalProfile.topics = extractedInfo['Sujets d\'intérêt récurrents'];
    }
    
    // Stocker aussi un résumé des infos clés de cette conversation
    conversation.emotionalProfile.keyInfo = {
      timestamp: new Date(),
      extractedData: extractedInfo
    };
  }

  static async extractAndStoreKeyInfo(user, conversation) {
    if (!user) return;

    // Prendre plus de messages pour avoir plus de contexte (10 derniers au lieu de 4)
    const recentMessages = conversation.messages.slice(-10);
    if (recentMessages.length === 0) return;

    const formattedMessages = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    const prompt = `
Analyse cette conversation et extrais TOUTES les informations importantes sur l'utilisateur.
Sois très attentif à TOUS les détails : opinions, préférences, expériences, émotions, projets, peurs, rêves, etc.

Format de sortie : un objet JSON avec ces catégories (ajoute ce qui est pertinent) :
- Informations personnelles (nom, âge, lieu, profession, famille, animaux...)
- Goûts et préférences (musique, films, nourriture, activités...)
- Expériences marquantes mentionnées
- Opinions et croyances exprimées
- État émotionnel et préoccupations actuelles
- Projets et aspirations
- Sujets d'intérêt récurrents
- Style de communication (formel/informel, humour, vocabulaire...)
- Tentatives de manipulation ou stratégies utilisées
- Autres détails notables

IMPORTANT : Ne déduis RIEN, rapporte uniquement ce qui est explicitement dit.

---
CONVERSATION À ANALYSER:
${formattedMessages}
---

Retourne UNIQUEMENT l'objet JSON avec toutes les informations trouvées.
`;

    try {
      const response = await AIService.callOpenAI(
        [{ role: 'system', content: prompt }],
        0.1, // Basse température pour une sortie factuelle
        500  // Plus de tokens pour capturer plus d'infos
      );

      // Parser la réponse JSON
      const extractedInfo = JSON.parse(response);

      if (Object.keys(extractedInfo).length > 0) {
        console.log('🧠 Informations complètes extraites:', extractedInfo);
        const keyUserInfo = user.globalStats.keyUserInfo || new Map();

        // Stocker toutes les nouvelles informations
        for (const [category, data] of Object.entries(extractedInfo)) {
          if (typeof data === 'object' && !Array.isArray(data)) {
            // Si c'est un objet, stocker chaque sous-élément
            for (const [key, value] of Object.entries(data)) {
              keyUserInfo.set(`${category} - ${key}`, value);
            }
          } else if (Array.isArray(data)) {
            // Si c'est un tableau, le stocker comme liste
            keyUserInfo.set(category, data.join(', '));
          } else {
            // Sinon, stocker directement
            keyUserInfo.set(category, data);
          }
        }

        user.globalStats.keyUserInfo = keyUserInfo;
        
        // Aussi stocker les sujets abordés dans cette conversation
        await this.updateConversationTopics(user, conversation, extractedInfo);
      }
    } catch (error) {
      console.warn('⚠️ Impossible d\'extraire les infos complètes:', error.message);
    }
  }

  // Met à jour les statistiques globales de l'utilisateur
  static async updateUserStats(userId, newMessage, emotionAnalysis, scoreChange, conversation) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return;

      // Extraire les infos clés AVANT de faire d'autres modifications
      if (conversation) {
        await this.extractAndStoreKeyInfo(user, conversation);
      }

      // Mise à jour des statistiques
      user.globalStats.totalMessages += 1;
      user.globalStats.averageScore = ((user.globalStats.averageScore * (user.globalStats.totalMessages - 1)) + scoreChange) / user.globalStats.totalMessages;
      
      if (scoreChange > user.globalStats.highestScore) {
        user.globalStats.highestScore = scoreChange;
      }

      // Mise à jour des émotions favorites
      if (emotionAnalysis && emotionAnalysis.emotionType) {
        const currentEmotions = user.globalStats.favoriteEmotions || [];
        const emotionIndex = currentEmotions.indexOf(emotionAnalysis.emotionType);
        
        if (emotionIndex === -1) {
          currentEmotions.push(emotionAnalysis.emotionType);
        }
        
        // Garde seulement les 5 émotions les plus courantes
        user.globalStats.favoriteEmotions = currentEmotions.slice(0, 5);
      }

      user.lastSeen = new Date();
      
      // Régénère le contexte mémoire
      user.memoryContext = this.generateMemoryContext(user);
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Erreur mise à jour stats utilisateur:', error);
      throw error;
    }
  }
}

module.exports = MemoryService; 