'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { useLanguage } from '@/contexts/LanguageContext';

interface PrizeDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrizeDistributionModal({ isOpen, onClose }: PrizeDistributionModalProps) {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl bg-black/95 border border-green-500/60 rounded-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header avec effet de scan */}
          <div className="relative border-b border-green-500/30 p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 5px rgba(34, 197, 94, 0.5)',
                      '0 0 15px rgba(34, 197, 94, 0.8)',
                      '0 0 5px rgba(34, 197, 94, 0.5)'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <h2 className="text-green-400 text-sm font-mono font-bold tracking-wider">
                  {t('prizeRules.title')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-green-400/60 hover:text-green-400 transition-colors p-1"
              >
                <IoClose size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 font-mono text-sm space-y-4 max-h-[80vh] overflow-y-auto">
            {/* System Description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="text-green-300 text-xs tracking-wider">{t('prizeRules.description')}</div>
              
              {/* Payment Distribution Section */}
              <div className="bg-gray-900/30 border border-yellow-500/30 rounded p-2 space-y-1">
                <div className="text-yellow-400 font-semibold text-xs tracking-wider">{t('prizeRules.paymentDistribution')}</div>
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="text-green-300 font-semibold">{t('prizeRules.prizePoolPercent')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-300 font-semibold">{t('prizeRules.maintenancePercent')}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Rules */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <div className="border-l-2 border-green-500/40 pl-4 space-y-2">
                <div className="text-green-400 font-semibold">{t('prizeRules.podiumTitle')}</div>
                <div className="text-gray-300">{t('prizeRules.podiumDescription')}</div>
              </div>
              
              <div className="border-l-2 border-blue-500/40 pl-4 space-y-2">
                <div className="text-blue-400 font-semibold">{t('prizeRules.tiersTitle')}</div>
                <div className="text-gray-300">{t('prizeRules.tiersDescription')}</div>
              </div>
            </motion.div>

            {/* Example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gray-900/50 border border-gray-700/50 rounded p-3 space-y-2"
            >
              <div className="text-yellow-400 font-semibold tracking-wider">{t('prizeRules.exampleTitle')}</div>
              
              <div className="overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-600/50">
                      <th className="text-left py-2 text-gray-400">{t('prizeRules.rankColumn')}</th>
                      <th className="text-right py-2 text-gray-400">{t('prizeRules.prizeColumn')}</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="border-b border-gray-800/50"
                    >
                      <td className="py-1 text-green-400 font-semibold">1st</td>
                      <td className="py-1 text-right text-green-300">$350.00</td>
                    </motion.tr>
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                      className="border-b border-gray-800/50"
                    >
                      <td className="py-1 text-green-400 font-semibold">2nd</td>
                      <td className="py-1 text-right text-green-300">$210.00</td>
                    </motion.tr>
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                      className="border-b border-gray-800/50"
                    >
                      <td className="py-1 text-green-400 font-semibold">3rd</td>
                      <td className="py-1 text-right text-green-300">$140.00</td>
                    </motion.tr>
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 }}
                      className="border-b border-gray-800/50"
                    >
                      <td className="py-1 text-blue-400">4th - 10th</td>
                      <td className="py-1 text-right text-blue-300">$100.00</td>
                    </motion.tr>
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.3 }}
                      className="border-b border-gray-800/50"
                    >
                      <td className="py-1 text-blue-400">11th - 100th</td>
                      <td className="py-1 text-right text-blue-300">$10.89</td>
                    </motion.tr>
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 }}
                      className="border-b border-gray-800/50"
                    >
                      <td className="py-1 text-blue-400">101st - 250th</td>
                      <td className="py-1 text-right text-blue-300">$4.67</td>
                    </motion.tr>
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.5 }}
                    >
                      <td className="py-1 text-blue-400">251st - 500th</td>
                      <td className="py-1 text-right text-blue-300">$1.68</td>
                    </motion.tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Bottom hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 }}
              className="text-center text-gray-500 text-xs"
            >
              {t('prizeRules.closeHint')}
            </motion.div>
          </div>

          {/* Scan line effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.02) 2px, rgba(34, 197, 94, 0.02) 4px)'
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}