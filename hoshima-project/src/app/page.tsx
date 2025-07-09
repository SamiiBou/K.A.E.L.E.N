'use client';

import { useState, useEffect } from 'react';
// import ChatInterface from "@/components/ui/chat-interface";
import WelcomePage from "@/components/WelcomePage";
import GameIntro from "@/components/GameIntro";
import useWorldWalletAuth from "@/hooks/useWorldWalletAuth";
import TerminalChat from "@/components/TerminalChat";
import LanguageSelectionScreen from "@/components/LanguageSelectionScreen";
import LanguageSelectorClient from "@/components/LanguageSelectorClient";
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageDebug from "@/components/LanguageDebug";
import NotificationPermissionManager from "@/components/NotificationPermissionManager";
import "@/utils/notificationDebugger"; // Pour exposer NotificationDebugger globalement

export default function Home() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading, login, user } = useWorldWalletAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [fragments, setFragments] = useState(0);
  const [languageSelected, setLanguageSelected] = useState<boolean | null>(null);

  // Vérifier si une langue a été sélectionnée
  useEffect(() => {
    const hasSelectedLanguage = localStorage.getItem('language-selected') === 'true';
    setLanguageSelected(hasSelectedLanguage);
  }, []);

  // Debug des états d'authentification
  useEffect(() => {
    console.log('🏠 [Page] État d\'authentification:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      userWallet: user?.walletAddress,
      username: user?.worldUsername,
      showWelcome,
      showIntro,
      languageSelected
    });
  }, [isAuthenticated, isLoading, user, showWelcome, showIntro, languageSelected]);

  // Fermer automatiquement la WelcomePage après authentification (TEMPORAIRE pour debug)
  useEffect(() => {
    if (isAuthenticated && user && showWelcome) {
      console.log('🔄 [Page] Utilisateur authentifié - fermeture automatique de WelcomePage dans 3 secondes');
      const timer = setTimeout(() => {
        console.log('🚀 [Page] Fermeture forcée de WelcomePage');
        setShowWelcome(false);
      }, 3000); // 3 secondes pour voir la modal de notification

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, showWelcome]);

  const handleAuthSuccess = (user: any, token: string) => {
    console.log('🎉 [Page] Authentification réussie:', {
      userId: user.userId,
      walletAddress: user.walletAddress,
      worldUsername: user.worldUsername
    });
    
    login(user, token);
    setAuthError(null);
    console.log('🔄 [Page] setShowWelcome(true) appelé après authentification');
    setShowWelcome(true);
  };

  const handleAuthError = (error: string) => {
    console.error('❌ [Page] Erreur d\'authentification:', error);
    setAuthError(error);
  };

  const handleWelcomeComplete = () => {
    console.log('✅ [Page] handleWelcomeComplete appelé - fermeture de WelcomePage');
    setShowWelcome(false);
  };

  const handleIntroComplete = () => {
    console.log('✅ [Page] Intro terminée, passage à l\'authentification');
    setShowIntro(false);
    setShowWelcome(true);
  };

  const handleLanguageSelected = (langCode: string) => {
    console.log('🌍 [Page] Langue sélectionnée:', langCode);
    // Mettre à jour l'état pour cacher l'écran de sélection
    setLanguageSelected(true);
  };

  // Si on charge encore les données d'authentification ou de langue
  if (isLoading || languageSelected === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">
          {t('auth.loadingApp')}
        </div>
      </div>
    );
  }

  // 0. TOUJOURS afficher la sélection de langue en premier si elle n'a pas été faite
  if (!languageSelected) {
    console.log('🌍 [Page] Affichage de LanguageSelectionScreen');
    return <LanguageSelectionScreen onLanguageSelected={handleLanguageSelected} />;
  }

  // 1. Toujours afficher l'intro d'abord
  if (showIntro) {
    console.log('🎬 [Page] Affichage de GameIntro');
    return <GameIntro onComplete={handleIntroComplete} />;
  }

  // 2. Ensuite la page de bienvenue / authentification
  if (showWelcome || !isAuthenticated) {
    console.log('👋 [Page] Affichage de WelcomePage (showWelcome:', showWelcome, ', isAuthenticated:', isAuthenticated, ')');
    return (
      <div>
        <WelcomePage 
          onComplete={handleWelcomeComplete}
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />
        
        {/* Gestionnaire de notifications TEMPORAIRE sur WelcomePage pour debug */}
        {isAuthenticated && user && (
          <NotificationPermissionManager
            forceShow={true}  // TEMPORAIRE - pour debug
            delay={500}
            onPermissionHandled={(granted) => {
              console.log('🔔 [Page] Permission de notification:', granted ? 'accordée' : 'refusée');
            }}
          />
        )}
      </div>
    );
  }

  // 3. Enfin, une fois authentifié et après la page de bienvenue, afficher le terminal
  if (isAuthenticated && user) {
    console.log('🎯 [Page] Affichage de TerminalChat (isAuthenticated:', isAuthenticated, ', user:', !!user, ', showWelcome:', showWelcome, ')');
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <img
          src="/kaelen_sit.png"
          alt="Kaelen background"
          className="fixed top-0 left-0 w-screen h-screen object-cover object-center brightness-90 blur-[2px] -z-10"
        />
        <LanguageSelectorClient />
        <LanguageDebug />
        
        {/* Gestionnaire des permissions de notifications - affichage forcé pour debug */}
        <NotificationPermissionManager
          forceShow={true}  // TEMPORAIRE - pour debug
          delay={500}
          onPermissionHandled={(granted) => {
            console.log('🔔 [Page] Permission de notification:', granted ? 'accordée' : 'refusée');
          }}
        />
        
        <TerminalChat 
          fragments={fragments} 
          onFragmentsUpdate={setFragments}
          onPurchaseRequest={() => {}}
          onSubTerminalToggle={() => {}}
          userAddr={user.walletAddress}
        />
      </div>
    );
  }

  // Fallback - normalement on ne devrait jamais arriver ici
  console.warn('⚠️ [Page] État inattendu, retour à l\'intro (isAuthenticated:', isAuthenticated, ', user:', !!user, ', showWelcome:', showWelcome, ', showIntro:', showIntro, ')');
  return <GameIntro onComplete={handleIntroComplete} />;
}
