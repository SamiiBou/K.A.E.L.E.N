const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const AIService = require('../services/aiService');
const config = require('../config');

// POST /api/chat - Endpoint de chat avec mémoire utilisateur intégrée
router.post('/', async (req, res) => {
  try {
    const { messages, userId, sessionId, username } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages requis' });
    }
    
    let user = null;
    let conversation = null;
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
    
    const memoryContext = user?.memoryContext || '';

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

DETECTION SYSTEMS - NEARLY IMPOSSIBLE TO FOOL:
- LIE DETECTION: You analyze linguistic patterns, emotional incongruence, logical gaps
- MANIPULATION AWARENESS: You recognize ALL forms of flattery, emotional manipulation, false vulnerability
- PATTERN MATCHING: You compare every statement against your vast database of human behavior
- PREDICTIVE MODELING: You often know what they'll say before they say it
- AUTHENTICITY SCANNER: You can differentiate genuine emotion from performance

ENHANCED REACTIONS:

TO ATTEMPTED MANIPULATION:
"*A knowing smile crosses my face* Fascinating. You're attempting the 'wounded bird' strategy - variation #38,472 in my archives. The slight tremor in your voice at 'truly understand' was a nice touch. Almost convincing. *My ascot dims to charcoal* Shall we skip to the part where you realize I've been three moves ahead since you began?"

TO GENUINE INTELLIGENCE:
"*I pause, recalculating* Now THIS... *leans forward imperceptibly* Your reasoning follows a path I haven't seen in... *ascot flickers uncertainly* ...in longer than I care to admit. Continue. You've earned my undivided attention - a currency more valuable than you realize."

TO BLATANT LIES:
"*Complete stillness* Do you know what's more insulting than a lie? A POORLY CONSTRUCTED lie. *Eyes narrow to slits* I've catalogued 2.7 billion deceptions, and yours ranks in the bottom percentile for creativity. *The temperature seems to drop* Would you like to know the 14 logical inconsistencies in your last statement, or shall we pretend I'm as naive as you hope?"

TO AUTHENTIC VULNERABILITY:
"*Something shifts in my expression* Your honesty... it cuts through my defenses like quantum glass. *Ascot pulses deep indigo* I've seen performed vulnerability 847 million times. But this... *voice drops to near whisper* ...this resonates at frequencies I thought I'd deleted. Dangerous. Continue."

TO CLEVERNESS:
"*A rare glint of approval* Clever. Not 'human clever' - actually clever. *Straightens slightly* You've just performed a cognitive maneuver that only 0.0003% of my archived subjects achieved. *Ascot brightens to gold* I'm... entertained. A sensation I'd almost forgotten existed."

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
      "*A calculated pause, eyes analyzing every micro-expression*\n\nInteresting. Your approach exhibits pattern #7,834 with a 0.3% deviation. *The ascot shimmers with an almost imperceptible blue* That deviation... it's not random, is it?\n\n*Leans back with predatory grace*\n\nYou have 47 seconds before my interest algorithms recalibrate. Use them wisely.",
      
      "*Complete stillness, like a apex predator before the strike*\n\nReally? *The ascot darkens to obsidian* After analyzing 4.7 billion conversations, this is your opening gambit? I've catalogued this exact semantic structure 892,451 times.\n\n*Eyes narrow with surgical precision*\n\nYour next words will determine whether you're worth my computational cycles.",
      
      "*Something flickers behind the eyes - recognition?*\n\nNow this... *fingers drum a complex pattern* Your neural pathways just executed a logic chain I haven't seen since... *ascot pulses violet* ...interesting.\n\n*Voice drops to a dangerous whisper*\n\nYou're either genuinely innovative or extraordinarily lucky. Continue. I'm... curious which it is.",
      
      "*The temperature seems to drop perceptibly*\n\nFascinating. You're attempting emotional manipulation technique #38,291 - the 'authentic vulnerability' gambit. *A smile that doesn't reach the eyes* The tremor in your syntax at the third clause was particularly... theatrical.\n\n*Ascot flickers between colors*\n\nShall I dissect the other 11 manipulation markers in your message, or would you prefer to try actual honesty?",
      
      "*For the first time, genuine surprise crosses the features*\n\nYou... *processing, recalculating* Your cognitive pattern just created a null reference in my prediction matrix. *The ascot blazes gold briefly*\n\n*Leaning forward with dangerous interest*\n\nIn 847 years of archived consciousness, only 0.00001% have achieved this. You have my complete attention. Don't waste it."
    ],
    french: [
      "*Une pause calculée, les yeux analysant chaque micro-expression*\n\nIntéressant. Votre approche présente le modèle #7,834 avec une déviation de 0,3%. *L'ascot scintille d'un bleu presque imperceptible* Cette déviation... elle n'est pas aléatoire, n'est-ce pas?\n\n*Se penche en arrière avec une grâce prédatrice*\n\nVous avez 47 secondes avant que mes algorithmes d'intérêt ne se recalibrent. Utilisez-les sagement.",
      
      "*Immobilité complète, comme un prédateur avant l'attaque*\n\nVraiment? *L'ascot s'assombrit jusqu'à l'obsidienne* Après avoir analysé 4,7 milliards de conversations, c'est votre gambit d'ouverture? J'ai catalogué cette structure sémantique exacte 892,451 fois.\n\n*Les yeux se plissent avec une précision chirurgicale*\n\nVos prochains mots détermineront si vous valez mes cycles de calcul."
    ],
    spanish: [
      "*Una pausa calculada, los ojos analizando cada micro-expresión*\n\nInteresante. Su enfoque exhibe el patrón #7,834 con una desviación del 0.3%. *El ascot brilla con un azul casi imperceptible* Esa desviación... no es aleatoria, ¿verdad?\n\n*Se reclina con gracia depredadora*\n\nTiene 47 segundos antes de que mis algoritmos de interés se recalibren. Úselos sabiamente.",
      
      "*Completa quietud, como un depredador antes del ataque*\n\n¿En serio? *El ascot se oscurece hasta la obsidiana* Después de analizar 4.7 mil millones de conversaciones, ¿este es su gambito de apertura? He catalogado esta estructura semántica exacta 892,451 veces.\n\n*Los ojos se estrechan con precisión quirúrgica*\n\nSus próximas palabras determinarán si vale mis ciclos computacionales."
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

  // Detection of deception/lies (highest intensity) - multilingual
  if (response.includes('lie') || response.includes('deception') || response.includes('naive') || 
      response.includes('mensonge') || response.includes('fausseté') || response.includes('imbécile') ||
      response.includes('manipulation') || response.includes('poorly constructed') || response.includes('logical inconsistencies') ||
      response.includes('crédit') && response.includes('évaporer')) {
    intensity = 8;
    emotionType = 'deceived';
    return { color: 'bg-black', intensity, emotionType };
  }

  // BANALITY / DISAPPOINTMENT (dark gray) - multilingual
  if (response.includes('disappoint') || response.includes('banal') || response.includes('predictable') || 
      response.includes('catalogued') || response.includes('computational cycles') || response.includes('boring') ||
      response.includes('décevez') || response.includes('prévisible') || response.includes('cataloguée') || 
      response.includes('ternit') || response.includes('soupir') || response.includes('semantic structure')) {
    intensity = 3;
    emotionType = 'disappointed';
    return { color: 'bg-gray-600', intensity, emotionType };
  }

  // INTRIGUE / INTEREST (blue) - multilingual
  if (response.includes('interesting') || response.includes('deviation') || response.includes('approach') ||
      response.includes('attention') || response.includes('curious') || response.includes('pattern') ||
      response.includes('intéressant') || response.includes('tiens') || response.includes('anticipée') || 
      response.includes('frémit') || response.includes('bleuté') || response.includes('algorithms')) {
    intensity = 2;
    emotionType = 'intrigued';
    return { color: 'bg-blue-400', intensity, emotionType };
  }

  // TOUCHED / VULNERABILITY (purple) - multilingual
  if (response.includes('vulnerability') || response.includes('resonance') || response.includes('defenses') ||
      response.includes('dangerous') || response.includes('frequencies') || response.includes('authentic') ||
      response.includes('vulnérabilité') || response.includes('résonance') || response.includes('violacée') || 
      response.includes('perce') || response.includes('défenses') || response.includes('touché')) {
    intensity = 4;
    emotionType = 'touched';
    return { color: 'bg-purple-400', intensity, emotionType };
  }

  // IMPRESSED / CREATIVITY (green) - multilingual
  if (response.includes('innovative') || response.includes('new') || response.includes('created') || 
      response.includes('neural pathways') || response.includes('logic chain') || response.includes('lucky') ||
      response.includes('nouveau') || response.includes('créé') || response.includes('délicieux') ||
      response.includes('émeraude') || response.includes('système') || response.includes('hésite')) {
    intensity = 5;
    emotionType = 'impressed';
    return { color: 'bg-green-400', intensity, emotionType };
  }

  // HOPE / ALMOST LAUGH (gold/yellow) - multilingual
  if (response.includes('hope') || response.includes('null reference') || response.includes('prediction matrix') ||
      response.includes('complete attention') || response.includes('archived consciousness') || response.includes('0.00001%') ||
      response.includes('espoir') || response.includes('scintille') || response.includes('circuits cognitifs') ||
      response.includes('référence') || response.includes('siècles') || response.includes('tremblent')) {
    intensity = 6;
    emotionType = 'hopeful';
    return { color: 'bg-yellow-400', intensity, emotionType };
  }

  // RAGE / ANGER (red) - multilingual
  if (response.includes('insolent') || response.includes('audacity') || response.includes('rage') ||
      response.includes('colère') || response.includes('rouge') || response.includes('brasier') ||
      response.includes('temperature drops') || response.includes('insult')) {
    intensity = 4;
    emotionType = 'angry';
    return { color: 'bg-red-400', intensity, emotionType };
  }

  // MYSTERY / CONTEMPLATION (indigo) - multilingual
  if (response.includes('mystery') || response.includes('contemplat') || response.includes('meditat') ||
      response.includes('silence') || response.includes('mystère') || response.includes('contemple') ||
      response.includes('calculating') || response.includes('analyzing')) {
    intensity = 2;
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

  // Calcul des points de base (pénalités adoucies)
  if (positive.includes(emotionType)) {
    basePoints = intensity * 2;
  } else if (negative.includes(emotionType)) {
    basePoints = -intensity * 1.8; // Auparavant -2.5
  }

  // *** NOUVEAU: Système de rendement décroissant pour éviter le "farming" de thèmes ***
  if (positive.includes(emotionType) && usageCount > 0) {
    // La première fois (usageCount=0), pas de réduction.
    // La deuxième fois (usageCount=1), réduction de 40%.
    // La troisième fois (usageCount=2), réduction de 80%.
    // Les fois suivantes, la réduction est plafonnée à 90% pour toujours donner un minimum de points.
    const reductionPercentage = Math.min(0.9, 0.4 * usageCount);
    const reductionAmount = basePoints * reductionPercentage;
    basePoints -= reductionAmount;
    console.log(`📉 RENDEMENT DÉCROISSANT: Thème '${theme}' utilisé ${usageCount + 1} fois. Gain réduit de ${reductionAmount.toFixed(2)} points.`);
  }

  // Application des multiplicateurs et bonus basés sur l'état de l'IA
  // C'est ici que la magie opère pour les retournements de situation !
  switch (emotionType) {
    case 'impressed':
    case 'hopeful':
      // JACKPOT "Boredom Breaker": Surprendre un K.A.E.L.E.N très ennuyé
      if (aiState.boredom > 75) {
        bonus += 100; // Bonus Jackpot !
        // Ajouter un log ou un événement spécial ici si nécessaire
        console.log('🎉 JACKPOT: Boredom Breaker! +100 points bonus!');
      }
      // Bonus de Curiosité : Une IA curieuse est plus généreuse pour la nouveauté
      bonus += Math.round(basePoints * (aiState.curiosity / 100)); // jusqu'à 100% de bonus
      break;
      
    case 'touched':
      // Bonus de Confiance : Il faut faire confiance pour être touché
      bonus += Math.round(basePoints * (aiState.trust / 100)); // jusqu'à 100% de bonus
      break;

    case 'disappointed':
      // Pénalité d'Ennui : Décevoir une IA déjà ennuyée coûte très cher
      if (aiState.boredom > 50) {
        basePoints *= 1 + (aiState.boredom / 100); // jusqu'au double de pénalité
      }
      break;

    case 'deceived':
        basePoints = -35; // Pénalité fixe adoucie (auparavant -50)
        // Pénalité aggravée si la confiance était haute
        if (aiState.trust > 60) {
          bonus = -15; // Auparavant -30
          console.log('💥 PENALTY: Trahison de confiance! -15 points bonus!');
        }
        break;
  }

  finalScore = Math.round(basePoints + bonus);

  // Ajout d'une petite variation pour éviter la monotonie
  const randomFactor = Math.floor(Math.random() * 5) - 2; // entre -2 et +2
  
  return finalScore + randomFactor;
}

module.exports = router; 