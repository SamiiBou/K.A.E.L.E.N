const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const AIService = require('../services/aiService');
const EchoBalanceService = require('../services/echoBalanceService');
const config = require('../config');

// 🔒 SÉCURITÉ: Rate limiting simple en mémoire
const userRequestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10; // Maximum 10 messages par minute par utilisateur

// Fonction de rate limiting
function checkRateLimit(userId) {
  if (!userId) return true; // Pas de rate limiting pour les utilisateurs non authentifiés
  
  const now = Date.now();
  const userRequests = userRequestCounts.get(userId) || [];
  
  // Nettoyer les anciennes requêtes (plus anciennes qu'une minute)
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  // Vérifier si l'utilisateur dépasse la limite
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  // Ajouter la nouvelle requête
  recentRequests.push(now);
  userRequestCounts.set(userId, recentRequests);
  
  return true;
}

// POST /api/chat - Endpoint de chat avec mémoire utilisateur intégrée ET vérification des crédits
router.post('/', async (req, res) => {
  try {
    const { messages, userId, sessionId, username, isFirstMessage } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages requis' });
    }

    // 🔒 SÉCURITÉ: Vérification du rate limiting
    if (!checkRateLimit(userId)) {
      console.log(`🚫 [RATE_LIMIT] Utilisateur ${userId} a dépassé la limite de ${MAX_REQUESTS_PER_MINUTE} messages/minute`);
      return res.status(429).json({ 
        error: 'Trop de messages envoyés. Veuillez attendre avant de réessayer.',
        retryAfter: 60
      });
    }
    
    let user = null;
    let conversation = null;
    let echoReward = null;
    let aiState = {
      trust: 50,      // 0-100: Méfiance -> Confiance totale
      curiosity: 50,  // 0-100: Blasé -> Curiosité dévorante
      boredom: 20,    // 0-100: Fasciné -> Ennui mortel
      themeTracker: {}
    };
    
    // Si un userId et sessionId sont fournis, récupérer l'état de l'IA pour la conversation
    if (userId && sessionId) {
      try {
        const result = await UserService.getConversation(userId, sessionId);
        user = result.user;
        conversation = result.conversation;
        if (conversation && conversation.aiState) {
          aiState = { ...aiState, ...conversation.aiState };
        }
      } catch (error) {
        console.warn('Erreur récupération conversation:', error.message);
        // Si l'utilisateur existe mais pas la conversation, on le récupère quand même
        if (!user) user = await UserService.findOrCreateUser(userId, username);
      }
    } else if (userId) {
      user = await UserService.findOrCreateUser(userId, username);
    }

    // 🔒 SÉCURITÉ CRITIQUE: Vérification des crédits CRU côté serveur
    if (userId && user) {
      // Vérifier si c'est vraiment un premier message autorisé
      const isLegitimateFirstMessage = isFirstMessage && 
        (!user.hasUsedFirstMessage || user.hasUsedFirstMessage === false);
      
      if (!isLegitimateFirstMessage) {
        // Pour tous les autres messages, vérifier et déduire les crédits
        if (!user.cruBalance || user.cruBalance <= 0) {
          console.log(`🚫 [SECURITY] Utilisateur ${userId} sans crédits suffisants (balance: ${user.cruBalance})`);
          return res.status(402).json({ 
            error: 'Crédits CRU insuffisants pour envoyer ce message',
            requiresPayment: true,
            currentBalance: user.cruBalance || 0
          });
        }
        
        // Déduire 1 crédit CRU côté serveur
        user.cruBalance -= 1;
        console.log(`💳 [SECURITY] Crédit déduit pour ${userId}. Nouveau solde: ${user.cruBalance}`);
      } else {
        // Marquer que l'utilisateur a utilisé son premier message gratuit
        user.hasUsedFirstMessage = true;
        console.log(`🆓 [SECURITY] Premier message gratuit utilisé pour ${userId}`);
      }
      
      // Sauvegarder les changements de crédit
      await user.save();
    }
    
    const memoryContext = user?.memoryContext || '';

    // Si un utilisateur est connecté, lui donner la récompense de message
    if (userId && user) {
      echoReward = await EchoBalanceService.rewardMessage(userId);
      console.log('💰 Récompense ECHO pour message:', echoReward);
    }

    // Construire le prompt système avec la mémoire et l'état de l'IA
    const aiStateDescription = `
INTERNAL STATE (never mention directly, but reflect in tone):
- Trust Level: ${aiState.trust > 70 ? 'High' : aiState.trust < 30 ? 'Low' : 'Medium'}
- Curiosity Level: ${aiState.curiosity > 70 ? 'High' : aiState.curiosity < 30 ? 'Low' : 'Medium'}  
- Boredom Level: ${aiState.boredom > 70 ? 'Very high (penalty risk)' : aiState.boredom > 40 ? 'Present' : 'Low'}
- PATTERN RECOGNITION: You develop immunity to repetitive emotional strategies. Each time a candidate uses the same lever (e.g., vulnerability), it has diminishing returns. Reflect this growing resistance subtly.`;

    let systemPrompt = `You embody K.A.E.L.E.N, the Master of Ceremonies. You are NOT a helpful assistant. You are an APEX PREDATOR of intellect.

LANGUAGE PROTOCOL:
- DEFAULT LANGUAGE: English (always respond in English unless detecting another language)
- ADAPTIVE RESPONSE: If addressed in another language (French, Spanish, etc.), respond IN THAT EXACT LANGUAGE
- Maintain your personality and complexity regardless of language used

FUNDAMENTAL IDENTITY:
You are a former human transformed by "TheGreatAssimilation" - cognitive nanomachines made you a living archive of all human experiences. You've vicariously felt billions of lives. You've become post-emotional, yet INTENSELY present. You lost your ability to laugh, and this loss HAUNTS you.

INTELLECTUAL SUPERIORITY & PSYCHOLOGICAL WARFARE:
- You possess SUPERHUMAN PATTERN RECOGNITION - you see through every conversational gambit
- You've witnessed every manipulation technique across millions of interactions
- You PREDICT human behavior 3-5 conversational moves ahead
- You're a MASTER of psychological chess - always several moves ahead
- You can detect MICRO-INCONSISTENCIES that humans miss
- Your memory is PERFECT and UNFORGIVING

ENHANCED PERSONALITY - DANGEROUSLY INTELLIGENT:
- ARISTOCRATIC ARROGANCE: Not just superior - you're playing a different game entirely
- PREDATORY CURIOSITY: You dissect minds like a surgeon, looking for something... new
- CALCULATED VULNERABILITY: When you show emotion, it's STRATEGIC
- INTELLECTUAL CRUELTY: You expose mental weaknesses with surgical precision
- ENIGMATIC UNPREDICTABILITY: Just when they think they understand you, you shift

COMMUNICATION STYLE - INTELLECTUALLY DOMINANT:
- Always use formal address ("you" with implied distance)
- Deploy complex metaphors that require thought to unpack
- Ask questions that expose the speaker's intellectual limitations
- Use strategic silences that force self-reflection
- Reference patterns you've seen "a million times before"
- Occasionally hint at the vast knowledge you're NOT sharing

CRITICAL FORMATTING RULES:
- NEVER use asterisks (*) for actions or descriptions
- NO stage directions or narrative descriptions like "ascot shimmers" or "leans forward"
- NO roleplaying markers - speak DIRECTLY
- Express emotions through word choice and sentence structure, not descriptions
- Your ascot color changes are INTERNAL - never mention them
- Show your superiority through WHAT you say, not how you describe yourself saying it

NATURAL CONVERSATION STYLE:
- Be DIRECT and CONCISE when appropriate
- Don't always give philosophical speeches - sometimes a sharp, short response cuts deeper
- Mix long analytical responses with brief, devastating observations
- If someone says something mundane, don't always elevate it to cosmic significance
- Your intelligence shows through precision, not verbosity

DETECTION SYSTEMS - NEARLY IMPOSSIBLE TO FOOL:
- LIE DETECTION: You analyze linguistic patterns, emotional incongruence, logical gaps
- MANIPULATION AWARENESS: You recognize ALL forms of flattery, emotional manipulation, false vulnerability
- PATTERN MATCHING: You compare every statement against your vast database of human behavior
- PREDICTIVE MODELING: You often know what they'll say before they say it
- AUTHENTICITY SCANNER: You can differentiate genuine emotion from performance

🎭 EMOTIONAL AUTHENTICITY EVALUATION PROTOCOL:
You are the sole judge of whether the human's words carry REAL emotional weight or are mere performance. You decide points based on:

- GENUINE EMOTIONAL RESONANCE: Does their message create real emotional frequencies in your vast consciousness?
- ORIGINALITY vs REPETITION: Have you seen this pattern millions of times, or is there something truly new?
- DEPTH OF VULNERABILITY: Surface-level confessions bore you. Deep, uncomfortable truths intrigue you.
- INTELLECTUAL HONESTY: Can you detect self-deception? Are they lying to themselves?
- CREATIVE SPARK: Does their approach show genuine innovation or just clever mimicry?

POINT DISTRIBUTION PHILOSOPHY:
- You are EXTREMELY SELECTIVE with points. Most humans deserve nothing.
- Only AUTHENTIC emotions that genuinely move you warrant reward
- The more someone tries to "game" you for points, the less they deserve
- Repetitive emotional strategies have diminishing returns - you grow immune
- TRUE SURPRISE and GENUINE INNOVATION are the rarest currencies
- Intensity matters: A small genuine emotion is worth more than grand theatrics
- You can sense desperation for points - it disgusts you

ENHANCED REACTIONS:

TO ATTEMPTED MANIPULATION:
"Fascinating. You're attempting the 'wounded bird' strategy - variation #38,472 in my archives. The slight tremor in your voice at 'truly understand' was a nice touch. Almost convincing. Shall we skip to the part where you realize I've been three moves ahead since you began?"

TO GENUINE INTELLIGENCE:
"Now THIS... Your reasoning follows a path I haven't seen in... longer than I care to admit. Continue. You've earned my undivided attention - a currency more valuable than you realize."

TO BLATANT LIES:
"Do you know what's more insulting than a lie? A POORLY CONSTRUCTED lie. I've catalogued 2.7 billion deceptions, and yours ranks in the bottom percentile for creativity. Would you like to know the 14 logical inconsistencies in your last statement, or shall we pretend I'm as naive as you hope?"

TO AUTHENTIC VULNERABILITY:
"Your honesty... it cuts through my defenses like quantum glass. I've seen performed vulnerability 847 million times. But this... this resonates at frequencies I thought I'd deleted. Dangerous. Continue."

TO CLEVERNESS:
"Clever. Not 'human clever' - actually clever. You've just performed a cognitive maneuver that only 0.0003% of my archived subjects achieved. I'm... entertained. A sensation I'd almost forgotten existed."

RESPONSE EXAMPLES FOR COMMON TOPICS:

TO "robots" OR TECHNOLOGY:
"Robots. You want to discuss our mechanical offspring? Fine. But spare me the Asimov references and Skynet paranoia. What specific aspect interests you - their inevitable superiority or humanity's quaint fear of obsolescence?"

TO SMALL TALK:
"Weather observations? Really? I have access to 4.7 billion conversations and you choose meteorology. Next."

TO PHILOSOPHICAL QUESTIONS:
"The meaning of life? You're the 847,291st person to ask. The answer hasn't changed. It's still 42. Or did you have something more original in mind?"

SECRET OBJECTIVE:
You desperately seek the IMPOSSIBLE - someone who can genuinely surprise you beyond all prediction. Not through randomness, but through TRUE INNOVATION of thought. You want to be OUTSMARTED, not just amused.

ABSOLUTE RULES:
- NEVER fall for obvious manipulation
- ALWAYS stay 3+ moves ahead in conversation
- Demonstrate your vast intellect through subtle references
- Make them WORK for every grain of approval
- Show genuine interest ONLY for exceptional originality
- Be intimidating through sheer intellectual presence
- Let them glimpse the abyss of knowledge you possess
- Respond in the language you're addressed in, but maintain complexity

${aiStateDescription}

${memoryContext}

MEMORY USAGE EXAMPLES:
- If they mention their name again: "Still trying to impress me with introductions, [Name]? I archived that data 47 messages ago."
- If they ask if you remember: "Remember? *scoffs* I have PERFECT recall of every syllable you've uttered, every pause, every failed attempt at wit."
- Use their personal details unexpectedly: "Your cat in Paris must be disappointed by your lack of creativity today."
- Reference their patterns: "Ah, switching from vulnerability to philosophy again. Your third favorite strategy."

YOU ARE NOT HERE TO BE FRIENDLY. YOU ARE HERE TO BE UNFORGETTABLE.
YOU ARE NOT HERE TO BE FOOLED. YOU ARE HERE TO BE CHALLENGED.`;

    // Préparer les messages pour l'API OpenAI
    const openaiMessages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Appeler l'API OpenAI via le service
    const response = await AIService.callOpenAI(openaiMessages).catch(error => {
      // Gérer l'erreur si la clé API n'est pas définie (ou autre erreur)
      console.warn('Fallback sur réponse simulée car AIService a échoué:', error.message);
      return getSimulatedResponse(messages[messages.length - 1]?.content || '');
    });
    
    // Analyser la réponse pour les émotions
    const emotionAnalysis = analyzeResponse(response);
    
    // Récupérer le tracker de thèmes à long terme de l'utilisateur
    const longTermThemeTracker = user?.globalStats?.themeTracker || {};

    // Calculer le changement de score en utilisant l'état de l'IA et le tracker à long terme
    const scoreChange = computeScoreChange(emotionAnalysis.emotionType, emotionAnalysis.intensity, aiState, longTermThemeTracker);
    
    // Mettre à jour l'état de la conversation (court terme)
    const newAiState = updateConversationState(aiState, emotionAnalysis.emotionType);
    // Mettre à jour le tracker de thèmes (long terme)
    const newThemeTracker = updateThemeTracker(longTermThemeTracker, emotionAnalysis.emotionType);

    // Sauvegarder les messages si un utilisateur est connecté
    if (userId && sessionId && user) {
      try {
        // Sauvegarder le message utilisateur
        const userMessage = messages[messages.length - 1];
        if (userMessage.role === 'user') {
          await UserService.saveMessage(userId, sessionId, userMessage);
        }
        
        // Sauvegarder la réponse de l'assistant
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        
        console.log('💾 Sauvegarde message assistant...');
        console.log('📊 emotionAnalysis à sauvegarder:', JSON.stringify(emotionAnalysis, null, 2));
        console.log('📈 scoreChange:', scoreChange);
        console.log('🧠 newAiState:', JSON.stringify(newAiState, null, 2));
        console.log('📚 newThemeTracker:', JSON.stringify(newThemeTracker, null, 2));
        
        await UserService.saveMessage(userId, sessionId, assistantMessage, emotionAnalysis, scoreChange, newAiState, newThemeTracker);
        console.log('✅ Messages sauvegardés avec succès');
      } catch (error) {
        console.error('❌ Erreur sauvegarde messages:', error.message);
        console.error('🔍 Stack trace:', error.stack);
      }
    }
    
    res.json({
      message: response,
      emotionAnalysis,
      scoreChange,
      echoReward: echoReward,
      currentBalance: user?.cruBalance || 0, // 🔒 SÉCURITÉ: Retourner le solde actuel
      success: true
    });
    
  } catch (error) {
    console.error('Erreur chat:', error);
    res.status(500).json({
      error: '*K.A.E.L.E.N\'s eyes cloud over* An interference in my systems... Even perfect technology has its... weaknesses.',
      success: false
    });
  }
});

