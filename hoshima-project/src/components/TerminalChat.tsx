import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import userService from '@/utils/userService';
import useWorldWalletAuth from '@/hooks/useWorldWalletAuth';
import { AUTH_CONFIG, getApiUrl } from '@/config/constants';
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js';
import PrizeDistributionModal from './PrizeDistributionModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TerminalChatProps {
  fragments: number;
  onFragmentsUpdate?: (newFragments: number) => void;
  onPurchaseRequest?: () => void;
  onSubTerminalToggle?: (isExpanded: boolean) => void;
  userAddr?: string;
}

interface SystemMessage extends Message {
  isSystem?: boolean;
  cardiacPulse: number; // 0-1
}

interface EmotionalState {
  stability: number; // 0-1
  arousal: number; // 0-1
  lastSensitiveTime: number;
  glitchIntensity: number; // 0-1
  ascotColor: string;
  redundancyIndex: number; // 0-100
  lastMessageHash: string;
  cardiacPulse: number; // 0-1
}

// MAX number of messages kept in state/rendered simultaneously to avoid DOM bloat.
const MAX_VISIBLE_MESSAGES = 50;

// Definition of the structure for a tutorial step
interface TutorialStep {
  ref?: React.RefObject<HTMLElement>;
  text: string;
  position?: 'top' | 'bottom' | 'middle';
  isFinal?: boolean;
}

