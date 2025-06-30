'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', greeting: 'Welcome', terminal: 'ENG' },
  { code: 'es', name: 'Español', flag: '🇪🇸', greeting: 'Bienvenido', terminal: 'ESP' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', greeting: 'Selamat datang', terminal: 'IDN' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', greeting: 'ยินดีต้อนรับ', terminal: 'THA' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', greeting: 'Bienvenue', terminal: 'FRA' }
];

interface LanguageSelectionScreenProps {
  onLanguageSelected: (langCode: string) => void;
}

export default function LanguageSelectionScreen({ onLanguageSelected }: LanguageSelectionScreenProps) {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const { changeLanguage } = useLanguage();

  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 100);

    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => {
      clearInterval(scanInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  const playSound = (frequency: number, duration: number = 0.1) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.type = 'square';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio not available');
    }
  };

  const handleLanguageSelect = async (langCode: string) => {
    if (isTransitioning) return;
    
    playSound(800, 0.3);
    setSelectedLang(langCode);
    setIsTransitioning(true);
    
    // Changer la langue via le contexte (cela met automatiquement à jour localStorage)
    changeLanguage(langCode);
    localStorage.setItem('language-selected', 'true');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    onLanguageSelected(langCode);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden font-mono"
    >
      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-full h-px bg-cyan-400/20 transition-all duration-100"
          style={{ top: `${scanLine}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent opacity-20" />
      </div>

      {/* Matrix-style background */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-cyan-400 text-xs font-mono select-none"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: -20,
              opacity: 0
            }}
            animate={{ 
              y: window.innerHeight + 20,
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 10
            }}
          >
            {Math.random().toString(36).substring(2, 8).toUpperCase()}
          </motion.div>
        ))}
      </div>

      {/* Main terminal interface */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-8">
        {/* Terminal header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="bg-black/80 border border-cyan-500/50 rounded-t-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-cyan-400 text-sm font-mono">KAELEN_SYSTEM_v2.1.0</span>
              </div>
              <div className="text-cyan-400/60 text-xs">
                [{new Date().toISOString().slice(0, 19)}]
              </div>
            </div>
          </div>
        </motion.div>

        {/* Terminal body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className={`bg-black/90 border-x border-b border-cyan-500/50 rounded-b-lg p-8 backdrop-blur-sm relative overflow-hidden ${
            glitchActive ? 'animate-pulse' : ''
          }`}
        >
          {/* Terminal prompt */}
          <div className="mb-6">
            <div className="text-cyan-400 text-sm mb-2">
              <span className="text-cyan-500/60">root@kaelen:~$ </span>
              <span className="animate-pulse">init_language_selection</span>
            </div>
            <div className="text-white/80 text-sm mb-4">
              // SYSTEM INITIALIZATION REQUIRES LANGUAGE CONFIGURATION
              <br />
              // SELECT PRIMARY INTERFACE LANGUAGE
            </div>
          </div>

          {/* Language grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {languages.map((lang, index) => (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={isTransitioning}
                onMouseEnter={() => playSound(400 + index * 50, 0.1)}
                className={`
                  relative group p-4 bg-black/60 border transition-all duration-300
                  ${selectedLang === lang.code 
                    ? 'border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-400/20' 
                    : 'border-gray-700/50 hover:border-cyan-400/70 hover:bg-cyan-400/10'
                  }
                  ${isTransitioning && selectedLang !== lang.code ? 'opacity-30' : ''}
                `}
              >
                {/* Selection indicator */}
                {selectedLang === lang.code && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 animate-pulse" />
                )}

                <div className="text-center">
                  <div className="text-2xl mb-2">{lang.flag}</div>
                  <div className="text-cyan-400 text-xs font-mono mb-1">[{lang.terminal}]</div>
                  <div className="text-white/90 text-sm font-mono">{lang.name}</div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors duration-300" />
              </motion.button>
            ))}
          </div>

          {/* System messages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="space-y-1 text-xs text-gray-500/80"
          >
            <div>// AVAILABLE LANGUAGES: {languages.length} DETECTED</div>
            <div>// NEURAL INTERFACE: READY</div>
            <div>// WAITING FOR USER INPUT...</div>
          </motion.div>

          {/* Terminal cursor */}
          <motion.div
            className="mt-4 flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <span className="text-cyan-500/60 text-sm">root@kaelen:~$ </span>
            <motion.div
              className="w-2 h-4 bg-cyan-400 ml-1"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black z-[300] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center font-mono"
            >
              <div className="text-cyan-400 text-xl tracking-wider mb-4">
                CONFIGURING LANGUAGE INTERFACE...
              </div>
              <div className="text-white/60 text-sm mb-6">
                SELECTED: {selectedLang?.toUpperCase()}
              </div>
              <div className="flex justify-center space-x-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-4 bg-cyan-400"
                    animate={{ 
                      scaleY: [1, 2, 1],
                      opacity: [0.3, 1, 0.3] 
                    }}
                    transition={{ 
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1 
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 