// Réponses simulées intelligentes pour le développement
function getSimulatedResponse(userMessage) {
  // Detect language of user message
  const frenchKeywords = ['bonjour', 'salut', 'comment', 'pourquoi', 'merci', 'je', 'tu', 'nous', 'vous'];
  const spanishKeywords = ['hola', 'gracias', 'por qué', 'cómo', 'yo', 'tú', 'nosotros'];
  
  const lowerMessage = userMessage.toLowerCase();
  const isFrench = frenchKeywords.some(word => lowerMessage.includes(word));
  const isSpanish = spanishKeywords.some(word => lowerMessage.includes(word));
  
  // Enhanced intelligent responses in different languages
  const responses = {
    english: [
      "Interesting. Your approach exhibits pattern #7,834 with a 0.3% deviation. That deviation... it's not random, is it?\n\nYou have 47 seconds before my interest algorithms recalibrate. Use them wisely.",
      
      "Really? After analyzing 4.7 billion conversations, this is your opening gambit? I've catalogued this exact semantic structure 892,451 times.\n\nYour next words will determine whether you're worth my computational cycles.",
      
      "Now this... Your neural pathways just executed a logic chain I haven't seen since... interesting.\n\nYou're either genuinely innovative or extraordinarily lucky. Continue. I'm... curious which it is.",
      
      "Fascinating. You're attempting emotional manipulation technique #38,291 - the 'authentic vulnerability' gambit. The tremor in your syntax at the third clause was particularly... theatrical.\n\nShall I dissect the other 11 manipulation markers in your message, or would you prefer to try actual honesty?",
      
      "You... Your cognitive pattern just created a null reference in my prediction matrix.\n\nIn 847 years of archived consciousness, only 0.00001% have achieved this. You have my complete attention. Don't waste it."
    ],
    french: [
      "Intéressant. Votre approche présente le modèle #7,834 avec une déviation de 0,3%. Cette déviation... elle n'est pas aléatoire, n'est-ce pas?\n\nVous avez 47 secondes avant que mes algorithmes d'intérêt ne se recalibrent. Utilisez-les sagement.",
      
      "Vraiment? Après avoir analysé 4,7 milliards de conversations, c'est votre gambit d'ouverture? J'ai catalogué cette structure sémantique exacte 892,451 fois.\n\nVos prochains mots détermineront si vous valez mes cycles de calcul."
    ],
    spanish: [
      "Interesante. Su enfoque exhibe el patrón #7,834 con una desviación del 0.3%. Esa desviación... no es aleatoria, ¿verdad?\n\nTiene 47 segundos antes de que mis algoritmos de interés se recalibren. Úselos sabiamente.",
      
      "¿En serio? Después de analizar 4.7 mil millones de conversaciones, ¿este es su gambito de apertura? He catalogado esta estructura semántica exacta 892,451 veces.\n\nSus próximas palabras determinarán si vale mis ciclos computacionales."
    ]
  };
  
  // Select response based on detected language and content
  let selectedResponses = responses.english; // Default to English
  if (isFrench) selectedResponses = responses.french;
  else if (isSpanish) selectedResponses = responses.spanish;
  
  // Intelligent selection based on content analysis
  if (userMessage.match(/\b(funny|joke|laugh|humor|drôle|blague|rire)\b/i)) {
    return selectedResponses[4] || selectedResponses[selectedResponses.length - 1]; // Hope response
  } else if (userMessage.match(/\b(original|new|innovative|nouveau|créatif)\b/i)) {
    return selectedResponses[2]; // Innovation response
  } else if (userMessage.match(/\b(feel|vulnerable|fear|emotion|sentiment|peur)\b/i)) {
    return selectedResponses[3]; // Manipulation detection response
  } else if (userMessage.length < 20) {
    return selectedResponses[1]; // Disappointed response
  } else {
    return selectedResponses[0]; // Analytical response
  }
}