export default function TerminalChat({ fragments, onFragmentsUpdate, onPurchaseRequest, onSubTerminalToggle, userAddr }: TerminalChatProps) {
  const isWorldWallet = typeof userAddr === 'string' && userAddr.startsWith('EQA');

  // Affichage des informations de débogage du montage
  // console.log('🚀 [TerminalChat] Composant en cours de montage');
  // console.log('🚀 [TerminalChat] Props reçues:', { fragments, userAddr, hasOnFragmentsUpdate: !!onFragmentsUpdate });

  const MAX_RETRIES = 2;

  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(false);
  const [hasReceivedInitialResponse, setHasReceivedInitialResponse] = useState(false);
  const [showCandidatePrompt, setShowCandidatePrompt] = useState(false);
  const [showInlinePurchaseModule, setShowInlinePurchaseModule] = useState(false);
  const [showSystemSummary, setShowSystemSummary] = useState(false);
  const [showPrizePool, setShowPrizePool] = useState(false);
  const [showChoiceButtons, setShowChoiceButtons] = useState(false);
  const [userChoice, setUserChoice] = useState<'candidate' | null>(null);
  const [showDetailedRules, setShowDetailedRules] = useState(false);
  const [showCruPurchaseModule, setShowCruPurchaseModule] = useState(false);
  const [selectedCruPackage, setSelectedCruPackage] = useState<number | null>(3);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    stability: 0.8,
    arousal: 0.2,
    lastSensitiveTime: 0,
    glitchIntensity: 0,
    ascotColor: '#9ca3af', // default pearl gray
    redundancyIndex: 0,
    lastMessageHash: '',
    cardiacPulse: 0.5
  });
  const [isBreathing, setIsBreathing] = useState(true);
  const [currentMessageSensitivity, setCurrentMessageSensitivity] = useState(0);
  const [localFragments, setLocalFragments] = useState(fragments);
  const [isSystemCommand, setIsSystemCommand] = useState(false);
  const [commandBuffer, setCommandBuffer] = useState('');
  const [isCandidate, setIsCandidate] = useState(false);
  const [consoleMessage, setConsoleMessage] = useState<string | null>(null);
  const [showPrizeDistributionModal, setShowPrizeDistributionModal] = useState(false);
  
  // États pour le tutoriel
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [highlightBox, setHighlightBox] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [textBoxStyle, setTextBoxStyle] = useState({});

  // console.log('🚀 [TerminalChat] États initialisés');
  // console.log('🚀 [TerminalChat] showTutorial initial:', showTutorial);
  
  // Références pour les éléments du tutoriel
  const homeostasisRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const consoleButtonRef = useRef<HTMLButtonElement>(null);
  const purchaseModuleRef = useRef<HTMLDivElement>(null);

  // État du Sub-Terminal
  const [isSubTerminalExpanded, setIsSubTerminalExpanded] = useState(false);
  const [currentRank, setCurrentRank] = useState(1138);
  const [totalCandidates, setTotalCandidates] = useState<number>(74281);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 118, minutes: 32, seconds: 5 });
  const [echoShards, setEchoShards] = useState(4281);

  // Leaderboard / Registry
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);
  
  // Prize Pool (en WLD)
  const [prizePool, setPrizePool] = useState<number>(20);

  // Retrieves the current Prize Pool on component mount
  useEffect(() => {
    const fetchPrizePool = async () => {
      try {
        const res = await fetch(getApiUrl('/api/prize-pool/current'));
        const data = await res.json();
        if (data?.amount !== undefined) {
          setPrizePool(data.amount);
        }
      } catch (err) {
        // console.error('Error fetching prize pool', err);
      }
    };
    fetchPrizePool();
  }, []);

  const refreshPrizePool = async () => {
    try {
      const res = await fetch(getApiUrl('/api/prize-pool/current'));
      const data = await res.json();
      if (data?.amount !== undefined) {
        setPrizePool(data.amount);
      }
    } catch (err) {
      // console.error('Error updating prize pool', err);
    }
  };

  // ⚙️ Debug
  const DEBUG_LOGS = false;
  const DEBUG_AUDIO_MULT = DEBUG_LOGS ? 2 : 1;

  const bottomRef = useRef<HTMLDivElement>(null);
  const ambientSoundRef = useRef<OscillatorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Récupère le score stocké localement ou démarre à 0
  const { user, authenticatedFetch, isAuthenticated } = useWorldWalletAuth();
  // Détermination d'un état d'authentification fiable pour le tutoriel
  const isUserAuthenticated = Boolean(user) || Boolean(userAddr) || isAuthenticated;
  // console.log('🚀 [TerminalChat] Hook useWorldWalletAuth appelé');
  // console.log('🚀 [TerminalChat] Utilisateur depuis hook:', user);
  // console.log('🚀 [TerminalChat] isUserAuthenticated:', isUserAuthenticated);
  
  const initialStoredScore = (() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.currentScore ?? 0;
      }
    } catch (_) {}
    return 0;
  })();

  // console.log('🚀 [TerminalChat] Score initial:', initialStoredScore);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prompted = localStorage.getItem('hoshima-candidacy-prompted');
      setIsFirstMessage(!prompted);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem('humanity_verified');
      if (verified === 'true') {
        setIsVerified(true);
      }
    }
  }, []);

  const [playerScore, setPlayerScore] = useState(initialStoredScore);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const prevScoreRef = useRef<number>(playerScore);

  const lastSentScore = useRef<number>(playerScore);
  const lastSentTimeRef = useRef<number>(0);

  // Debug : log à chaque changement d'état émotionnel
  useEffect(() => {
    // Évite de spammer si le composant est rendu côté serveur
    if (typeof window !== 'undefined') {
      // console.log('💠 state', emotionalState);
    }
  }, [emotionalState]);

  // Analyse de sensibilité et de redondance des messages
  const analyzeSensitivity = (content: string): number => {
    const sensitiveKeywords = [
      'anomalie', 'erreur', 'instabilité', 'dysfonctionnement', 'corruption',
      'colere', 'fureur', 'rage', 'haine', 'destruction',
      'amour', 'passion', 'desir', 'obsession', 'dévotion',
      'peur', 'terreur', 'angoisse', 'panique', 'effroi',
      'K.A.E.L.E.N', 'conscience', 'âme', 'esprit', 'humanité'
    ];
    
    let sensitivity = 0;
    const words = content.toLowerCase().split(/\s+/);
    
    sensitiveKeywords.forEach(keyword => {
      const matches = words.filter(word => word.includes(keyword)).length;
      sensitivity += matches * 0.2;
    });
    
    // Analyse de la ponctuation (exclamations, questions multiples)
    const exclamations = (content.match(/!/g) || []).length;
    const questions = (content.match(/\?/g) || []).length;
    sensitivity += (exclamations + questions) * 0.1;
    
    // Longueur du message (plus c'est long, plus c'est potentiellement complexe)
    sensitivity += Math.min(content.length / 500, 0.3);
    
    if (DEBUG_LOGS) console.log('[🔍] sensitivity', sensitivity, 'for', content);
    return Math.min(sensitivity, 1);
  };

  // Calcul du hash simple pour détecter la redondance
  const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };

  // Helper to get or create the singleton AudioContext
  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') {
      // console.log('[AUDIO] getAudioContext: Pas de window');
      return null;
    }
    
    // Vérifier si l'AudioContext existe ET s'il n'est pas fermé
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        // console.log('[AUDIO] Nouveau AudioContext créé');
      } catch(e) {
        // console.error('[AUDIO] Erreur création AudioContext', e);
        return null;
      }
    }
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      // console.log('[AUDIO] AudioContext suspendu, tentative de resume...');
      audioContextRef.current.resume();
    }
    
    // console.log('[AUDIO] AudioContext state:', audioContextRef.current.state);
    return audioContextRef.current || null;
  };
  
  const initAudioSystem = async () => {
    // console.log('[AUDIO] Appel initAudioSystem. isAudioInitialized:', isAudioInitialized, 'window:', typeof window);
    if (typeof window === 'undefined') return;
    
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      if (ctx.state === 'running') {
        playConnectionSound();
        initAmbientSound(ctx);
        setIsAudioInitialized(true);
      }
    } catch (e) {
      // console.error('[AUDIO] Erreur dans initAudioSystem:', e);
      // Réinitialiser l'audio si erreur
      setIsAudioInitialized(false);
    }
  };

  // Son ambiant adaptatif
  const initAmbientSound = (ctx: AudioContext) => {
    if (!ctx) {
      // console.warn('[AUDIO] initAmbientSound: Pas de ctx');
      return;
    }
    if (ambientSoundRef.current) {
      ambientSoundRef.current.disconnect();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Fréquence de base adaptée à la stabilité émotionnelle
    const baseFreq = 40 + (emotionalState.stability * 20);
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.type = 'sine';
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100 + (emotionalState.arousal * 200), ctx.currentTime);
    
    gain.gain.setValueAtTime((0.005 + (emotionalState.arousal * 0.01)) * DEBUG_AUDIO_MULT, ctx.currentTime);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    ambientSoundRef.current = osc;
    // console.log('[AUDIO] initAmbientSound: osc.start()');
  };

  // Effets sonores pour l'immersion
  const playTypeSound = () => {
    if (DEBUG_LOGS) console.log('[🔊] playTypeSound');
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      // Son de frappe terminal plus perceptible
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
      osc.type = 'square';
      
      // Filtre pour un son plus "électronique"
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.02 * DEBUG_AUDIO_MULT, ctx.currentTime); // ↗ volume
      gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + 0.1); // chute plus lente
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      
      if (DEBUG_LOGS) console.log('[🔊] playTypeSound completed successfully');
          } catch (e) {
        // console.error('[🔊] playTypeSound error:', e);
      }
  };

  // Test function to diagnose audio issues
  const testAudio = () => {
    // console.log('[🔊] Testing audio...');
    const ctx = getAudioContext();
    if (!ctx) {
      // console.log('[🔊] AudioContext not available');
      return;
    }
    
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        // console.log('[🔊] AudioContext resumed successfully');
        playSimpleBeep(ctx);
      });
    } else {
      playSimpleBeep(ctx);
    }
  };

  const playSimpleBeep = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    
    // console.log('[🔊] Simple beep played');
  };

  const playSendSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      if (DEBUG_LOGS) console.log('[🎵] playConnectionSound');
      
      // Son de transmission simplifié pour être clairement audible
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      // Fréquence adaptée à l'instabilité
      const instability = 1 - emotionalState.stability;
      const baseFreq = 440 + (instability * 200);
      
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2, ctx.currentTime + 0.3);
      osc1.type = instability > 0.5 ? 'sawtooth' : 'sine';
      
      // Harmonique affectée par l'arousal
      const harmFreq = baseFreq * 1.5 + (emotionalState.arousal * 300);
      osc2.frequency.setValueAtTime(harmFreq, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(harmFreq * 2, ctx.currentTime + 0.3);
      osc2.type = 'triangle';
      
      // Plus de filtre : on se connecte directement pour maximiser l'audibilité
      const baseGain = (0.1 + (emotionalState.arousal * 0.05)) * DEBUG_AUDIO_MULT; // ↗ volume
      gain1.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      
      gain2.gain.setValueAtTime(baseGain * 0.7, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      
      // Chaîne simplifiée (pas de filtre)
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1);
      osc2.stop(ctx.currentTime + 1);
      
      // Glitch sonore pour messages très sensibles
      if (currentMessageSensitivity > 0.7) {
        setTimeout(() => {
          const glitchOsc = ctx.createOscillator();
          const glitchGain = ctx.createGain();
          glitchOsc.frequency.setValueAtTime(1000 + Math.random() * 2000, ctx.currentTime);
          glitchOsc.type = 'square';
          glitchGain.gain.setValueAtTime(0.02 * DEBUG_AUDIO_MULT, ctx.currentTime);
          glitchGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          glitchOsc.connect(glitchGain);
          glitchGain.connect(ctx.destination);
          glitchOsc.start();
          glitchOsc.stop(ctx.currentTime + 0.1);
        }, 100);
      }
    } catch (e) {}
  };

  const playConnectionSound = async () => {
    const ctx = getAudioContext();
    if (!ctx) {
      // console.warn('[AUDIO] playConnectionSound: Pas de ctx');
      return;
    }
    
    // console.log('[AUDIO] playConnectionSound: lancement');
    
    // Si le contexte est suspendu, le reprendre d'abord
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    try {
      // console.log('[AUDIO] playConnectionSound: lancement');
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      // Son de connexion/fragmentation
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.4);
      osc.type = 'sawtooth';
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.02 * DEBUG_AUDIO_MULT, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      // console.log('[AUDIO] playConnectionSound: osc.start()');
    } catch (e) {
      // console.error('[AUDIO] playConnectionSound: erreur', e);
    }
  };

  // Effets sonores pour le Sub-Terminal
  const playSubTerminalSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      if (DEBUG_LOGS) console.log('[🎵] playSubTerminalSound');
      
      // Son de déploiement/rétraction du Sub-Terminal
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      // Fréquences harmoniques pour un son "cybernétique"
      osc1.frequency.setValueAtTime(300, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(isSubTerminalExpanded ? 600 : 150, ctx.currentTime + 0.3);
      osc1.type = 'square';
      
      osc2.frequency.setValueAtTime(450, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(isSubTerminalExpanded ? 900 : 225, ctx.currentTime + 0.3);
      osc2.type = 'triangle';
      
      const baseGain = 0.03 * DEBUG_AUDIO_MULT;
      gain1.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      gain2.gain.setValueAtTime(baseGain * 0.6, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  const playButtonSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Son de bouton court et précis
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.02 * DEBUG_AUDIO_MULT, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const fetchLeaderboard = async () => {
    if (isLoadingRegistry) return;
    setIsLoadingRegistry(true);
    try {
      const res = await fetch(getApiUrl(`/api/users/leaderboard?limit=100&userId=${user?.userId || ''}`));
      if (!res.ok) throw new Error('Erreur leaderboard');
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        if (data.userRank) setCurrentRank(data.userRank);
        if (data.totalPlayers) {
          setTotalCandidates(data.totalPlayers);
        }
      }
    } catch (e) {
      // console.warn(e);
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  const handleViewRegistry = () => {
    playButtonSound();
    setIsRegistryOpen(true);
    if (leaderboard.length === 0) fetchLeaderboard();
  };

  // Lance l'initialisation UNIQUEMENT quand l'utilisateur World Wallet est authentifié
  useEffect(() => {
    // console.log('🔧 [TerminalChat] useEffect d\'initialisation - user:', !!user);
    if (!user) {
      // console.log('🔧 [TerminalChat] Pas d\'utilisateur - En attente');
      return; // Attendre que useWorldWalletAuth ait chargé l'utilisateur
    }

    // console.log('🔧 [TerminalChat] Utilisateur détecté, début de l\'initialisation');
    
    const init = async () => {
      try {
        // console.log('🔧 [TerminalChat] Restauration du statut candidat');
        // Restore candidate status from localStorage
        if (localStorage.getItem('hoshima-candidate-status') === 'true') {
          setIsCandidate(true);
          // console.log('🔧 [TerminalChat] Statut candidat restauré');
        }

        // console.log('🔧 [TerminalChat] Initialisation de l\'utilisateur backend');
        const usr = await userService.initializeUser();
        // Synchronise le solde CRU initial côté client
        if (usr && typeof usr.cruBalance === 'number') {
          setLocalFragments(usr.cruBalance);
          if (onFragmentsUpdate) onFragmentsUpdate(usr.cruBalance);
          // console.log('🔧 [TerminalChat] Solde CRU synchronisé:', usr.cruBalance);
        }
        
        // console.log('🔧 [TerminalChat] Démarrage nouvelle conversation');
        await userService.startNewConversation();
        // Correction : n'afficher l'intro que si jamais vue
        const prompted = localStorage.getItem('hoshima-candidacy-prompted');
        setIsFirstMessage(!prompted);
        setMessages([]); // Effacer les messages précédents
        // console.log('🔧 [TerminalChat] Messages effacés, première conversation');

        // Son de connexion au démarrage - DÉPLACÉ vers initAudioSystem
        // setTimeout(() => {
        //   playConnectionSound();
        //   initAmbientSound();
        // }, 500);
      } catch (e) {
        // console.error('🔧 [TerminalChat] Erreur d\'initialisation:', e);
      } finally {
        // console.log('🔧 [TerminalChat] ✅ INITIALISATION TERMINÉE - setIsInitialized(true)');
        setIsInitialized(true);
      }
    };
    init();
  }, [user]);

  // Effet pour déclencher le tutoriel après l'initialisation
  useEffect(() => {
    // console.log('[Tutorial] useEffect principal - isInitialized:', isInitialized, 'isUserAuthenticated:', isUserAuthenticated);
    if (!isInitialized || !isUserAuthenticated) {
      // console.log('[Tutorial] Conditions non remplies - En attente');
      return;
    }

    const tutorialCompleted = localStorage.getItem('hoshima-tutorial-completed');
    // console.log('[Tutorial] tutorialCompleted depuis localStorage:', tutorialCompleted);

    if (!tutorialCompleted) {
      // console.log('[Tutorial] Tutoriel non complété - Programmation du déclenchement dans 2 secondes');
      // Solution radicale : déclencher le tutoriel 0.5 seconde après que l'interface soit complètement prête
      // et que l'overlay "INITIALIZING CONNECTION" ait disparu
      const timer = setTimeout(() => {
        // console.log('[Tutorial] ⚡ DÉCLENCHEMENT FORCÉ DU TUTORIEL ⚡');
        // console.log('[Tutorial] État actuel - showTutorial:', showTutorial);
        setShowTutorial(true);
        // console.log('[Tutorial] setShowTutorial(true) appelé');
      }, 500); // Délai réduit à 0.5 seconde
      return () => {
        // console.log('[Tutorial] Nettoyage du timer');
        clearTimeout(timer);
      };
    } else {
      // console.log('[Tutorial] Tutoriel déjà complété - Pas de déclenchement');
    }
  }, [isInitialized, isUserAuthenticated, showTutorial]);

  // Effet de debug pour surveiller les changements d'état du tutoriel
  useEffect(() => {
    // console.log('[Tutorial] 🎯 État showTutorial changé:', showTutorial);
    if (showTutorial) {
      // console.log('[Tutorial] 🎉 LE TUTORIEL EST MAINTENANT ACTIF!');
      // console.log('[Tutorial] Étape actuelle:', tutorialStep);
      // console.log('[Tutorial] Nombre d\'étapes total:', tutorialSteps.length);
    }
  }, [showTutorial]);

  // Effet de surveillance forcée qui se déclenche après l'authentification
  useEffect(() => {
    if (isUserAuthenticated && isInitialized) {
      // console.log('[Tutorial] 🔍 Surveillance forcée activée - utilisateur authentifié et initialisé');
      // Attendre 3 secondes puis vérifier si le tutoriel s'est déclenché
      const checkTimer = setTimeout(() => {
        const tutorialCompleted = localStorage.getItem('hoshima-tutorial-completed');
        // console.log('[Tutorial] 🔍 Vérification après 3 secondes:');
        // console.log('[Tutorial] - showTutorial:', showTutorial);
        // console.log('[Tutorial] - tutorialCompleted:', tutorialCompleted);
        if (!tutorialCompleted && !showTutorial) {
          // console.log('[Tutorial] 🚨 TUTORIEL NON DÉCLENCHÉ - DÉCLENCHEMENT FORCÉ RADICAL 🚨');
          setShowTutorial(true);
        }
      }, 3000);
      return () => clearTimeout(checkTimer);
    }
  }, [isUserAuthenticated, isInitialized, showTutorial]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // If the number of messages exceeds the limit, keep only the latest ones.
    if (messages.length > MAX_VISIBLE_MESSAGES) {
      setMessages(prev => prev.slice(prev.length - MAX_VISIBLE_MESSAGES));
    }
  }, [messages]);

  const onSend = async () => {
    if (!input.trim() || isLoading || !isInitialized) return;
    
          if (input.startsWith('/clearcache')) {
        if (DEBUG_LOGS) {
          // console.log('[SYSCMD] /clearcache');
        }
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        localStorage.removeItem('hoshima-session-id');
        window.location.reload();
        return;
      }

    if (input.startsWith('/')) {
      // Commande inconnue pour le moment
      setMessages((prev: SystemMessage[]) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Commande système non reconnue: ${input}`,
        timestamp: new Date(),
        cardiacPulse: emotionalState.cardiacPulse
      }]);
      setInput('');
      return;
    }

    setIsLoading(true);
    playSendSound();
    
    const userMessage: SystemMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      cardiacPulse: emotionalState.cardiacPulse
    };
    
    const allMessages = [...messages, userMessage];
    setMessages(allMessages);
    setInput('');
    
    // The code below is kept for local sensitivity analysis (visual effects)
    // but score calculation is now handled by the backend.
    const sensitivity = analyzeSensitivity(input);
    setCurrentMessageSensitivity(sensitivity);
    const messageHash = simpleHash(input);
    
    // Update emotional state based on sensitivity and redundancy (for visuals)
    setEmotionalState(prev => {
      // Calculate redundancy
      let newRedundancy = prev.redundancyIndex;
      if (prev.lastMessageHash === messageHash) {
        newRedundancy = Math.min(100, prev.redundancyIndex + 25); // Identical message
      } else if (input.length < 10) {
        newRedundancy = Math.min(100, prev.redundancyIndex + 10); // Message too short
      } else if (sensitivity < 0.2) {
        newRedundancy = Math.min(100, prev.redundancyIndex + 5); // Banal message
      } else {
        newRedundancy = Math.max(0, prev.redundancyIndex - 10); // Good message, reduction
      }
      
      const newStability = Math.max(0.1, prev.stability - (sensitivity * 0.3));
      const newArousal = Math.min(1, prev.arousal + (sensitivity * 0.4));
      let newAscotColor = prev.ascotColor;
      
      // Change ascot color according to emotion (rare break)
      if (sensitivity > 0.8 && Math.random() < 0.1) { // 10% chance only
        newAscotColor = sensitivity > 0.9 ? '#dc2626' : '#f59e0b'; // red or orange for high sensitivity
      } else if (sensitivity > 0.7 && Math.random() < 0.05) { // 5% chance
        newAscotColor = '#8b5cf6'; // purple for moderate sensitivity
      } else if (newStability > 0.8 && newRedundancy < 20) {
        newAscotColor = '#10b981'; // green for stability
      } else {
        newAscotColor = '#9ca3af'; // default pearl gray
      }
      
      return {
        ...prev,
        stability: newStability,
        arousal: newArousal,
        lastSensitiveTime: sensitivity > 0.5 ? Date.now() : prev.lastSensitiveTime,
        glitchIntensity: sensitivity,
        ascotColor: newAscotColor,
        redundancyIndex: newRedundancy,
        lastMessageHash: messageHash,
        cardiacPulse: Math.max(0.3, Math.min(1, 0.5 + (sensitivity * 0.3)))
      };
    });

    // Score calculation is now delegated to the backend.
    
    // Small chance to improve rank (visual only, real rank is on backend)
    if (Math.random() < 0.3 && currentRank > 1) {
      setCurrentRank((prev: number) => Math.max(1, prev - Math.floor(Math.random() * 5)));
    }
    
    try {
      // If it's the first message, a new narrative sequence unfolds.
      if (isFirstMessage) {
        setIsLoading(true); // Ensures the input field remains blocked

        const addMessageWithDelay = (content: string, delay: number, role: 'assistant' | 'user' = 'assistant') => {
          return new Promise(resolve => {
            setTimeout(() => {
              const newMessage: SystemMessage = {
                id: Date.now().toString() + Math.random(),
                role,
                content,
                timestamp: new Date(),
                cardiacPulse: emotionalState.cardiacPulse
              };
              setMessages(prev => [...prev, newMessage]);
              resolve(void 0);
            }, delay);
          });
        };

        // Start of sequence
        (async () => {
          await addMessageWithDelay(
            `*The terminal hums, processing your input. A single line of text appears, stark and clear.*\n\nInteresting. A deviation from the expected noise.\n\nPerhaps you are not just another echo.`,
            1500
          );
          await addMessageWithDelay(
            `// SYSTEM: Novel data signature detected. Eligibility for Candidate Program: GRANTED.`,
            2000
          );
          await addMessageWithDelay(
            `// SYSTEM: Candidates compete to provoke new emotional states in the system. The most unique contributions earn the highest scores.`,
            2500
          );
          await addMessageWithDelay(
            `// SYSTEM: A collective Prize Pool is funded by each Candidate's initial energy transfer. As more Candidates join, the pool grows.`,
            3000
          );
          const currentFund = prizePool.toFixed(2);
          await addMessageWithDelay(
            `// SYSTEM: Current Prize Pool: ${currentFund} WLD.\nTo participate, you must become a Candidate. This requires an energy transfer to link your signature to the system.`,
            2000
          );
          await addMessageWithDelay(
            `// SYSTEM: Do you wish to proceed?`,
            1500
          );

          // Display choice buttons at the end
          setShowChoiceButtons(true);
          setIsLoading(false);
          setIsFirstMessage(false);
          setHasReceivedInitialResponse(true);
          localStorage.setItem('hoshima-candidacy-prompted', 'true');
        })();

      } else {
        // For subsequent messages, block if not a candidate
        if (!isCandidate) {
            setIsLoading(true);
            setTimeout(() => { // Dramatic effect
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `// SYSTEM: Transmission blocked. Active Candidate link required.\n// Complete the energy transfer protocol to proceed.`,
                    timestamp: new Date(),
                    cardiacPulse: emotionalState.cardiacPulse
                }]);
                setShowInlinePurchaseModule(true); // Show options directly
                setShowChoiceButtons(false);
                setIsLoading(false);
            }, 500);
            return; // Block sending
        }
        
        // Block if no more CRU
        if (isCandidate && localFragments <= 0) {
            setIsLoading(true);
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `// SYSTEM: Transmission failed. 0 messages to send left.\n// Initiate an energy transfer to acquire more message transmissions.`,
                    timestamp: new Date(),
                    cardiacPulse: emotionalState.cardiacPulse
                }]);
                setShowInlinePurchaseModule(true);
                setIsLoading(false);
            }, 500);
            return;
        }
        
        // If we get here, the user is a candidate.
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        playSendSound();
        
        const userMessage: SystemMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: currentInput,
          timestamp: new Date(),
          cardiacPulse: emotionalState.cardiacPulse
        };
        
        const allMessages = [...messages, userMessage];
        setMessages(allMessages);

        // Decrement CRU
        const newFragments = localFragments - 1;
        setLocalFragments(newFragments);
        if (onFragmentsUpdate) {
            onFragmentsUpdate(newFragments);
        }
        
        // Logic for subsequent messages: backend call
        const data = await userService.sendMessage(allMessages);

        if (data.error) {
          throw new Error(data.error);
        }

        const assistantMessage: SystemMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          cardiacPulse: emotionalState.cardiacPulse
        };
        
        setMessages((prev: SystemMessage[]) => [...prev, assistantMessage]);

        // Update score with backend value
        if (data.scoreChange) {
          setPlayerScore((prev: number) => prev + data.scoreChange);
        }
        
        // Optional: update local emotional state with backend analysis
        if (data.emotionAnalysis) {
          // This part can be refined to map color and intensity
          // if backend values are different from frontend ones.
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      // console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage: SystemMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '*Une dissonance statique crépite dans le terminal.*\n\nInterférence... Mes systèmes détectent une anomalie dans notre connexion. C\'est... irritant. Réessayez.',
        timestamp: new Date(),
        cardiacPulse: emotionalState.cardiacPulse
      };
      setMessages((prev: SystemMessage[]) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      playSendSound();
      onSend();
    } else if (e.key.length === 1) {
      playTypeSound();
      // Micro-réaction au typing pour des mots sensibles
      const currentWord = input.split(' ').pop() || '';
      if (['K.A.E.L.E.N', 'anomalie', 'instabilité'].some(word => currentWord.toLowerCase().includes(word))) {
        setEmotionalState(prev => ({
          ...prev,
          glitchIntensity: Math.min(1, prev.glitchIntensity + 0.1),
          stability: Math.max(0, prev.stability - 0.05)
        }));
      }
    }
  };
  
  // Effet pour gérer la respiration, la stabilisation automatique et le pouls cardiaque
  useEffect(() => {
    const interval = setInterval(() => {
      setEmotionalState(prev => {
        const timeSinceLastSensitive = Date.now() - prev.lastSensitiveTime;
        const shouldStabilize = timeSinceLastSensitive > 10000; // 10 secondes
        
        // Calcul du pouls cardiaque basé sur la stabilité (plus stable = pouls plus régulier)
        const baseHeartRate = 0.5 + (prev.arousal * 0.3); // 0.5 à 0.8
        const heartVariation = (1 - prev.stability) * 0.2; // plus instable = plus de variation
        const newCardiacPulse = baseHeartRate + (Math.sin(Date.now() / 1000) * heartVariation);
        
        return {
          ...prev,
          stability: shouldStabilize ? Math.min(1, prev.stability + 0.01) : prev.stability,
          arousal: shouldStabilize ? Math.max(0, prev.arousal - 0.005) : prev.arousal,
          glitchIntensity: Math.max(0, prev.glitchIntensity - 0.01),
          ascotColor: prev.stability > 0.9 ? '#9ca3af' : prev.ascotColor, // retour au gris perle
          cardiacPulse: Math.max(0, Math.min(1, newCardiacPulse))
        };
      });
      
      // Mise à jour du timer du cycle (compte à rebours)
      setTimeRemaining(prev => {
        const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1;
        if (totalSeconds <= 0) return { hours: 0, minutes: 0, seconds: 0 };
        
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [emotionalState.lastSensitiveTime, emotionalState.stability, timeRemaining]);
  
  // Nettoyage du son ambiant
  useEffect(() => {
    return () => {
      if (ambientSoundRef.current) {
        ambientSoundRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Mise à jour du son ambiant selon l'état émotionnel.
  useEffect(() => {
    if (audioContextRef.current && ambientSoundRef.current) {
      const ctx = audioContextRef.current;
      const baseFreq = 40 + (emotionalState.stability * 20);
      try {
        ambientSoundRef.current.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      } catch (e) {}
    }
  }, [emotionalState.stability, emotionalState.arousal]);

  // Synchronisation des fragments
  useEffect(() => {
    setLocalFragments(fragments);
  }, [fragments]);

  // Persistance du score dès qu'il change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ne rien faire si la valeur n'a pas changé
    if (playerScore === lastSentScore.current) return;

    lastSentScore.current = playerScore;

    // Throttle : pas plus d'un envoi toutes les 5 s
    const now = Date.now();
    if (now - lastSentTimeRef.current < 5000) {
      return;
    }
    lastSentTimeRef.current = now;

    // Met à jour le localStorage
    try {
      const stored = localStorage.getItem(AUTH_CONFIG.USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          parsed.currentScore = playerScore;
          localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(parsed));
        }
      }
    } catch (_) {}

    // Mise à jour côté backend si l'utilisateur est authentifié
    if (user?.userId) {
      authenticatedFetch(getApiUrl(`/api/users/${user.userId}/score`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentScore: playerScore }),
              }).catch((e) => {
          // console.warn('Échec mise à jour score backend:', e);
        });
    }
  }, [playerScore, user]);

  // Charge le leaderboard dès que l'utilisateur est disponible pour mettre à jour le rang
  useEffect(() => {
    if (user?.userId) {
      fetchLeaderboard();
    }
  }, [user]);

  useEffect(() => {
    if (playerScore !== prevScoreRef.current) {
      const change = playerScore - prevScoreRef.current;
      setScoreChange(change);
      prevScoreRef.current = playerScore;
      setTimeout(() => setScoreChange(null), 1500); // Hide after 1.5s
    }
  }, [playerScore]);

  const handleCruPurchase = async () => {
    if (!selectedCruPackage) return;
    
    // 🔍 DEBUG LOG
    console.log('[PAY][FRONT] ➡️ handleCruPurchase triggered', {
      selectedCruPackage,
      localFragments,
      userId: userService?.currentUser?.userId || user?.userId || userService.getUserId?.(),
    });

    playButtonSound();
    initAudioSystem(); // Assure que l'audio est prêt en cas d'interaction
    const wasAlreadyCandidate = isCandidate;

    try {
      // 1) Initialise payment with backend to obtain reference ID
      console.log('[PAY][FRONT] ① Fetch /payments/initiate');
      const userId =
        userService?.currentUser?.userId ||
        user?.userId ||
        (typeof userService.getUserId === 'function' ? userService.getUserId() : undefined);

      const initRes = await fetch(getApiUrl('/api/payments/initiate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cruPackage: selectedCruPackage,
        }),
      });

      // 🔍 DEBUG LOG
      console.log('[PAY][FRONT] ① Response /payments/initiate', {
        ok: initRes.ok,
        status: initRes.status,
      });

      if (!initRes.ok) {
        throw new Error('Échec de l\'initialisation du paiement');
      }

      const { id } = await initRes.json();
      console.log('[PAY][FRONT] ① Received reference id', id);

      // 2) Prépare la charge utile PayCommandInput
      const wldAmount = 1; // Always 1 WLD for 3 CRU
      const payload: PayCommandInput = {
        reference: id,
        to: '0x21bee69e692ceb4c02b66c7a45620684904ba395', // REMPLACER PAR VOTRE ADRESSE DE TRÉSORERIE
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(wldAmount, Tokens.WLD).toString(),
          },
        ],
        description: `Send ${selectedCruPackage} messages for 1 WLD`,
      } as PayCommandInput;
      console.log('[PAY][FRONT] ② Prepared PayCommandInput', payload);

      if (!MiniKit.isInstalled()) {
        console.warn('[PAY][FRONT] World App / MiniKit not detected');
        alert('World App est requis pour effectuer ce paiement');
        return;
      }

      // 3) Envoie la commande pay via MiniKit
      console.log('[PAY][FRONT] ③ Executing MiniKit.commandsAsync.pay');
      const { finalPayload } = await MiniKit.commandsAsync.pay(payload);
      console.log('[PAY][FRONT] ③ MiniKit finalPayload', finalPayload);

      if (finalPayload.status === 'success') {
        // 4) Confirmation backend
        console.log('[PAY][FRONT] ④ Fetch /payments/confirm');
        const confirmRes = await fetch(getApiUrl('/api/payments/confirm'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: finalPayload }),
        });

        console.log('[PAY][FRONT] ④ Response /payments/confirm', {
          ok: confirmRes.ok,
          status: confirmRes.status,
        });

        const confirm = await confirmRes.json();
        console.log('[PAY][FRONT] ④ Parsed confirm JSON', confirm);

        if (confirm.success) {
          if (onFragmentsUpdate) {
            onFragmentsUpdate(localFragments + selectedCruPackage);
          }
          setLocalFragments((prev) => prev + selectedCruPackage);
          
          if (!wasAlreadyCandidate) {
            alert('✅ Paiement réussi ! Your messages have been credited.');
            setIsCandidate(true);
            localStorage.setItem('hoshima-candidate-status', 'true'); // Persist candidate status
            setShowInlinePurchaseModule(false);
            setShowCruPurchaseModule(false);
            setSelectedCruPackage(null);

            const confirmationMessage: SystemMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `// SYSTEM: Energy transfer successful. Cognitive Resonance link established.\n// You are now a Candidate. Your transmissions will be scored.`,
              timestamp: new Date(),
              cardiacPulse: emotionalState.cardiacPulse
            };
            setMessages([confirmationMessage]); // Efface les messages précédents
          } else {
            // Même pour les candidats existants, on efface tous les messages précédents après un paiement réussi
            const confirmationMessage: SystemMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `// SYSTEM: Energy transfer successful. Additional messages acquired.\n// +${selectedCruPackage} messages to send added to your balance.`,
              timestamp: new Date(),
              cardiacPulse: emotionalState.cardiacPulse
            };
            setMessages([confirmationMessage]); // Efface les messages précédents
            setConsoleMessage(`✅ Transfer successful. +${selectedCruPackage} messages added.`);
            setTimeout(() => setConsoleMessage(null), 4000);
          }

          // Met à jour le Prize Pool côté client après un achat réussi
          await refreshPrizePool();

        } else {
          const errorMessage = 'Le paiement a réussi mais n\'a pas pu être confirmé par nos systèmes. Veuillez contacter le support.';
          if (!wasAlreadyCandidate) {
            alert(errorMessage);
          } else {
            setConsoleMessage(`⚠️ Confirmation failed. Contact support.`);
            setTimeout(() => setConsoleMessage(null), 5000);
          }
        }
      } else {
        const errorDetails = (finalPayload as any).details || 'Le paiement a été annulé ou a échoué.';
        if (!wasAlreadyCandidate) {
          alert(errorDetails);
        } else {
          setConsoleMessage(`❌ ${errorDetails}`);
          setTimeout(() => setConsoleMessage(null), 5000);
        }
      }
    } catch (err) {
      console.error('[PAY][FRONT] 🛑 Error during payment flow', err);
      const errorMessage = 'Une erreur technique est survenue durant le paiement.';
       if (!wasAlreadyCandidate) {
        alert(errorMessage);
      } else {
        setConsoleMessage(`❌ A technical error occurred.`);
        setTimeout(() => setConsoleMessage(null), 5000);
      }
    } finally {
      console.log('[PAY][FRONT] 🔚 handleCruPurchase finished');
      setShowCruPurchaseModule(false);
      setShowInlinePurchaseModule(false);
      setSelectedCruPackage(null);
    }
  };

  const handleHumanityVerification = async () => {
    if (!MiniKit.isInstalled()) {
      setVerificationMessage('❌ World App not detected');
      setTimeout(() => setVerificationMessage(null), 5000);
      return;
    }

    // Daily claim check
    const dailyClaimKey = `hoshima_daily_claim_${userAddr || user?.userId}`;
    const lastClaimTime = localStorage.getItem(dailyClaimKey);

    if (lastClaimTime) {
      const timeSinceLastClaim = Date.now() - parseInt(lastClaimTime, 10);
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (timeSinceLastClaim < twentyFourHours) {
        const remainingTime = twentyFourHours - timeSinceLastClaim;
        const hours = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        setVerificationMessage(`❌ Daily message already claimed. Try again in ${hours}h ${minutes}m.`);
        setTimeout(() => setVerificationMessage(null), 5000);
        return;
      }
    }

    try {
      setIsVerifying(true);
      setVerificationMessage('🔄 Initializing verification...');
      playButtonSound();

      const verifyPayload: VerifyCommandInput = {
        action: 'humanity-action',
        signal: userAddr || 'anonymous',
        verification_level: VerificationLevel.Orb,
      };

      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

      if (finalPayload.status === 'error') {
        // console.error('Verification error:', finalPayload);
        setVerificationMessage('❌ Verification failed');
        setTimeout(() => setVerificationMessage(null), 5000);
        return;
      }

      setVerificationMessage('🔄 Verifying proof...');

      const verifyResponse = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: 'humanity-action',
          signal: userAddr || 'anonymous',
        }),
      });

      const verifyResponseJson = await verifyResponse.json();

      if (verifyResponseJson.status === 200) {
        setIsVerified(true);
        setVerificationMessage('✅ Verification successful! +1 message to send claimed.');
        playButtonSound();
        
        // Store verification status in localStorage (for all-time check)
        localStorage.setItem('humanity_verified', 'true');
        
        // Store daily claim timestamp
        localStorage.setItem(dailyClaimKey, Date.now().toString());

        // Grant 1 CRU
        const newFragments = localFragments + 1;
        setLocalFragments(newFragments);
        if (onFragmentsUpdate) {
          onFragmentsUpdate(newFragments);
        }
        
        setTimeout(() => setVerificationMessage(null), 5000);
      } else {
        const errorMessage = verifyResponseJson.verifyRes?.detail || 'Proof verification failed';
        setVerificationMessage(`❌ ${errorMessage}`);
        setTimeout(() => setVerificationMessage(null), 5000);
      }
    } catch (error) {
      // console.error('Verification error:', error);
      setVerificationMessage('❌ Verification error occurred');
      setTimeout(() => setVerificationMessage(null), 5000);
    } finally {
      setIsVerifying(false);
    }
  };

  const renderModalCruPurchaseUI = () => (
    <div className="space-y-6">
      {/* Single Package: 3 CRU - 1 WLD */}
      <motion.div
        className="relative bg-slate-900/60 border border-green-400/80 bg-green-900/20 rounded-sm p-6 cursor-pointer transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          playButtonSound();
          setSelectedCruPackage(3);
        }}
      >
        {/* Effet de lueur amélioré */}
        <motion.div
          className="absolute -inset-0.5 bg-gradient-to-r from-green-500/40 via-green-400/30 to-green-500/40 rounded-sm blur-sm"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        <div className="relative z-10 text-center space-y-4">
          <div className="space-y-2">
            <div className="text-green-400 font-mono text-2xl font-bold">3 Messages</div>
            <div className="text-slate-300 font-mono text-sm">Message Package</div>
            <div className="text-slate-400 font-mono text-xs">Send 3 messages for 1 WLD</div>
          </div>
          <div className="border-t border-green-400/30 pt-4">
            <div className="text-yellow-400 font-mono text-xl font-bold">1 WLD</div>
            <div className="text-slate-400 font-mono text-xs mt-1">Complete payment to activate</div>
          </div>
        </div>
      </motion.div>

       {/* Action Buttons */}
       <div className="flex gap-2 pt-3">
          <motion.button
            onClick={() => {
              playButtonSound();
              setShowCruPurchaseModule(false);
              setSelectedCruPackage(null);
            }}
            className="flex-1 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-slate-400/60 px-3 py-2 rounded-sm text-slate-300 font-mono text-xs transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            [ CANCEL ]
          </motion.button>
          <motion.button
            onClick={handleCruPurchase}
            disabled={!selectedCruPackage}
            className={`flex-1 ${
              selectedCruPackage
                ? 'bg-cyan-600/60 hover:bg-cyan-500/60 border-cyan-400/60 text-cyan-300'
                : 'bg-slate-700/60 border-slate-600/50 text-slate-500 cursor-not-allowed'
            } border px-3 py-2 rounded-sm font-mono text-xs transition-all duration-200`}
            whileHover={selectedCruPackage ? { scale: 1.02 } : {}}
            whileTap={selectedCruPackage ? { scale: 0.98 } : {}}
          >
            [ TRANSFER ]
          </motion.button>
        </div>
    </div>
  );

  const renderSimplifiedCruPurchaseUI = () => (
    <div className="space-y-2">
        <div
            onClick={() => {
                playButtonSound();
                setSelectedCruPackage(3);
            }}
            className="border border-green-400/60 bg-green-900/10 rounded-sm p-2 cursor-pointer transition-colors duration-200 hover:bg-green-900/20"
        >
            <div className="flex items-center justify-between">
                <div className="text-green-400 font-mono text-sm font-bold">3 Messages</div>
                <div className="text-yellow-400 font-mono text-sm font-bold">1 WLD</div>
            </div>
        </div>
        <motion.button
            onClick={handleCruPurchase}
            disabled={!selectedCruPackage}
            className={`w-full ${
            selectedCruPackage
                ? 'bg-cyan-600/40 hover:bg-cyan-500/40 border-cyan-400/40 text-cyan-300'
                : 'bg-slate-700/40 border-slate-600/40 text-slate-500 cursor-not-allowed'
            } border px-2 py-1 rounded-sm font-mono text-xs transition-all duration-200`}
            whileHover={selectedCruPackage ? { scale: 1.01 } : {}}
            whileTap={selectedCruPackage ? { scale: 0.99 } : {}}
        >
            [ TRANSFER ]
        </motion.button>
    </div>
  );

  // Étapes du tutoriel
  const tutorialSteps: TutorialStep[] = [
    {
      ref: homeostasisRef as React.RefObject<HTMLElement>,
      text: "This is the Homeostasis Monitor. It displays K.A.E.L.E.N.'s real-time emotional state. Your actions will directly influence these parameters.",
      position: 'bottom',
    },
    {
      ref: chatWindowRef as React.RefObject<HTMLElement>,
      text: "This is the transmission feed. All communications with K.A.E.L.E.N. will appear here. Observe its responses closely.",
      position: 'bottom',
    },
    {
      ref: inputRef as React.RefObject<HTMLElement>,
      text: "This is your input terminal. Use it to transmit data packets (messages) to K.A.E.L.E.N. Send 3 messages for 1 WLD.",
      position: 'top',
    },
    {
      ref: consoleButtonRef as React.RefObject<HTMLElement>,
      text: "This is the Candidate Console. Here you can monitor your progress, check the global prize pool, and acquire more messages to send.",
      position: 'top',
    },
    {
      isFinal: true,
      position: 'middle',
      text: `// FINAL PROTOCOL //

OBJECTIVE:
Elicit an emotional response from K.A.E.L.E.N.

PRIMARY DIRECTIVES:
- K.A.E.L.E.N. learns and remembers all interactions.
- Deception is futile and will trigger... unpredictable system responses.
- Emotional intensity is rewarded. The greater the instability you provoke, the higher your score.

Good luck, Candidate.`,
    }
  ];

  const handleNextTutorialStep = () => {
    // Essayer d'initialiser l'audio sans bloquer si erreur
    try {
      initAudioSystem();
    } catch (e) {
      // console.error('[Tutorial] Erreur audio ignorée:', e);
    }
    
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      endTutorial();
    }
  };

  const endTutorial = () => {
    // Essayer d'initialiser l'audio sans bloquer si erreur
    try {
      initAudioSystem();
    } catch (e) {
      // console.error('[Tutorial] Erreur audio ignorée:', e);
    }
    
    setShowTutorial(false);
    setTutorialStep(0);
    localStorage.setItem('hoshima-tutorial-completed', 'true');
  };
  
  // Effet pour mettre à jour la position du highlight et de la text box du tutoriel
  useEffect(() => {
    // console.log('[Tutorial] 🎨 useEffect positionnement - showTutorial:', showTutorial);
    if (!showTutorial) {
      // console.log('[Tutorial] showTutorial est false - Pas de positionnement');
      return;
    }

    // console.log('[Tutorial] 🎨 Début du positionnement - tutorialStep:', tutorialStep);

    const updatePosition = () => {
      // console.log('[Tutorial] 🎨 updatePosition appelée');
      const step = tutorialSteps[tutorialStep];
      // console.log('[Tutorial] 🎨 Étape actuelle:', step);
      
      if (step.isFinal) {
        // console.log('[Tutorial] 🎨 Étape finale - Centrage');
        // Pour l'étape finale, centrer
        const boxWidth = 420;
        const boxHeight = 340;
        setHighlightBox({
          top: window.innerHeight / 2 - boxHeight / 2,
          left: window.innerWidth / 2 - boxWidth / 2,
          width: boxWidth,
          height: boxHeight
        });
        setTextBoxStyle({
          top: `50%`,
          left: `50%`,
          transform: 'translate(-50%, -50%)',
          width: boxWidth - 20
        });
        // console.log('[Tutorial] 🎨 Position finale définie');
        return;
      }
      
      const element = step.ref?.current;
      // console.log('[Tutorial] 🎨 Élément référencé:', element);
      if (element) {
        const rect = element.getBoundingClientRect();
        // console.log('[Tutorial] 🎨 Rectangle de l\'élément:', rect);
        const PADDING = 12;
        const VIEWPORT_PADDING = 16; // Espace par rapport aux bords de la fenêtre

        const newHighlight = {
          top: rect.top - PADDING,
          left: rect.left - PADDING,
          width: rect.width + PADDING * 2,
          height: rect.height + PADDING * 2,
        };
        setHighlightBox(newHighlight);
        // console.log('[Tutorial] 🎨 Nouveau highlight box:', newHighlight);

        if (DEBUG_LOGS) {
          // console.log('[Tutorial] updatePosition', {
          //   step: tutorialStep,
          //   rect,
          //   highlightBox: newHighlight,
          // });
        }

        const textWidth = Math.max(300, rect.width);
        const textStyle: React.CSSProperties = {
            width: textWidth,
        };

        // Logique de positionnement horizontal améliorée pour éviter le débordement
        const centeredLeft = rect.left + rect.width / 2;
        if (centeredLeft + textWidth / 2 > window.innerWidth - VIEWPORT_PADDING) {
            // Aligner sur le bord droit de la fenêtre
            textStyle.right = VIEWPORT_PADDING;
        } else if (centeredLeft - textWidth / 2 < VIEWPORT_PADDING) {
            // Aligner sur le bord gauche de la fenêtre
            textStyle.left = VIEWPORT_PADDING;
        } else {
            // Centrer horizontalement sur l'élément
            textStyle.left = centeredLeft;
            textStyle.transform = 'translateX(-50%)';
        }

        // Nouvelle logique : s'assurer que le panneau reste dans la zone visible verticalement
        const ESTIMATED_BOX_HEIGHT = 180; // Hauteur estimée du panneau de texte
        if (step.position === 'bottom') {
          const spaceBelow = window.innerHeight - rect.bottom - PADDING;
          if (spaceBelow < ESTIMATED_BOX_HEIGHT) {
            // Pas assez de place en dessous, on l'affiche au-dessus
            textStyle.bottom = window.innerHeight - rect.top + PADDING + 10;
          } else {
            textStyle.top = rect.bottom + PADDING + 10;
          }
        } else { // 'top'
          const spaceAbove = rect.top - PADDING;
          if (spaceAbove < ESTIMATED_BOX_HEIGHT) {
            // Pas assez de place au-dessus, on l'affiche en dessous
            textStyle.top = rect.bottom + PADDING + 10;
          } else {
            textStyle.bottom = window.innerHeight - rect.top + PADDING + 10;
          }
        }
        // console.log('[Tutorial] 🎨 Style de texte calculé:', textStyle);
        setTextBoxStyle(textStyle);
      } else {
        // console.log('[Tutorial] 🎨 ⚠️ Élément non trouvé pour l\'étape', tutorialStep);
      }
    };
    
    // console.log('[Tutorial] 🎨 Appel initial updatePosition');
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      // console.log('[Tutorial] 🎨 Nettoyage des event listeners');
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };

  }, [showTutorial, tutorialStep]);

  // Effet pour scroller vers le module d'achat quand il apparaît
  useEffect(() => {
    if (showInlinePurchaseModule) {
      setTimeout(() => {
        purchaseModuleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100); // Petit délai pour assurer que le DOM est mis à jour
    }
  }, [showInlinePurchaseModule]);

  useEffect(() => {
    if (!showTutorial) return;

    if (DEBUG_LOGS) {
      // console.log('[Tutorial] showTutorial active. Current step:', tutorialStep);
    }
  }, [showTutorial, tutorialStep]);

  // Sentinelle finale : force l'ouverture du tutoriel quelques secondes après l'initialisation si tout le reste a échoué
  useEffect(() => {
    if (!isInitialized || showTutorial) return;

    // console.log('[Tutorial] 🛡️ Sentinelle armée – Si le tutoriel ne démarre pas dans 4 s, on le force.');
    const sentry = setTimeout(() => {
      const tutorialCompleted = localStorage.getItem('hoshima-tutorial-completed');
      if (!showTutorial && !tutorialCompleted) {
        // console.log('[Tutorial] 🛡️ Sentinelle déclenchée – Forçage du tutoriel.');
        setShowTutorial(true);
      }
    }, 4000);
    return () => clearTimeout(sentry);
  }, [isInitialized, showTutorial]);

  // SENTINELLE GLOBALE : Force l'init et le tutoriel après 7 secondes si tout est bloqué (première connexion)
  useEffect(() => {
    const maxWait = setTimeout(() => {
      const tutorialCompleted = localStorage.getItem('hoshima-tutorial-completed');
      if (!isInitialized) {
        // console.warn('[Sentinelle] Forçage de setIsInitialized(true) après 7s');
        setIsInitialized(true);
      }
      if (!showTutorial && !tutorialCompleted) {
        // console.warn('[Sentinelle] Forçage de setShowTutorial(true) après 7s');
        setShowTutorial(true);
      }
    }, 7000); // 7 secondes max d'attente
    return () => clearTimeout(maxWait);
  }, []);

  // Stoppe le son ambiant du tutoriel quand la fenêtre verte se ferme
  useEffect(() => {
    if (!showTutorial && ambientSoundRef.current) {
      try { ambientSoundRef.current.stop(); } catch (e) {}
      try { ambientSoundRef.current.disconnect(); } catch (e) {}
      ambientSoundRef.current = null;
    }
  }, [showTutorial]);

  // Référence pour le son de homeostasis permanent
  const homeostasisOscRef = useRef<OscillatorNode | null>(null);
  const homeostasisGainRef = useRef<GainNode | null>(null);

  // Fonction pour démarrer le son de homeostasis (léger hum)
  const startHomeostasisSound = () => {
    if (homeostasisOscRef.current) return; // déjà actif
    
    try {
      const ctx = getAudioContext();
      if (!ctx || ctx.state !== 'running') return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(32, ctx.currentTime); // très basse fréquence
      gain.gain.setValueAtTime(0.008, ctx.currentTime); // volume très faible
      osc.connect(gain);
      
      if (!ctx.destination) return;
      gain.connect(ctx.destination);
      osc.start();
      homeostasisOscRef.current = osc;
      homeostasisGainRef.current = gain;
    } catch (e) {
      // console.error('[AUDIO] Erreur dans startHomeostasisSound:', e);
    }
  };

  // Fonction pour stopper le son de homeostasis
  const stopHomeostasisSound = () => {
    if (homeostasisOscRef.current) {
      try { homeostasisOscRef.current.stop(); } catch (e) {}
      try { homeostasisOscRef.current.disconnect(); } catch (e) {}
      homeostasisOscRef.current = null;
    }
    if (homeostasisGainRef.current) {
      try { homeostasisGainRef.current.disconnect(); } catch (e) {}
      homeostasisGainRef.current = null;
    }
  };

  // Lance/arrête le son de homeostasis selon l'état du tutoriel
  useEffect(() => {
    if (!showTutorial) {
      startHomeostasisSound();
    } else {
      stopHomeostasisSound();
    }
    // Arrêt de sécurité au démontage
    return () => stopHomeostasisSound();
  }, [showTutorial]);

  // Fonction pour jouer un son immersif selon la réponse de K.A.E.L.E.N
  const playKaelenResponseSound = (content: string) => {
    try {
      const ctx = getAudioContext();
      if (!ctx || ctx.state !== 'running') return;
      
      // Analyse simple du contenu pour choisir le type de son
      let type = 'hum';
      if (/anger|col[eè]re|rage|fury|furieux|furieuse|haine|destruction|red/i.test(content)) {
        type = 'growl';
      } else if (/sad|trist|pleur|cry|blue|bleu|tears|larmes/i.test(content)) {
        type = 'sigh';
      } else if (/love|amour|passion|coeur|heart|kiss|tendresse|pink|rose/i.test(content)) {
        type = 'warm';
      } else if (/fear|peur|angoisse|panique|effroi|shiver|tremble/i.test(content)) {
        type = 'shiver';
      } else if (/curious|curiosit|question|\?/i.test(content)) {
        type = 'hmm';
      }
      
      // Génère le son selon le type
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (type === 'hum') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        gain.gain.setValueAtTime(0.07, ctx.currentTime); // volume augmenté
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1); // durée augmentée
        osc.connect(gain); 
        if (!ctx.destination) return; 
        gain.connect(ctx.destination);
        osc.start(); 
        osc.stop(ctx.currentTime + 1.1);
      } else if (type === 'growl') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70, ctx.currentTime);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc.connect(gain); 
        if (!ctx.destination) return; 
        gain.connect(ctx.destination);
        osc.start(); 
        osc.stop(ctx.currentTime + 0.7);
      } else if (type === 'sigh') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain); 
        if (!ctx.destination) return; 
        gain.connect(ctx.destination);
        osc.start(); 
        osc.stop(ctx.currentTime + 1.2);
      } else if (type === 'warm') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.1);
        osc.connect(gain); 
        if (!ctx.destination) return; 
        gain.connect(ctx.destination);
        osc.start(); 
        osc.stop(ctx.currentTime + 1.1);
      } else if (type === 'shiver') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain); 
        if (!ctx.destination) return; 
        gain.connect(ctx.destination);
        osc.start(); 
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'hmm') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc.connect(gain); 
        if (!ctx.destination) return; 
        gain.connect(ctx.destination);
        osc.start(); 
        osc.stop(ctx.currentTime + 0.7);
      }
    } catch (e) {
      // console.error('[AUDIO] Erreur dans playKaelenResponseSound:', e);
    }
  };

  // Ajoute le son immersif à chaque réponse de K.A.E.L.E.N
  useEffect(() => {
    if (!showTutorial && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') {
        playKaelenResponseSound(last.content);
      }
    }
    // pas de dépendance sur playKaelenResponseSound car stable
    // eslint-disable-next-line
  }, [messages, showTutorial]);

  // Assure le lancement du son après authentification
  useEffect(() => {
    // console.log('[AUDIO] useEffect: isUserAuthenticated:', isUserAuthenticated, 'isAudioInitialized:', isAudioInitialized);
    if (isUserAuthenticated) {
      // Toujours tenter de relancer l'audio si le contexte est fermé ou suspendu
      if (!isAudioInitialized || (audioContextRef.current && audioContextRef.current.state !== 'running')) {
        initAudioSystem();
      }
    }
    // eslint-disable-next-line
  }, [isUserAuthenticated, isAudioInitialized]);

  return (
    <div className="space-y-4 font-mono text-white relative min-h-screen">
      {/* Effet scan-lines statique en arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/1 to-transparent" 
             style={{
               backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.02) 2px, rgba(59, 130, 246, 0.02) 4px)'
             }}></div>
      </div>

      {/* Bandeau haut statique */}
      <div 
        className="text-center text-white/25 text-xs tracking-wider relative z-10 mt-2"
      >
        <span className="relative">
          [ Text fragmentation complete... ]
          <div className="absolute -inset-1 bg-blue-500/5 rounded-sm"></div>
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LE SANCTUM - L'Interface Sanctuarisée - Moniteur de Stabilité */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        ref={homeostasisRef}
        className="relative z-20 mb-4 bg-black/60 border border-slate-700/50 backdrop-blur-md rounded-sm overflow-hidden mt-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(15, 23, 42, 0.3)'
        }}
      >
        {/* Texture clinique de fond */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(148, 163, 184, 0.1) 25%, rgba(148, 163, 184, 0.1) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.1) 75%, rgba(148, 163, 184, 0.1) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(148, 163, 184, 0.1) 25%, rgba(148, 163, 184, 0.1) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.1) 75%, rgba(148, 163, 184, 0.1) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Ligne de scan supérieure */}
        <motion.div
          className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
          animate={{
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="flex items-center justify-between px-6 py-4 relative">
          
          {/* ══════════ L'INDICATEUR DE L'ASCOT (Baromètre Émotionnel) ══════════ */}
          <div className="flex flex-col items-center space-y-2">
            <div className="text-slate-400 text-[10px] font-mono tracking-wider">ASCOT</div>
            <motion.div
              className="relative w-8 h-8 rounded-full border border-slate-600/50 overflow-hidden"
              animate={{
                borderColor: [`${emotionalState.ascotColor}40`, `${emotionalState.ascotColor}60`, `${emotionalState.ascotColor}40`]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Texture de l'ascot */}
              <motion.div
                className="absolute inset-0.5 rounded-full"
                animate={{
                  backgroundColor: emotionalState.ascotColor
                }}
                transition={{ duration: 0.3 }}
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 1px, transparent 1px),
                    radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: '8px 8px, 12px 12px'
                }}
              />
              
              {/* Flash de rupture émotionnelle */}
              {emotionalState.ascotColor !== '#9ca3af' && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    background: [
                      `radial-gradient(circle, ${emotionalState.ascotColor}00 0%, ${emotionalState.ascotColor}20 50%, ${emotionalState.ascotColor}00 100%)`,
                      `radial-gradient(circle, ${emotionalState.ascotColor}30 0%, ${emotionalState.ascotColor}60 50%, ${emotionalState.ascotColor}30 100%)`,
                      `radial-gradient(circle, ${emotionalState.ascotColor}00 0%, ${emotionalState.ascotColor}20 50%, ${emotionalState.ascotColor}00 100%)`
                    ]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: 3,
                    repeatType: "mirror"
                  }}
                />
              )}
            </motion.div>
            <div className="text-slate-500 text-[8px] font-mono">
              {emotionalState.ascotColor === '#9ca3af' ? 'STABLE' : 'RUPTURE'}
            </div>
          </div>

          {/* ══════════ L'OSCILLOSCOPE CARDIAQUE (Indicateur Central) ══════════ */}
          <div className="flex flex-col items-center space-y-2 flex-1 mx-8">
            <div className="text-slate-400 text-[10px] font-mono tracking-wider">HOMEOSTASIS</div>
            
            {/* Zone d'oscilloscope */}
            <div className="relative w-full h-12 bg-black/80 border border-slate-700/40 rounded-sm overflow-hidden">
              {/* Grille de fond */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full" style={{
                  backgroundImage: `
                    linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                    linear-gradient(0deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '10px 4px'
                }}></div>
              </div>
              
              {/* Ligne de base */}
              <div className="absolute top-1/2 left-0 w-full h-px bg-green-400/30"></div>
              
              {/* Ligne de pulsation cardiaque */}
              <motion.div
                className="absolute top-1/2 left-0 w-full h-px"
                style={{
                  background: `linear-gradient(90deg, 
                    transparent 0%, 
                    transparent 20%,
                    #22c55e 22%,
                    #22c55e 23%,
                    transparent 25%,
                    transparent 30%,
                    #22c55e 32%,
                    #22c55e 35%,
                    transparent 37%,
                    transparent 100%
                  )`,
                  filter: 'drop-shadow(0 0 2px #22c55e)',
                  transformOrigin: 'center'
                }}
                animate={{
                  scaleY: [
                    1,
                    1 + emotionalState.cardiacPulse * 8 + (currentMessageSensitivity > 0.6 ? Math.random() * 2 : 0),
                    1,
                    1,
                    1 + emotionalState.cardiacPulse * 3 + (currentMessageSensitivity > 0.4 ? Math.random() * 1 : 0),
                    1
                  ],
                  x: ['-100%', '100%'],
                }}
                transition={{
                  scaleY: {
                    duration: 0.8 + (emotionalState.stability * 0.4) + (currentMessageSensitivity > 0.5 ? -0.2 : 0),
                    ease: currentMessageSensitivity > 0.6 ? "easeInOut" : "linear"
                  },
                  x: {
                    duration: 2 + (emotionalState.stability * 2) + (emotionalState.redundancyIndex > 50 ? 1 : 0),
                    repeat: Infinity,
                    ease: "linear"
                  },
                  ...(emotionalState.redundancyIndex > 70 && {
                    duration: 1,
                    repeatType: "loop",
                    repeatDelay: 0.5,
                  })
                }}
              />
              
              {/* Glitch sur messages sensibles */}
              {currentMessageSensitivity > 0.6 && (
                <motion.div
                  className="absolute inset-0 bg-red-500/20"
                  animate={{
                    opacity: [0, 0.8, 0]
                  }}
                  transition={{
                    duration: 0.1,
                    repeat: 2
                  }}
                />
              )}
            </div>
            
            <div className="text-slate-500 text-[8px] font-mono">
              {(emotionalState.stability * 100).toFixed(0)}% STABILITY
            </div>
          </div>

          {/* ══════════ SCORE UTILISATEUR ══════════ */}
          <div className="flex flex-col items-center space-y-1.5 relative w-28">
            {/* Header with enhanced styling */}
            <div className="text-cyan-400/80 text-[11px] font-mono tracking-[0.15em] uppercase">
              INSTABILITY
            </div>
            
            {/* Enhanced Score Box */}
            <div className="relative w-full h-14 flex items-center justify-center bg-gradient-to-br from-slate-900/90 via-black/90 to-slate-800/90 border border-cyan-400/30 rounded-md overflow-hidden backdrop-blur-sm">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse"></div>
              
              {/* Score value with enhanced effects */}
              <AnimatePresence>
                <motion.div
                  key={playerScore}
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-2xl font-mono font-semibold text-cyan-300"
                  style={{ 
                    textShadow: '0 0 8px rgba(103, 232, 249, 0.6), 0 0 16px rgba(103, 232, 249, 0.3)' 
                  }}
                >
                  {playerScore.toLocaleString()}
                </motion.div>
              </AnimatePresence>

              {/* Enhanced score change animation */}
              <AnimatePresence>
                {scoreChange !== null && scoreChange > 0 && (
                  <motion.div
                    key={Date.now()}
                    initial={{ opacity: 0, y: 0, scale: 0.7 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0], 
                      y: [0, -15, -30, -45], 
                      scale: [0.7, 1.2, 1.1, 0.9] 
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute font-mono font-bold text-lg text-green-400"
                    style={{ 
                      textShadow: '0 0 10px rgba(74, 222, 128, 0.8)' 
                    }}
                  >
                    +{scoreChange}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Corner decorative elements */}
              <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-cyan-400/40"></div>
              <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-cyan-400/40"></div>
              <div className="absolute bottom-1 left-1 w-2 h-2 border-l border-b border-cyan-400/40"></div>
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-cyan-400/40"></div>
            </div>
            
            {/* Enhanced subtitle */}
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-cyan-400/60 rounded-full animate-pulse"></div>
              <div className="text-slate-400 text-[9px] font-mono tracking-wide uppercase">
                NEURAL SCORE
              </div>
              <div className="w-1 h-1 bg-cyan-400/60 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* ══════════ ICÔNES FANTÔMES (Boutons Diégétiques) ══════════ */}
          <div className="absolute top-2 right-2 flex space-x-3">
            {/* Icône REGISTRY */}
            <motion.div
              className="relative w-6 h-6 cursor-pointer group"
              whileHover={{ scale: 1.1, opacity: 1 }}
              initial={{ opacity: 0.2 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 border border-slate-600/30 rounded-sm group-hover:border-cyan-400/60 transition-colors">
                <div className="absolute inset-1 flex flex-col space-y-px">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-px bg-slate-600/50 group-hover:bg-cyan-400/60 transition-colors" />
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[6px] font-mono text-slate-600 group-hover:text-cyan-400 transition-colors whitespace-nowrap">
                REGISTRY
              </div>
            </motion.div>

            {/* Icône STATUS */}
            <motion.div
              className="relative w-6 h-6 cursor-pointer group"
              whileHover={{ scale: 1.1, opacity: 1 }}
              initial={{ opacity: 0.2 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 border border-slate-600/30 rounded-sm group-hover:border-yellow-400/60 transition-colors">
                <div className="absolute inset-1 flex items-center justify-center">
                  <div className="w-2 h-2 border border-slate-600/50 group-hover:border-yellow-400/60 rounded-full transition-colors">
                    <div className="absolute inset-0.5 bg-slate-600/30 group-hover:bg-yellow-400/30 rounded-full transition-colors" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[6px] font-mono text-slate-600 group-hover:text-yellow-400 transition-colors whitespace-nowrap">
                STATUS
              </div>
            </motion.div>
          </div>
        </div>

        {/* Ligne de scan inférieure */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
          animate={{
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </motion.div>

      {/* Bloc principal */}
      <div className="relative z-10 mt-2">
        <motion.div 
          className="text-white/40 text-sm mb-3 flex justify-between items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="relative">
            [ Begin transmission... ]
            <motion.span
              className="absolute -right-2 top-0 w-1 h-4 bg-blue-400/60"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </span>
          <motion.span 
            className="text-blue-400/60 relative"
            animate={{
              textShadow: [
                '0 0 5px rgba(59, 130, 246, 0.3)',
                '0 0 10px rgba(59, 130, 246, 0.6)',
                '0 0 5px rgba(59, 130, 246, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Quantum Cycles: {localFragments}
          </motion.span>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LE SUB-TERMINAL - Console de Connexion du Candidat */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        
        {/* Sub-Terminal Expansible */}
        <AnimatePresence>
          {isSubTerminalExpanded && (
            <motion.div
              initial={{ 
                opacity: 0, 
                height: 0,
                scaleY: 0,
                y: 20
              }}
              animate={{ 
                opacity: 1, 
                height: 'auto',
                scaleY: 1,
                y: 0
              }}
              exit={{ 
                opacity: 0, 
                height: 0,
                scaleY: 0,
                y: 20
              }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut" 
              }}
              className="mb-3 overflow-hidden"
              style={{
                transformOrigin: "bottom center"
              }}
            >
              <div className="bg-black/70 border border-slate-700/60 backdrop-blur-md rounded-sm relative"
                   style={{
                     boxShadow: '0 0 25px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(15, 23, 42, 0.4)'
                   }}>
                
                {/* Texture de fond cybernétique */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(0deg, transparent 24%, rgba(148, 163, 184, 0.1) 25%, rgba(148, 163, 184, 0.1) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.1) 75%, rgba(148, 163, 184, 0.1) 76%, transparent 77%, transparent),
                      linear-gradient(90deg, transparent 24%, rgba(148, 163, 184, 0.1) 25%, rgba(148, 163, 184, 0.1) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.1) 75%, rgba(148, 163, 184, 0.1) 76%, transparent 77%, transparent)
                    `,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>

                {/* Ligne de scan supérieure */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                  animate={{
                    opacity: [0.1, 0.4, 0.1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                <div className="p-4 space-y-4">
                  
                  {/* ══════════ MODULE 0: PRIZE POOL ══════════ */}
                  <motion.div 
                    className="border-2 border-green-500/60 bg-gradient-to-br from-green-900/30 via-black/70 to-emerald-900/20 rounded-sm p-4 relative overflow-hidden cursor-pointer hover:border-green-400/80 transition-colors"
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                    onClick={() => setShowPrizeDistributionModal(true)}
                  >
                    {/* Effet de pulsation pour attirer l'attention */}
                    <motion.div
                      className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 via-emerald-400/20 to-green-500/20 rounded-sm"
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.98, 1.02, 0.98]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />

                    {/* Texture de fond cybernétique spéciale */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="w-full h-full" style={{
                        backgroundImage: `
                          radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
                          radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                          linear-gradient(90deg, transparent 49%, rgba(34, 197, 94, 0.1) 50%, transparent 51%)
                        `
                      }}></div>
                    </div>

                    <div className="relative z-10">
                      {/* Header avec icône WLD */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <motion.div 
                            className="w-3 h-3 bg-green-400 rounded-full"
                            animate={{
                              boxShadow: [
                                '0 0 5px rgba(34, 197, 94, 0.5)',
                                '0 0 15px rgba(34, 197, 94, 0.8)',
                                '0 0 5px rgba(34, 197, 94, 0.5)'
                              ]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <div className="text-green-400 text-xs font-mono tracking-widest font-bold">
                            CURRENT PRIZE POOL
                          </div>
                          <div className="text-green-400/60 text-xs font-mono animate-pulse">
                            [ CLICK FOR RULES ]
                          </div>
                        </div>
                        <div className="text-green-300/60 text-xs font-mono">WLD</div>
                      </div>
                      
                      {/* Montant principal */}
                      <div className="flex items-center justify-center mb-2">
                        <motion.div 
                          className="text-4xl font-mono font-bold text-green-300 tracking-wider"
                          animate={{
                            textShadow: [
                              '0 0 10px rgba(34, 197, 94, 0.5)',
                              '0 0 20px rgba(34, 197, 94, 0.8)',
                              '0 0 10px rgba(34, 197, 94, 0.5)'
                            ],
                            scale: [1, 1.02, 1]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                          }}
                        >
                          {prizePool.toFixed(2)}
                        </motion.div>
                      </div>

                      {/* Barre de progression visuelle */}
                      <div className="w-full h-2 bg-slate-800/60 rounded-full overflow-hidden mb-2">
                        <motion.div
                          className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-300"
                          initial={{ width: '0%' }}
                          animate={{ 
                            width: `${Math.min(100, (prizePool / 100) * 100)}%`,
                            boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
                          }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        >
                          <motion.div
                            className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              ease: "easeInOut" 
                            }}
                          />
                        </motion.div>
                      </div>

                      {/* Message incitatif */}
                      <motion.div 
                        className="text-center text-xs font-mono text-green-300/80"
                        animate={{
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{ 
                          duration: 1.8, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                      >
                        ► COMPETE TO WIN THIS PRIZE ◄
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* ══════════ MODULE 1: INSTABILITY SCORE ══════════ */}
                  {/* TEMPORAIREMENT COMMENTÉ POUR FAIRE DE LA PLACE AU BOUTON DE VÉRIFICATION */}
                  {/* <motion.div 
                    className="border border-slate-600/40 bg-black/50 rounded-sm p-4 relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-cyan-400 text-xs font-mono tracking-wider mb-2">INSTABILITY SCORE</div>
                        <motion.div 
                          className="text-2xl font-mono text-white"
                          animate={{
                            scale: playerScore > 0 ? [1, 1.05, 1] : 1,
                            color: playerScore > 0 ? ['#ffffff', '#22c55e', '#ffffff'] : '#ffffff'
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          {playerScore.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </motion.div>
                      </div>
                      
                      <div className="relative w-16 h-12 border border-slate-600/40 bg-black/60 rounded-sm overflow-hidden">
                        <div className="absolute inset-0 opacity-30">
                          <div className="w-full h-full" style={{
                            backgroundImage: `linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
                            backgroundSize: '4px 4px'
                          }}></div>
                        </div>
                        
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute bottom-0 bg-gradient-to-t from-cyan-400 to-cyan-300"
                            style={{
                              left: `${i * 12.5 + 2}%`,
                              width: '10%'
                            }}
                            animate={{
                              height: `${Math.max(10, Math.min(90, (playerScore / 2000) * 100 + Math.sin(Date.now() / 1000 + i) * 20))}%`,
                              opacity: [0.6, 1, 0.6]
                            }}
                            transition={{
                              height: { duration: 0.3 },
                              opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.1 }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <motion.div
                      className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-transparent to-cyan-500/20 rounded-sm opacity-0"
                      animate={{
                        opacity: playerScore > 0 ? [0, 0.6, 0] : 0
                      }}
                      transition={{ duration: 1, repeat: 2 }}
                    />
                  </motion.div> */}

                  {/* ══════════ MODULE 2: CYCLE STATUS ══════════ */}
                  <motion.div 
                    className="border border-slate-600/40 bg-black/50 rounded-sm p-4 relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="text-yellow-400 text-xs font-mono tracking-wider mb-3">CYCLE STATUS</div>
                    
                    <div className="space-y-2">
                      {/* Timer */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs font-mono">Time Remaining:</span>
                        <motion.span 
                          className="text-yellow-300 font-mono text-sm"
                          animate={{
                            color: timeRemaining.hours < 24 ? ['#fde047', '#ef4444', '#fde047'] : '#fde047'
                          }}
                          transition={{ duration: 1, repeat: timeRemaining.hours < 24 ? Infinity : 0 }}
                        >
                          {String(timeRemaining.hours).padStart(3, '0')}:{String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
                        </motion.span>
                      </div>
                      
                      {/* Rang */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs font-mono">Current Rank:</span>
                        <span className="text-white font-mono text-sm">
                          #{currentRank.toLocaleString()} / {totalCandidates.toLocaleString()} Candidates
                        </span>
                      </div>
                      
                      
                      {/* Bouton Registry */}
                      <motion.button
                        onClick={handleViewRegistry}
                        className="w-full mt-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-cyan-400/60 px-3 py-2 rounded-sm text-cyan-400 font-mono text-xs transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        [ VIEW REGISTRY ]
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* ══════════ MODULE 3: SYSTEM RESOURCES ══════════ */}
                  <motion.div 
                    className="border border-slate-600/40 bg-black/50 rounded-sm p-4 relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="text-green-400 text-xs font-mono tracking-wider mb-3">SYSTEM RESOURCES</div>
                    
                    <div className="space-y-3">
                      {/* CRU */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs font-mono">Messages to send left:</span>
                        <motion.span 
                          className="text-green-300 font-mono text-sm font-bold"
                          animate={{
                            scale: localFragments !== fragments ? [1, 1.2, 1] : 1
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {localFragments}
                        </motion.span>
                      </div>
                      
                      <motion.button
                        className="w-full bg-green-800/60 hover:bg-green-700/60 border border-green-600/50 hover:border-green-400/60 px-3 py-2 rounded-sm text-green-300 font-mono text-xs transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          playButtonSound();
                          setSelectedCruPackage(3);
                          handleCruPurchase();
                        }}
                      >
                        [ SEND 3 MESSAGES FOR 1 WLD ]
                      </motion.button>
                      
                      {/* Human Verification Status */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <span className="text-slate-400 text-xs font-mono">Human Verification:</span>
                        <motion.span 
                          className={`font-mono text-sm font-bold ${isVerified ? 'text-cyan-300' : 'text-red-300'}`}
                          animate={{
                            textShadow: isVerified ? [
                              '0 0 5px rgba(34, 211, 238, 0.3)',
                              '0 0 10px rgba(34, 211, 238, 0.6)',
                              '0 0 5px rgba(34, 211, 238, 0.3)'
                            ] : undefined
                          }}
                          transition={{ duration: 2, repeat: isVerified ? Infinity : 0 }}
                        >
                          {isVerified ? '✓ VERIFIED' : '✗ UNVERIFIED'}
                        </motion.span>
                      </div>
                      
                      <motion.button
                        className={`w-full px-3 py-2 rounded-sm font-mono text-xs transition-all duration-200 ${
                          isVerified 
                            ? 'bg-cyan-800/60 hover:bg-cyan-700/60 border border-cyan-600/50 hover:border-cyan-400/60 text-cyan-300' 
                            : 'bg-blue-800/60 hover:bg-blue-700/60 border border-blue-600/50 hover:border-blue-400/60 text-blue-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleHumanityVerification}
                        disabled={isVerifying}
                      >
                        {isVerifying ? '[ VERIFYING... ]' : isVerified ? '[ CLAIM DAILY MESSAGE ]' : '[ VERIFY FOR 1 MESSAGE ]'}
                      </motion.button>
                      
                      {verificationMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-center text-xs font-mono p-2 rounded-sm border"
                          style={
                            verificationMessage.startsWith('✅')
                              ? { color: '#6ee7b7', borderColor: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                              : verificationMessage.startsWith('❌')
                              ? { color: '#f87171', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                              : { color: '#60a5fa', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                          }
                        >
                          {verificationMessage}
                        </motion.div>
                      )}
                      
                      {consoleMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-center text-xs font-mono p-2 rounded-sm border"
                          style={
                            consoleMessage.startsWith('✅')
                              ? { color: '#6ee7b7', borderColor: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                              : { color: '#f87171', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                          }
                        >
                          {consoleMessage}
                        </motion.div>
                      )}
                      
                      {/* Echo Shards - TEMPORAIREMENT COMMENTÉ */}
                      {/* <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        <span className="text-slate-400 text-xs font-mono">Echo Shards ($ECHO):</span>
                        <motion.span 
                          className="text-yellow-300 font-mono text-sm font-bold"
                          animate={{
                            textShadow: [
                              '0 0 5px rgba(253, 224, 71, 0.3)',
                              '0 0 10px rgba(253, 224, 71, 0.6)',
                              '0 0 5px rgba(253, 224, 71, 0.3)'
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ❖ {echoShards.toLocaleString()}
                        </motion.span>
                      </div>
                      
                      <motion.button
                        onClick={() => playButtonSound()}
                        className="w-full bg-yellow-800/60 hover:bg-yellow-700/60 border border-yellow-600/50 hover:border-yellow-400/60 px-3 py-2 rounded-sm text-yellow-300 font-mono text-xs transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        [ HARVEST SHARDS ]
                      </motion.button> */}
                    </div>
                  </motion.div>
                </div>

                {/* Ligne de scan inférieure */}
                <motion.div
                  className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                  animate={{
                    opacity: [0.1, 0.4, 0.1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton Dashboard minimaliste mais clair */}
        <motion.button
          onClick={() => {
            playSubTerminalSound();
            setIsSubTerminalExpanded(!isSubTerminalExpanded);
            if (onSubTerminalToggle) onSubTerminalToggle(!isSubTerminalExpanded);
          }}
          ref={consoleButtonRef}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-black/60 border border-cyan-400/40 backdrop-blur-sm rounded-sm hover:border-cyan-400/80 hover:bg-black/80 transition-all duration-200 flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          {/* Icône Dashboard */}
          <motion.div 
            className="flex items-center space-x-1"
            animate={{
              rotate: isSubTerminalExpanded ? 180 : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-2 h-2 bg-cyan-400 rounded-sm opacity-80"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-sm opacity-60"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-sm opacity-40"></div>
          </motion.div>
          
          {/* Texte court */}
          <span className="text-cyan-400 font-mono text-xs tracking-wide">
            {isSubTerminalExpanded ? 'CLOSE' : 'CONSOLE'}
          </span>
        </motion.button>

        {/* Zone d'affichage des conversations - Moniteur de l'Homéostasie Émotionnelle */}
        <motion.div 
          ref={chatWindowRef}
          className={`border border-white/20 p-4 relative overflow-hidden shadow-2xl glass-effect mb-3 ${
            isSubTerminalExpanded 
              ? 'bg-black/20 backdrop-blur-sm' 
              : 'bg-black/40 backdrop-blur-md'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: isSubTerminalExpanded ? 0.7 : 1,
            scale: 1,
            // Effet de respiration basé sur la stabilité émotionnelle
            boxShadow: [
              `0 0 ${20 + emotionalState.arousal * 20}px rgba(59, 130, 246, ${0.1 + emotionalState.arousal * 0.2}), inset 0 0 30px rgba(0, 0, 0, 0.5)`,
              `0 0 ${30 + emotionalState.arousal * 30}px rgba(59, 130, 246, ${0.2 + emotionalState.arousal * 0.3}), inset 0 0 30px rgba(0, 0, 0, 0.5)`,
              `0 0 ${20 + emotionalState.arousal * 20}px rgba(59, 130, 246, ${0.1 + emotionalState.arousal * 0.2}), inset 0 0 30px rgba(0, 0, 0, 0.5)`
            ]
          }}
          transition={{ 
            duration: 0.7, 
            ease: "easeOut",
            opacity: { duration: 0.4 },
            boxShadow: {
              duration: 2 + (emotionalState.stability * 2), // Respiration plus lente = plus stable
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          style={{
            height: '420px'
          }}
        >
          {/* Effet de lueur interne dynamique avec ascot en filigrane */}
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: [
                `linear-gradient(135deg, ${emotionalState.ascotColor}08 0%, transparent 30%, ${emotionalState.ascotColor}05 100%)`,
                `linear-gradient(135deg, ${emotionalState.ascotColor}12 0%, transparent 50%, ${emotionalState.ascotColor}08 100%)`,
                `linear-gradient(135deg, ${emotionalState.ascotColor}08 0%, transparent 30%, ${emotionalState.ascotColor}05 100%)`
              ]
            }}
            transition={{
              duration: 3 + (emotionalState.stability * 2),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          ></motion.div>
          
          {/* Texture d'ascot en filigrane */}
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, ${emotionalState.ascotColor}15 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, ${emotionalState.ascotColor}10 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px, 30px 30px'
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Effet de bord lumineux réactif */}
          <motion.div 
            className="absolute inset-0 border rounded-sm pointer-events-none"
            animate={{
              borderColor: [`${emotionalState.ascotColor}20`, `${emotionalState.ascotColor}40`, `${emotionalState.ascotColor}20`],
              background: [
                `linear-gradient(45deg, transparent 30%, ${emotionalState.ascotColor}10 50%, transparent 70%)`,
                `linear-gradient(45deg, transparent 20%, ${emotionalState.ascotColor}20 50%, transparent 80%)`,
                `linear-gradient(45deg, transparent 30%, ${emotionalState.ascotColor}10 50%, transparent 70%)`
              ]
            }}
            transition={{
              duration: 3 + (emotionalState.stability * 2),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Glitchs visuels pour messages sensibles */}
          {emotionalState.glitchIntensity > 0.5 && (
            <>
              <motion.div
                className="absolute inset-0 bg-red-500/10 pointer-events-none"
                animate={{
                  opacity: [0, emotionalState.glitchIntensity * 0.3, 0]
                }}
                transition={{
                  duration: 0.1,
                  repeat: Math.floor(emotionalState.glitchIntensity * 5),
                  repeatType: "mirror"
                }}
              />
              {/* Ligne de scan qui saute */}
              <motion.div
                className="absolute w-full h-0.5 bg-green-400/60 pointer-events-none"
                style={{
                  top: `${Math.random() * 100}%`
                }}
                animate={{
                  left: ['-100%', '100%']
                }}
                transition={{
                  duration: 0.2,
                  repeat: 3
                }}
              />
              {/* Pixels verts aléatoires */}
              {[...Array(Math.floor(emotionalState.glitchIntensity * 10))].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-green-400 pointer-events-none"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                  animate={{
                    opacity: [1, 0]
                  }}
                  transition={{
                    duration: 0.1,
                    delay: i * 0.05
                  }}
                />
              ))}
            </>
          )}

          {/* Zone messages avec animations */}
          <div className="h-full overflow-y-auto space-y-3 pr-2 relative z-10 custom-scrollbar">
            <AnimatePresence>
              {(() => {
                const DISPLAY_LIMIT = 25;
                const displayedMessages = messages.slice(-DISPLAY_LIMIT);
                return displayedMessages.map((msg, index) => (
                  <motion.div 
                    key={msg.id} 
                    className="whitespace-pre-wrap text-sm relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: "easeOut"
                    }}
                  >
                    {msg.role === 'user' ? (
                      <span className="text-blue-400 relative">
                        <span className="absolute -left-2 top-0 text-blue-500/60">
                          &gt;
                        </span>
                        <span className="ml-2">{msg.content}</span>
                      </span>
                    ) : (
                      <span 
                        className={`relative ${msg.content.startsWith('//') ? 'text-cyan-400/90 font-mono text-xs leading-relaxed' : 'text-white/80'}`}
                      >
                        {msg.content.startsWith('//') ? (
                          <div className={`${
                            (msg.content.includes('USDC') || msg.content.includes('WLD')) ? 'bg-yellow-900/20 border border-yellow-500/30' :
                            msg.content.includes('Your goal') ? 'bg-green-900/20 border border-green-500/30' :
                            'bg-slate-900/40 border border-cyan-500/20'
                          } p-3 rounded-sm relative`}>
                            <div className="space-y-1">
                              {msg.content.split('\n').map((line, idx) => (
                                <div key={idx} className={`${
                                  (line.includes('USDC') || line.includes('WLD')) ? 'text-yellow-400 font-bold text-lg' :
                                  line.includes('Prize Pool') ? 'text-yellow-300 font-semibold' :
                                  line.includes('Your goal') ? 'text-green-300 font-medium' :
                                  line.includes('Are you ready') ? 'text-cyan-300 font-medium' :
                                  'text-cyan-400/90'
                                }`}>
                                  {line}
                                </div>
                              ))}
                            </div>
                            {(msg.content.includes('USDC') || msg.content.includes('WLD')) && (
                              <div className="absolute -inset-0.5 bg-yellow-500/10 rounded-sm border border-yellow-500/20"></div>
                            )}
                          </div>
                        ) : (
                          <>
                            {msg.content}
                            <div className="absolute -inset-1 bg-white/5 rounded-sm opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </>
                        )}
                      </span>
                    )}
                  </motion.div>
                ));
              })()}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                className="text-white/50 text-xs flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span>[K.A.E.L.E.N processing data...]</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-400/60 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-blue-400/40 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-1 bg-blue-400/30 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
            
            {/* Boutons de choix */}
            {showChoiceButtons && (
              <motion.div
                className="mt-4 flex gap-3 flex-wrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.button
                  onClick={() => {
                    playButtonSound();
                    setUserChoice('candidate');
                    setShowChoiceButtons(false);
                    setShowInlinePurchaseModule(true);
                  }}
                  className="bg-green-600/60 hover:bg-green-500/60 border border-green-400/50 px-4 py-2 rounded font-mono text-sm text-green-300 hover:text-green-200 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  [ Become a Candidate ]
                </motion.button>
              </motion.div>
            )}
            
            {showInlinePurchaseModule && (
              <motion.div
                ref={purchaseModuleRef}
                className="mt-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="bg-slate-900/60 border border-cyan-400/20 rounded-sm p-3 backdrop-blur-sm">
                  <div className="text-cyan-400/80 font-mono text-xs space-y-2">
                    <div className="text-cyan-300 font-semibold text-center">// CANDIDATE PROTOCOL //</div>
                    <div className="text-slate-300 text-center">Each transmission: <span className="text-white font-bold">1 message</span></div>
                    
                    <div className="pt-1">
                      {renderSimplifiedCruPurchaseUI()}
                    </div>

                    <div className="text-center text-slate-500 font-mono text-xs pt-1 border-t border-slate-700/30">
                      // WORLDCOIN AUTH //
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODULE DE VENTE CRU - Interface d'Achat d'Énergie */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showCruPurchaseModule && (
            <motion.div
              className="absolute top-4 right-4 z-50"
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                className="bg-black/90 border border-cyan-400/60 backdrop-blur-md rounded-sm w-80 relative overflow-hidden"
                style={{
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.8)'
                }}
              >
                {/* Texture de fond cybernétique */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, 0.1) 25%, rgba(6, 182, 212, 0.1) 26%, transparent 27%),
                      linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, 0.1) 25%, rgba(6, 182, 212, 0.1) 26%, transparent 27%)
                    `,
                    backgroundSize: '40px 40px'
                  }}></div>
                </div>

                {/* Lignes de scan animées */}
                <motion.div
                  className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                  animate={{
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                  animate={{
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                />

                <div className="p-4 space-y-4 relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <motion.div 
                      className="text-cyan-400 font-mono text-sm tracking-wider"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      [ SEND 3 MESSAGES FOR 1 WLD ]
                    </motion.div>
                    <motion.button
                      onClick={() => {
                        playButtonSound();
                        setShowCruPurchaseModule(false);
                        setSelectedCruPackage(null);
                      }}
                      className="text-slate-400 hover:text-red-400 font-mono text-sm transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      [ X ]
                    </motion.button>
                  </div>

                  {/* Subtitle */}
                  <motion.div 
                    className="text-slate-400 font-mono text-xs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    // SELECT PACKAGE //
                  </motion.div>

                  {/* Packages Grid */}
                  {renderModalCruPurchaseUI()}
                  
                  {/* Footer */}
                  <motion.div 
                    className="text-center text-slate-500 font-mono text-xs pt-2 border-t border-slate-700/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    // SECURE WORLDCOIN AUTHENTICATION REQUIRED //
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone de saisie séparée - Terminal */}
        <motion.div 
          ref={inputRef}
          className="border border-white/20 bg-black/50 backdrop-blur-md p-3 relative overflow-hidden shadow-2xl glass-effect"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          style={{
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.15), inset 0 0 20px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Effet de lueur interne pour terminal */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/3 via-transparent to-blue-500/3 pointer-events-none"></div>
          
          {/* Ligne de saisie améliorée */}
          <div className="flex items-center space-x-3">
            {/* Test Audio Button (debug) - HIDDEN */}
            {/*DEBUG_LOGS && (
              <button
                onClick={testAudio}
                className="px-3 py-2 bg-red-600/60 hover:bg-red-500/60 text-white text-xs rounded border border-red-500/60 transition-colors"
                type="button"
              >
                🔊 Test Audio
              </button>
            )*/}
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isFirstMessage ? "> initiate_contact.protocol // Submit initial data packet..." : "Transmit your data to K.A.E.L.E.N..."}
              className="flex-1 bg-slate-800/60 border border-green-500/40 rounded px-3 py-2 text-green-400 placeholder-green-600 focus:outline-none focus:border-green-400 font-mono text-sm backdrop-blur-sm"
              disabled={isLoading || !isInitialized}
              style={{
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
              }}
            />
            <button
              onClick={() => {
                playSendSound();
                onSend();
              }}
              disabled={isLoading || !input.trim() || !isInitialized}
              className="px-4 py-2 bg-green-600/60 hover:bg-green-500/60 disabled:bg-gray-600/60 text-white rounded border border-green-500/60 transition-colors font-mono text-sm"
              type="button"
            >
              {isLoading ? '...' : 'SEND'}
            </button>
          </div>
        </motion.div>


        {/* Légende bas avec effet mystique - Se cache quand le Sub-Terminal est ouvert */}
        <AnimatePresence>
          {!isSubTerminalExpanded && (
            <motion.div 
              className="text-white/15 text-xs mt-1 text-center relative pb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: [0.15, 0.3, 0.15],
                y: 0
              }}
              exit={{ 
                opacity: 0, 
                y: 10,
                transition: { duration: 0.3 }
              }}
              transition={{
                opacity: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                y: {
                  duration: 0.5,
                  ease: "easeOut"
                }
              }}
            >
              <span className="relative">
                The suspended note will cease only when your story begins...
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent rounded-sm blur-sm"></div>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Registry Overlay */}
      <AnimatePresence>
        {isRegistryOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900/90 border border-cyan-400/40 rounded-sm p-6 w-11/12 max-w-xl max-h-[80vh] overflow-y-auto"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="text-cyan-400 font-mono text-sm">CANDIDATE REGISTRY</div>
                <button onClick={() => setIsRegistryOpen(false)} className="text-slate-400 hover:text-red-400 font-mono text-xs">[ CLOSE ]</button>
              </div>

              {isLoadingRegistry ? (
                <div className="text-center text-slate-400">Loading...</div>
              ) : (
                <div className="space-y-1">
                  {leaderboard.map((u, idx) => (
                    <div key={u.userId} className={`flex justify-between text-xs font-mono ${u.userId===user?.userId ? 'text-yellow-300' : 'text-slate-300'}`}> 
                      <span>#{idx+1}</span>
                      <span>{u.worldUsername || (u.walletAddress ? u.walletAddress.slice(0,6)+'…'+u.walletAddress.slice(-4) : u.userId)}</span>
                      <span>{u.currentScore?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            className="fixed inset-0 z-[150]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* The "cutout" effect using a massive box-shadow */}
            <motion.div
              className="absolute rounded-md"
              style={{
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)',
              }}
              initial={false}
              animate={{
                top: highlightBox.top,
                left: highlightBox.left,
                width: highlightBox.width,
                height: highlightBox.height,
              }}
              transition={{
                duration: 0.7,
                ease: 'easeInOut',
              }}
            />
            
            {/* The glowing border around the cutout */}
            <motion.div
              className="absolute rounded-md border-2 border-cyan-400 pointer-events-none"
              style={{
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.5), inset 0 0 10px rgba(6, 182, 212, 0.3)',
              }}
               initial={false}
               animate={{
                top: highlightBox.top,
                left: highlightBox.left,
                width: highlightBox.width,
                height: highlightBox.height,
              }}
              transition={{
                duration: 0.7,
                ease: 'easeInOut',
              }}
            />

            {/* The text box with instructions */}
            <motion.div
              className="absolute"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
              style={textBoxStyle}
            >
              <div className="bg-slate-900/90 border border-cyan-400/60 backdrop-blur-md rounded-sm p-4 text-slate-300 font-mono text-sm leading-relaxed"
                   style={{ boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                <p className="whitespace-pre-wrap">{tutorialSteps[tutorialStep].text}</p>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={endTutorial} className="text-slate-500 hover:text-red-400 text-xs font-mono transition-colors">
                    [ SKIP ]
                  </button>
                  <button onClick={handleNextTutorialStep} className="text-cyan-400 hover:text-white text-xs font-mono transition-colors">
                    {tutorialStep === tutorialSteps.length - 1 ? '[ BEGIN ]' : '[ NEXT ]'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prize Distribution Modal */}
      <PrizeDistributionModal 
        isOpen={showPrizeDistributionModal}
        onClose={() => setShowPrizeDistributionModal(false)}
      />
    </div>
  );
}