'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationPermissionManagerProps {
  // Callback appelé quand l'utilisateur a traité la demande (accordé ou refusé)
  onPermissionHandled?: (granted: boolean) => void;
  // Si true, affiche immédiatement la demande, sinon attend la logique interne
  forceShow?: boolean;
  // Délai avant d'afficher la demande (en ms)
  delay?: number;
}

export default function NotificationPermissionManager({ 
  onPermissionHandled, 
  forceShow = false,
  delay = 2000 
}: NotificationPermissionManagerProps) {
  const { t } = useLanguage();
  const {
    status,
    isRequesting,
    shouldRequestPermission,
    requestNotificationPermission,
    isWorldAppInstalled,
    error
  } = useNotificationPermission();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // Effet pour afficher la modal après un délai si les conditions sont remplies
  useEffect(() => {
    if (forceShow) {
      setShowPermissionModal(true);
      setHasShownModal(true);
      return;
    }

    // Ne demander qu'une fois par session
    if (hasShownModal) return;

    // Vérifier si on doit demander les permissions
    if (isWorldAppInstalled && shouldRequestPermission() && status !== 'unknown') {
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
        setHasShownModal(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [forceShow, hasShownModal, isWorldAppInstalled, shouldRequestPermission, status, delay]);

  const handleAllowNotifications = async () => {
    const result = await requestNotificationPermission();
    
    if (result.success) {
      setShowPermissionModal(false);
      onPermissionHandled?.(true);
    }
    // Si échec, on laisse la modal ouverte avec le message d'erreur
  };

  const handleDismiss = () => {
    setShowPermissionModal(false);
    onPermissionHandled?.(false);
  };

  const handleOpenSettings = () => {
    // Rediriger vers les paramètres de World App
    const settingsUrl = 'worldcoin.org/settings/miniapps';
    if (typeof window !== 'undefined') {
      window.open(`https://${settingsUrl}`, '_blank');
    }
  };

  // Ne rien afficher si World App n'est pas installé
  if (!isWorldAppInstalled) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPermissionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl shadow-cyan-500/20"
          >
            {/* Icône de notification */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>

            {/* Titre */}
            <h3 className="text-xl font-bold text-center text-white mb-2">
              {t('notifications.permissionTitle', 'Stay Updated with Hoshima')}
            </h3>

            {/* Description */}
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {t('notifications.permissionDescription', 
                'Get notified about important updates, game events, and exclusive rewards. We respect your privacy and only send relevant notifications.'
              )}
            </p>

            {/* Message d'erreur si présent */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm text-center">
                  {error}
                </p>
                {status === 'denied' && (
                  <button
                    onClick={handleOpenSettings}
                    className="mt-2 w-full text-cyan-400 hover:text-cyan-300 text-sm underline transition-colors"
                  >
                    {t('notifications.openSettings', 'Open World App Settings')}
                  </button>
                )}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAllowNotifications}
                disabled={isRequesting || status === 'denied'}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
              >
                {isRequesting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    {t('notifications.requesting', 'Requesting...')}
                  </div>
                ) : status === 'denied' ? (
                  t('notifications.openSettings', 'Open Settings')
                ) : (
                  t('notifications.allowNotifications', 'Allow Notifications')
                )}
              </button>

              <button
                onClick={handleDismiss}
                disabled={isRequesting}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                {t('notifications.notNow', 'Not Now')}
              </button>
            </div>

            {/* Note en bas */}
            <p className="text-xs text-gray-500 text-center mt-4">
              {t('notifications.privacyNote', 
                'You can change this setting anytime in World App settings'
              )}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 