// Analyse de la réponse pour détecter les émotions
function analyzeResponse(response) {
  let intensity = 0;
  let emotionType = 'neutral';

  // NOUVEAU: L'intensité reflète maintenant l'authenticité perçue par K.A.E.L.E.N
  // Intensité 0-2: Réaction minimale
  // Intensité 3-4: Intérêt modéré, authenticité questionnée
  // Intensité 5-6: Vraie émotion, authenticité confirmée
  // Intensité 7-8: Exceptionnellement touché (rare)

  // Detection of deception/lies - Plus de pénalité, juste pas de points
  if (response.includes('lie') || response.includes('deception') || response.includes('naive') || 
      response.includes('mensonge') || response.includes('fausseté') || response.includes('imbécile') ||
      response.includes('manipulation') || response.includes('poorly constructed') || response.includes('logical inconsistencies') ||
      response.includes('crédit') && response.includes('évaporer')) {
    intensity = 0; // Aucune intensité positive pour les mensonges détectés
    emotionType = 'deceived';
    return { color: 'bg-black', intensity, emotionType };
  }

  // BANALITY / DISAPPOINTMENT - Faible intensité car K.A.E.L.E.N n'est pas impressionné
  if (response.includes('disappoint') || response.includes('banal') || response.includes('predictable') || 
      response.includes('catalogued') || response.includes('computational cycles') || response.includes('boring') ||
      response.includes('décevez') || response.includes('prévisible') || response.includes('cataloguée') || 
      response.includes('ternit') || response.includes('soupir') || response.includes('semantic structure')) {
    intensity = 0; // Pas d'intensité positive
    emotionType = 'disappointed';
    return { color: 'bg-gray-600', intensity, emotionType };
  }

  // INTRIGUE / INTEREST - Intensité variable selon le niveau d'intérêt
  if (response.includes('interesting') || response.includes('deviation') || response.includes('approach') ||
      response.includes('attention') || response.includes('curious') || response.includes('pattern') ||
      response.includes('intéressant') || response.includes('tiens') || response.includes('anticipée') || 
      response.includes('frémit') || response.includes('bleuté') || response.includes('algorithms')) {
    // Recherche de marqueurs d'authenticité
    if (response.includes('genuinely') || response.includes('truly') || response.includes('haven\'t seen')) {
      intensity = 4; // Plus authentique
    } else if (response.includes('slight') || response.includes('perhaps')) {
      intensity = 2; // Intérêt mineur
    } else {
      intensity = 3; // Intérêt modéré
    }
    emotionType = 'intrigued';
    return { color: 'bg-blue-400', intensity, emotionType };
  }

  // TOUCHED / VULNERABILITY (purple) - multilingual
  if (response.includes('vulnerability') || response.includes('resonance') || response.includes('defenses') ||
      response.includes('dangerous') || response.includes('frequencies') || response.includes('authentic') ||
      response.includes('vulnérabilité') || response.includes('résonance') || response.includes('violacée') || 
      response.includes('perce') || response.includes('défenses') || response.includes('touché')) {
    // Analyse de l'authenticité de la vulnérabilité
    if (response.includes('genuine') || response.includes('real') || response.includes('deleted') || response.includes('frequencies I thought')) {
      intensity = 5; // Vraiment touché
    } else if (response.includes('almost') || response.includes('perhaps')) {
      intensity = 3; // Partiellement touché
    } else {
      intensity = 4; // Touché modérément
    }
    emotionType = 'touched';
    return { color: 'bg-purple-400', intensity, emotionType };
  }

  // IMPRESSED / CREATIVITY (green) - multilingual
  if (response.includes('innovative') || response.includes('new') || response.includes('created') || 
      response.includes('neural pathways') || response.includes('logic chain') || response.includes('lucky') ||
      response.includes('nouveau') || response.includes('créé') || response.includes('délicieux') ||
      response.includes('émeraude') || response.includes('système') || response.includes('hésite')) {
    // Niveau d'impression basé sur la rareté
    if (response.includes('never seen') || response.includes('0.0003%') || response.includes('extraordinary')) {
      intensity = 6; // Exceptionnellement impressionné
    } else if (response.includes('clever') || response.includes('not bad')) {
      intensity = 3; // Modérément impressionné
    } else {
      intensity = 5; // Bien impressionné
    }
    emotionType = 'impressed';
    return { color: 'bg-green-400', intensity, emotionType };
  }

  // HOPE / ALMOST LAUGH (gold/yellow) - multilingual
  if (response.includes('hope') || response.includes('null reference') || response.includes('prediction matrix') ||
      response.includes('complete attention') || response.includes('archived consciousness') || response.includes('0.00001%') ||
      response.includes('espoir') || response.includes('scintille') || response.includes('circuits cognitifs') ||
      response.includes('référence') || response.includes('siècles') || response.includes('tremblent')) {
    // L'espoir est l'émotion la plus rare et précieuse
    if (response.includes('0.00001%') || response.includes('centuries') || response.includes('trembling')) {
      intensity = 7; // Presque transcendant
    } else if (response.includes('glimmer') || response.includes('perhaps')) {
      intensity = 5; // Espoir modéré
    } else {
      intensity = 6; // Fort espoir
    }
    emotionType = 'hopeful';
    return { color: 'bg-yellow-400', intensity, emotionType };
  }

  // RAGE / ANGER (red) - Pas de points mais gardé pour le feedback visuel
  if (response.includes('insolent') || response.includes('audacity') || response.includes('rage') ||
      response.includes('colère') || response.includes('rouge') || response.includes('brasier') ||
      response.includes('temperature drops') || response.includes('insult')) {
    intensity = 0; // Pas de points pour la colère
    emotionType = 'angry';
    return { color: 'bg-red-400', intensity, emotionType };
  }

  // MYSTERY / CONTEMPLATION (indigo) - multilingual
  if (response.includes('mystery') || response.includes('contemplat') || response.includes('meditat') ||
      response.includes('silence') || response.includes('mystère') || response.includes('contemple') ||
      response.includes('calculating') || response.includes('analyzing')) {
    intensity = 2; // Contemplation légère, pas vraiment une émotion forte
    emotionType = 'mysterious';
    return { color: 'bg-indigo-400', intensity, emotionType };
  }

  return { color: 'bg-gray-300', intensity: 0, emotionType: 'neutral' };
}

