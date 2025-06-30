'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' }
];

export default function LanguageSelectorClient() {
  const { locale, changeLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const currentLang = languages.find(lang => lang.code === locale) || languages[0];

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

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === locale) {
      setIsOpen(false);
      return;
    }

    playSound(800, 0.2);
    setIsChanging(true);
    
    // Animation de transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Changement de langue
    changeLanguage(langCode);
  };

  return (
    <div className="fixed top-6 left-6 z-50">
      <motion.button
        onClick={() => {
          playSound(600, 0.1);
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md border border-cyan-500/30 
                   text-cyan-400 rounded-sm hover:bg-black/80 hover:border-cyan-400/50 
                   transition-all duration-300 font-mono text-sm"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="tracking-wider">{currentLang.code.toUpperCase()}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 min-w-[200px] bg-black/90 backdrop-blur-lg 
                       border border-cyan-500/30 rounded-sm overflow-hidden"
          >
            {languages.map((lang, index) => (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isChanging}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200
                           ${lang.code === locale 
                             ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' 
                             : 'text-gray-400 hover:bg-white/5 hover:text-cyan-400'
                           } ${isChanging ? 'opacity-50' : ''}`}
                onMouseEnter={() => playSound(400 + index * 100, 0.05)}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="font-mono text-sm tracking-wide">{lang.name}</div>
                  <div className="text-xs opacity-60 font-mono">{lang.code.toUpperCase()}</div>
                </div>
                {lang.code === locale && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effet de transition globale */}
      <AnimatePresence>
        {isChanging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center"
          >
            <div className="text-cyan-400 font-mono text-xl tracking-wider animate-pulse">
              RECALIBRATING LINGUISTIC MATRIX...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 