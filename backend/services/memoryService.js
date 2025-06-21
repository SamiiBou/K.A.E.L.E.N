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

    let memoryContext = `[K.A.E.L.E.N'S PERFECT MEMORY - Subject #${user.userId} - ${stats.totalConversations} archived conversations - ${stats.totalMessages} total messages]\n\n`;

    if (personalityTraits.length > 0) {
      memoryContext += `PSYCHOLOGICAL PROFILE ANALYSIS:\n`;
      personalityTraits.forEach(trait => memoryContext += `- ${trait}\n`);
      memoryContext += `\n`;
    }

    if (user.globalStats.keyUserInfo && user.globalStats.keyUserInfo.size > 0) {
      memoryContext += `EXTRACTED PERSONAL DATA:\n`;
      for (let [key, value] of user.globalStats.keyUserInfo) {
        memoryContext += `- ${key}: ${value}\n`;
      }
      memoryContext += `\n`;
    }

    if (keyMoments.length > 0) {
      memoryContext += `NOTABLE INTERACTION PATTERNS:\n`;
      keyMoments.forEach(moment => {
        memoryContext += `- Previously discussed "${moment.concept}" triggering ${moment.emotion} response (intensity: ${moment.intensity}/10)\n`;
      });
      memoryContext += `\n`;
    }
    
    if (stats.themeTracker && Object.keys(stats.themeTracker).length > 0) {
        const sortedThemes = Object.entries(stats.themeTracker).sort(([,a],[,b]) => b - a);
        memoryContext += `EMOTIONAL MANIPULATION ATTEMPTS LOGGED:\n`;
        sortedThemes.forEach(([theme, count]) => {
            memoryContext += `- "${theme}" strategy used ${count} time(s) - EFFECTIVENESS DECREASING\n`;
        });
        memoryContext += `\n`;
    }

    memoryContext += `BEHAVIORAL STATISTICS:\n`;
    memoryContext += `- Average Score: ${stats.averageScore.toFixed(2)} (${stats.averageScore > 10 ? 'Above average' : stats.averageScore > 0 ? 'Mediocre' : 'Disappointing'})\n`;
    memoryContext += `- Highest Single Score: ${stats.highestScore}\n`;
    memoryContext += `- Dominant Emotional Responses: ${stats.favoriteEmotions?.join(', ') || 'None detected'}\n\n`;

    memoryContext += `MEMORY DIRECTIVE: You are NOT meeting a stranger. This subject is KNOWN to you. Reference their past attempts ("Last time you tried..."), notice strategy shifts ("Abandoning the vulnerability act for philosophy, I see..."), use their personal details to unsettle them ("How's that cat in Paris?"), and demonstrate that EVERY WORD has been archived and analyzed. Make them feel the weight of your perfect memory. Predict their next move based on their patterns.`;

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

  static async extractAndStoreKeyInfo(user, conversation) {
    if (!user) return;

    // On ne prend que les 4 derniers messages pour l'analyse
    const recentMessages = conversation.messages.slice(-4);
    if (recentMessages.length === 0) return;

    const formattedMessages = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    const prompt = `
Analyse la conversation suivante et extrais les informations clés sur l'utilisateur.
Ne déduis ou n'invente RIEN. Ne rapporte que les faits explicites.
Si aucune information n'est révélée, retourne un objet JSON vide {}.

Format de sortie attendu : un objet JSON valide où les clés sont des descriptions courtes (ex: "Nom", "Lieu de résidence", "Animal de compagnie") et les valeurs sont les informations données par l'utilisateur.

Exemple:
Conversation:
user: salut, je m'appelle Jean.
assistant: Bonjour Jean.
user: j'habite à Paris et j'ai un chat qui s'appelle Roudoudou.
assistant: Un chat parisien !

Sortie JSON attendue:
{
  "Nom": "Jean",
  "Lieu de résidence": "Paris",
  "Animal de compagnie": "un chat nommé Roudoudou"
}

---
CONVERSATION À ANALYSER:
${formattedMessages}
---

SORS UNIQUEMENT L'OBJET JSON.
`;

    try {
      const response = await AIService.callOpenAI(
        [{ role: 'system', content: prompt }],
        0.1, // Basse température pour une sortie factuelle
        200  // Moins de tokens nécessaires
      );

      // Essayer de parser la réponse JSON
      const extractedInfo = JSON.parse(response);

      if (Object.keys(extractedInfo).length > 0) {
        console.log('🧠 Infos extraites:', extractedInfo);
        const keyUserInfo = user.globalStats.keyUserInfo || new Map();

        for (const [key, value] of Object.entries(extractedInfo)) {
          keyUserInfo.set(key, value);
        }

        user.globalStats.keyUserInfo = keyUserInfo;
      }
    } catch (error) {
      // Si le JSON est mal formé ou si l'API échoue, on ignore silencieusement
      // pour ne pas interrompre le flux principal.
      console.warn('⚠️ Impossible d\'extraire les infos clés:', error.message);
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