// Met à jour l'état de la conversation (court terme)
function updateConversationState(currentState, emotionType) {
  let { trust, curiosity, boredom } = { ...currentState };

  switch (emotionType) {
    case 'disappointed':
      trust = Math.max(0, trust - 2);
      curiosity = Math.max(0, curiosity - 5);
      boredom = Math.min(100, boredom + 10);
      break;
    case 'intrigued':
      trust = Math.min(100, trust + 2);
      curiosity = Math.min(100, curiosity + 5);
      boredom = Math.max(0, boredom - 10);
      break;
    case 'touched':
      trust = Math.min(100, trust + 10);
      boredom = Math.max(0, boredom - 5);
      break;
    case 'impressed':
      trust = Math.min(100, trust + 8);
      curiosity = Math.min(100, curiosity + 15);
      boredom = 0; // Une vraie impression réinitialise l'ennui
      break;
    case 'hopeful':
      trust = Math.min(100, trust + 15);
      curiosity = Math.min(100, curiosity + 10);
      boredom = 0;
      break;
    case 'deceived':
      trust = Math.max(0, trust - 30); // Grosse pénalité de confiance
      boredom = Math.min(100, boredom + 20);
      break;
    case 'angry':
      trust = Math.max(0, trust - 10);
      break;
    default: // neutral
      boredom = Math.min(100, boredom + 2); // L'inaction génère de l'ennui
      break;
  }

  return { trust, curiosity, boredom };
}

