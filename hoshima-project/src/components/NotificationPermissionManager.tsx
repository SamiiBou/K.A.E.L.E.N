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
    <>
      {/* Boutons de test temporaires - À RETIRER PLUS TARD */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-1">
        <button
          onClick={() => setShowPermissionModal(true)}
          className="bg-blue-500/80 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs transition-colors"
        >
          🔔
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('hoshima_notification_permission');
            localStorage.removeItem('hoshima_notification_requested');
            localStorage.removeItem('hoshima_notification_timestamp');
            window.location.reload();
          }}
          className="bg-gray-500/80 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs transition-colors"
        >
          ↺
        </button>
      </div>

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
            className="bg-black/95 border border-cyan-500/40 rounded-lg p-4 mx-4 max-w-sm w-full shadow-2xl shadow-cyan-500/10 backdrop-blur-md"
          >
            {/* Header minimaliste */}
            <div className="flex items-center justify-center mb-3">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse mr-2"></div>
              <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-wider">
                {t('notifications.permissionTitle', 'NOTIFICATIONS')}
              </h3>
            </div>

            {/* Description courte */}
            <p className="text-gray-400 text-center mb-4 text-sm font-mono leading-relaxed">
              {t('notifications.permissionDescription', 
                'Enable notifications for updates and rewards'
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

            {/* Boutons d'action minimalistes */}
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                disabled={isRequesting}
                className="flex-1 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 disabled:opacity-50 text-gray-400 font-mono text-xs py-2 px-3 rounded transition-all duration-200 uppercase tracking-wider"
              >
                {t('notifications.notNow', 'SKIP')}
              </button>
              
              <button
                onClick={handleAllowNotifications}
                disabled={isRequesting || status === 'denied'}
                className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 hover:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 font-mono text-xs py-2 px-3 rounded transition-all duration-200 uppercase tracking-wider"
              >
                {isRequesting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 border border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mr-1"></div>
                    {t('notifications.requesting', 'PROCESSING')}
                  </div>
                ) : status === 'denied' ? (
                  t('notifications.openSettings', 'SETTINGS')
                ) : (
                  t('notifications.allowNotifications', 'ALLOW')
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
} 