import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StockBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const StockBanner: React.FC<StockBannerProps> = ({ isVisible, onDismiss }) => {
  const { t } = useLanguage();
  const [isHovering, setIsHovering] = useState(false);

  const handleStockAppClick = () => {
    const umanAppUrl = "worldapp://mini-app?app_id=app_519146d170ce4e9eff6a6fa241878715";
    window.open(umanAppUrl, '_blank');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ 
          duration: 0.6,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        className="relative mb-4 mx-4"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Effet de lueur d'arrière-plan */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-xl blur-lg opacity-60 animate-pulse" />
        
        {/* Conteneur principal */}
        <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border border-emerald-400/30 rounded-xl p-4 backdrop-blur-lg shadow-2xl">
          {/* Lignes de scan futuristes */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <motion.div
              className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 2
              }}
            />
          </div>

          {/* Bouton de fermeture */}
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 w-6 h-6 bg-slate-700/60 hover:bg-slate-600/80 border border-slate-500/30 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 backdrop-blur-sm"
          >
            <X size={12} />
          </button>

          <div className="flex items-center space-x-4">
            {/* Icône animée */}
            <motion.div
              className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg"
              animate={isHovering ? { 
                scale: 1.05, 
                rotate: [0, 5, -5, 0],
                boxShadow: ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 15px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0)']
              } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TrendingUp size={20} className="text-white" />
              <motion.div
                className="absolute"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={16} className="text-white/40" />
              </motion.div>
            </motion.div>

            <div className="flex-1 min-w-0">
              {/* Titre avec effet de glow */}
              <motion.h3 
                className="font-mono text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 mb-1"
                animate={isHovering ? { 
                  textShadow: ['0 0 0px rgba(16, 185, 129, 0.8)', '0 0 8px rgba(16, 185, 129, 0.8)', '0 0 0px rgba(16, 185, 129, 0.8)']
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {t('stockBanner.title')}
              </motion.h3>

              {/* Sous-titre */}
              <p className="text-slate-300 text-xs leading-relaxed">
                {t('stockBanner.subtitle')}
              </p>
            </div>

            {/* Bouton CTA */}
            <motion.button
              onClick={handleStockAppClick}
              className="relative px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all duration-200 font-mono"
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Effet de lueur interne */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200" />
              
              {/* Texte du bouton */}
              <span className="relative z-10">
                {t('stockBanner.cta')}
              </span>

              {/* Indicateur de pulsation */}
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.button>
          </div>

          {/* Ligne de progression en bas */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          
          {/* Particules flottantes */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/60 rounded-full"
              style={{
                left: `${20 + i * 30}%`,
                top: `${20 + i * 15}%`
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StockBanner;