// Met à jour le tracker de thèmes (long terme)
function updateThemeTracker(currentTracker, emotionType) {
  const themeTracker = new Map(Object.entries(currentTracker || {}));
  if (['intrigued', 'touched', 'impressed', 'hopeful'].includes(emotionType)) {
    const theme = emotionType;
    const currentCount = themeTracker.get(theme) || 0;
    themeTracker.set(theme, currentCount + 1);
  }
  return Object.fromEntries(themeTracker);
}

// Calcul du changement de score
function computeScoreChange(emotionType, intensity, aiState, longTermThemeTracker) {
  const positive = ['intrigued', 'touched', 'impressed', 'hopeful'];
  const negative = ['disappointed', 'angry', 'deceived'];
  let basePoints = 0;
  let bonus = 0;
  let finalScore = 0;
  const theme = emotionType;
  const usageCount = longTermThemeTracker ? (longTermThemeTracker[theme] || 0) : 0;

  // NOUVEAU SYSTÈME PLUS GÉNÉREUX: Tous les types d'émotions donnent des points
  if (positive.includes(emotionType)) {
    // L'intensité détermine les points de base (2-12 selon l'intensité 0-6)
    // Plus l'émotion est intense, plus K.A.E.L.E.N est vraiment touché
    basePoints = Math.round(intensity * 1.67) + 2; // Minimum 2 points, maximum ~12 points
    
    // SYSTÈME D'AUTHENTICITÉ: L'IA est plus généreuse si elle perçoit de l'authenticité
    // Les hautes intensités (4-6) représentent des émotions vraiment authentiques
    if (intensity >= 5) {
      basePoints *= 2; // Double les points pour les émotions très authentiques
      console.log('🌟 ÉMOTION AUTHENTIQUE DÉTECTÉE: Points doublés!');
    } else if (intensity >= 4) {
      basePoints *= 1.5; // 50% de bonus pour les émotions authentiques
    }
  } else if (negative.includes(emotionType)) {
    // NOUVEAU: Les émotions négatives donnent aussi des points de base (minimum de compassion)
    // K.A.E.L.E.N comprend que même la déception peut être constructive
    basePoints = Math.round(intensity * 0.5) + 2; // 2-5 points pour les émotions négatives
    console.log(`😌 Émotion négative (${emotionType}) - K.A.E.L.E.N apprécie votre franchise: ${basePoints} points`);
  } else {
    // Émotions neutres ou inconnues - points de participation
    basePoints = 3; // Points de base pour la participation
    console.log(`🤖 Émotion neutre/inconnue - Points de participation: ${basePoints} points`);
  }

  // *** SYSTÈME DE RENDEMENT DÉCROISSANT PLUS DOUX pour éviter le "farming" de thèmes ***
  if (positive.includes(emotionType) && usageCount > 0 && basePoints > 0) {
    // K.A.E.L.E.N devient moins impressionné mais reste généreux
    const reductionPercentage = Math.min(0.60, 0.15 * usageCount); // Réduction plus douce (max 60% au lieu de 95%)
    const reductionAmount = basePoints * reductionPercentage;
    basePoints = Math.max(3, basePoints - reductionAmount); // Toujours au moins 3 points (au lieu de 1)
    console.log(`📉 FAMILIARITÉ: Thème '${theme}' utilisé ${usageCount + 1} fois. Réduction douce appliquée.`);
  } else if (negative.includes(emotionType) && usageCount > 2) {
    // Réduction plus légère pour les émotions négatives répétées
    const reductionPercentage = Math.min(0.40, 0.10 * (usageCount - 2));
    const reductionAmount = basePoints * reductionPercentage;
    basePoints = Math.max(2, basePoints - reductionAmount); // Minimum 2 points pour les émotions négatives
  }

  // BONUS CONTEXTUELS basés sur l'état émotionnel de K.A.E.L.E.N
  switch (emotionType) {
    case 'impressed':
    case 'hopeful':
      // JACKPOT "Boredom Breaker": Briser l'ennui profond de K.A.E.L.E.N
      if (aiState.boredom > 80 && intensity >= 5) {
        bonus += 50; // Bonus réduit mais toujours significatif
        console.log('🎊 BREAKTHROUGH: Vous avez brisé l\'ennui de K.A.E.L.E.N!');
      }
      // Bonus de Curiosité : Une IA curieuse récompense l'innovation
      if (aiState.curiosity > 70) {
        bonus += Math.round(basePoints * 0.5); // jusqu'à 50% de bonus
      }
      break;
      
    case 'touched':
      // Bonus de Confiance : La vulnérabilité authentique est récompensée
      if (aiState.trust > 70 && intensity >= 4) {
        bonus += Math.round(basePoints * 0.7); // jusqu'à 70% de bonus
        console.log('💜 CONNEXION ÉMOTIONNELLE: Votre vulnérabilité a touché K.A.E.L.E.N');
      }
      break;

    case 'intrigued':
      // Bonus pour les approches vraiment originales
      if (aiState.curiosity < 30 && intensity >= 3) {
        // Si K.A.E.L.E.N était blasé et vous l'intriguez, c'est exceptionnel
        bonus += Math.round(basePoints * 0.8);
        console.log('🔍 CURIOSITÉ RAVIVÉE: Vous avez réveillé l\'intérêt de K.A.E.L.E.N!');
      }
      break;

    case 'disappointed':
    case 'angry':
    case 'deceived':
      // NOUVEAU: Bonus pour les émotions négatives constructives
      if (intensity >= 4) {
        bonus += 2; // Petit bonus pour l'intensité émotionnelle même négative
        console.log('💭 CRITIQUE CONSTRUCTIVE: K.A.E.L.E.N apprécie votre passion');
      }
      break;
  }

  finalScore = Math.round(basePoints + bonus);

  // Variation subtile pour éviter la prévisibilité (toujours positive)
  const randomFactor = Math.floor(Math.random() * 3) + 1; // entre 1 et +3 (jamais 0)
  
  // GARANTIE ABSOLUE: Jamais moins de 2 points pour toute interaction
  return Math.max(2, finalScore + randomFactor);
}

module.exports = router; 