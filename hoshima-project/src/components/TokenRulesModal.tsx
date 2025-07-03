import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Gift, Clock, Gamepad2, Calendar, Users } from 'lucide-react';

interface TokenRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TokenRulesModal = ({ isOpen, onClose }: TokenRulesModalProps) => {
  const { t } = useLanguage();

  const ruleCategories = [
    {
      icon: Clock,
      title: t('chat.dailyReward'),
      description: t('chat.dailyRewardDesc'),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-400/30'
    },
    {
      icon: Gamepad2,
      title: t('chat.gameplayRewards'),
      description: t('chat.gameplayRewardsDesc'),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-400/30'
    },
    {
      icon: Calendar,
      title: t('chat.specialEvents'),
      description: t('chat.specialEventsDesc'),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-400/30'
    },
    {
      icon: Users,
      title: t('chat.socialRewards'),
      description: t('chat.socialRewardsDesc'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-400/30'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-black/95 border border-gray-600 p-4 max-w-lg w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-sm text-white">
                  {t('chat.tokenRules')}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {ruleCategories.map((category, index) => (
                  <div key={index} className="border-l-2 border-gray-600 pl-3">
                    <h3 className="font-mono text-xs text-gray-300 mb-1">
                      {category.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      {category.description}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="mt-4 w-full font-mono text-xs text-gray-400 hover:text-white transition-colors py-1"
              >
                {t('chat.close')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TokenRulesModal;