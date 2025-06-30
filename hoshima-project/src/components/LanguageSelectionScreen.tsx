'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', greeting: 'Welcome' },
  { code: 'es', name: 'Español', flag: '🇪🇸', greeting: 'Bienvenido' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', greeting: 'Selamat datang' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', greeting: 'ยินดีต้อนรับ' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', greeting: 'Bienvenue' }
];

interface LanguageSelectionScreenProps {
  onLanguageSelected: (langCode: string) => void;
}

export default function LanguageSelectionScreen({ onLanguageSelected }: LanguageSelectionScreenProps) {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const playSound = (frequency: number, duration: number = 0.1) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.type = 'sine';
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
    
    // Sauvegarder la sélection
    localStorage.setItem('preferred-language', langCode);
    localStorage.setItem('language-selected', 'true');
    
    // Animation de sortie
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onLanguageSelected(langCode);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden"
    >
      {/* Effet de particules en arrière-plan */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{ 
              opacity: [0, 0.5, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-8">
        {/* Titre principal */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-thin text-white tracking-[0.3em] mb-4">
            K.A.E.L.E.N
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-full max-w-md mx-auto" />
        </motion.div>

        {/* Message de sélection */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-gray-400 text-lg mb-12 font-mono"
        >
          SELECT YOUR LANGUAGE / SELECCIONA TU IDIOMA
          <br />
          PILIH BAHASA ANDA / เลือกภาษาของคุณ
        </motion.p>

        {/* Grille de langues */}
        <motion.div 
          className="grid grid-cols-2 gap-6 max-w-2xl mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {languages.map((lang, index) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
              onClick={() => handleLanguageSelect(lang.code)}
              disabled={isTransitioning}
              onMouseEnter={() => playSound(400 + index * 100, 0.05)}
              className={`
                relative group p-8 bg-black/50 border rounded-lg transition-all duration-300
                ${selectedLang === lang.code 
                  ? 'border-cyan-400 bg-cyan-400/10 scale-105' 
                  : 'border-gray-700 hover:border-cyan-400/50 hover:bg-white/5'
                }
                ${isTransitioning && selectedLang !== lang.code ? 'opacity-30' : ''}
              `}
            >
              {/* Effet de glow au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              
              <div className="relative z-10">
                <div className="text-6xl mb-4">{lang.flag}</div>
                <h3 className="text-xl font-mono text-white mb-2">{lang.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{lang.code.toUpperCase()}</p>
                
                {/* Message de bienvenue au survol */}
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 left-0 right-0 text-cyan-400 text-sm font-mono"
                >
                  {lang.greeting}
                </motion.p>
              </div>

              {/* Indicateur de sélection */}
              {selectedLang === lang.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Instructions supplémentaires */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="text-gray-600 text-xs font-mono mt-16"
        >
          Language can be changed later in settings
        </motion.p>
      </div>

      {/* Overlay de transition */}
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
              className="text-center"
            >
              <div className="text-cyan-400 font-mono text-2xl tracking-wider mb-4">
                INITIALIZING
              </div>
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-cyan-400 rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5] 
                    }}
                    transition={{ 
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2 
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