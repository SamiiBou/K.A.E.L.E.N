'use client';

import { useState, useEffect } from 'react';
// import ChatInterface from "@/components/ui/chat-interface";
import WelcomePage from "@/components/WelcomePage";
import GameIntro from "@/components/GameIntro";
import useWorldWalletAuth from "@/hooks/useWorldWalletAuth";
import TerminalChat from "@/components/TerminalChat";
import LanguageSelectionScreen from "@/components/LanguageSelectionScreen";
import LanguageSelectorClient from "@/components/LanguageSelectorClient";

export default function Home() {
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
      username: user?.worldUsername
    });
  }, [isAuthenticated, isLoading, user]);

  const handleAuthSuccess = (user: any, token: string) => {
    console.log('🎉 [Page] Authentification réussie:', {
      userId: user.userId,
      walletAddress: user.walletAddress,
      worldUsername: user.worldUsername
    });
    
    login(user, token);
    setAuthError(null);
    setShowWelcome(true);
  };

  const handleAuthError = (error: string) => {
    console.error('❌ [Page] Erreur d\'authentification:', error);
    setAuthError(error);
  };

  const handleWelcomeComplete = () => {
    console.log('✅ [Page] Animation de bienvenue terminée');
    setShowWelcome(false);
  };

  const handleIntroComplete = () => {
    console.log('✅ [Page] Intro terminée, passage à l\'authentification');
    setShowIntro(false);
    setShowWelcome(true);
  };

  const handleLanguageSelected = (langCode: string) => {
    console.log('🌍 [Page] Langue sélectionnée:', langCode);
    setLanguageSelected(true);
    // Recharger pour appliquer la nouvelle langue
    window.location.reload();
  };

  // Si on charge encore les données d'authentification ou de langue
  if (isLoading || languageSelected === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">
          Chargement...
        </div>
      </div>
    );
  }

  // 0. TOUJOURS afficher la sélection de langue en premier si elle n'a pas été faite
  if (!languageSelected) {
    return <LanguageSelectionScreen onLanguageSelected={handleLanguageSelected} />;
  }

  // 1. Toujours afficher l'intro d'abord
  if (showIntro) {
    return <GameIntro onComplete={handleIntroComplete} />;
  }

  // 2. Ensuite la page de bienvenue / authentification
  if (showWelcome || !isAuthenticated) {
    return (
      <WelcomePage 
        onComplete={handleWelcomeComplete}
        onAuthSuccess={handleAuthSuccess}
        onAuthError={handleAuthError}
      />
    );
  }

  // 3. Enfin, une fois authentifié et après la page de bienvenue, afficher le terminal
  if (isAuthenticated && user) {
    console.log('🎯 [Page] Utilisateur authentifié, affichage du chat');
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <img
          src="/kaelen_sit.png"
          alt="Kaelen background"
          className="fixed top-0 left-0 w-screen h-screen object-cover object-center brightness-90 blur-[2px] -z-10"
        />
        <LanguageSelectorClient />
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
  console.warn('⚠️ [Page] État inattendu, retour à l\'intro');
  return <GameIntro onComplete={handleIntroComplete} />;
}
