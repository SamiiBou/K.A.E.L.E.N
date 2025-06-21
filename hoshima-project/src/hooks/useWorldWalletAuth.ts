'use client';

import { useState, useEffect, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { AUTH_CONFIG, ERROR_MESSAGES } from '@/config/constants';

interface User {
  userId: string;
  walletAddress: string;
  worldUsername?: string;
  profilePictureUrl?: string;
  authMethod: string;
  currentScore?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useWorldWalletAuth() {
  // console.log('🎯 [Hook] useWorldWalletAuth initialisé');
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Debug logging
  useEffect(() => {
    // console.log('🎯 [Hook] État d\'authentification actuel:', authState);
  }, [authState]);

  // console.log('🎯 [Hook] useEffect de vérification du localStorage');
  // Vérifier le localStorage au montage
  useEffect(() => {
    // console.log('🎯 [Hook] useEffect de vérification du localStorage');
    // Vérifier s'il y a un token stocké au démarrage
    const checkStoredAuth = () => {
      console.log('🔍 [Auth] Vérification de l\'authentification stockée...');
      
      const storedToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);

      console.log('🔍 [Auth] Token stocké:', storedToken ? 'PRÉSENT' : 'ABSENT');
      console.log('🔍 [Auth] User stocké:', storedUser ? 'PRÉSENT' : 'ABSENT');
      console.log('🔍 [Auth] AUTH_CONFIG.TOKEN_KEY:', AUTH_CONFIG.TOKEN_KEY);
      console.log('🔍 [Auth] AUTH_CONFIG.USER_KEY:', AUTH_CONFIG.USER_KEY);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('🔍 [Auth] Utilisateur parsé:', parsedUser);
          
          // Vérifier la validité des données utilisateur
          if (!parsedUser.userId || !parsedUser.walletAddress) {
            console.warn('⚠️ [Auth] Données utilisateur invalides, nettoyage...');
            logout();
            return;
          }
          
          console.log('✅ [Auth] Données utilisateur récupérées:', {
            userId: parsedUser.userId,
            walletAddress: parsedUser.walletAddress,
            worldUsername: parsedUser.worldUsername
          });
          
          // Mettre à jour l'état avec les données du localStorage
          // console.log('🎯 [Hook] setAuthState appelé avec utilisateur valide');
          setAuthState({
            user: parsedUser,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('❌ [Auth] Erreur lors du parsing des données utilisateur:', error);
          logout();
        }
      } else if (storedToken && !storedUser) {
        // Token présent mais pas d'utilisateur - situation incohérente
        console.warn('⚠️ [Auth] Token orphelin détecté, nettoyage...');
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      } else if (!storedToken && storedUser) {
        // Utilisateur présent mais pas de token - situation incohérente
        console.warn('⚠️ [Auth] Données utilisateur orphelines détectées, nettoyage...');
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      } else {
        console.log('ℹ️ [Auth] Aucune authentification stockée trouvée');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkStoredAuth();
  }, []);

  // Surveiller les changements d'état
  useEffect(() => {
    if (authState.user) {
      // console.log('🎯 [Hook] ⚡ ÉTAT D\'AUTHENTIFICATION CHANGÉ ⚡');
      // console.log('🎯 [Hook] - user:', authState.user);
      // console.log('🎯 [Hook] - isAuthenticated:', authState.isAuthenticated);
      // console.log('🎯 [Hook] - isLoading:', authState.isLoading);
      // console.log('🎯 [Hook] - token présent:', !!authState.token);
    }
  }, [authState]);

  const login = (user: User, token: string) => {
    console.log('🔐 [Auth] Connexion utilisateur:', {
      userId: user.userId,
      walletAddress: user.walletAddress,
      worldUsername: user.worldUsername
    });
    
    // Stocker les informations d'authentification
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
    
    // Stocker également le username pour compatibilité
    if (user.worldUsername) {
      localStorage.setItem('hoshima_username', user.worldUsername);
    }
    
    // Marquer que l'utilisateur a vu l'animation de bienvenue
    localStorage.setItem('hasSeenWelcomeAnimation', 'true');

    console.log('🔐 [Auth] setAuthState dans login appelé');
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
    
    console.log('✅ [Auth] Utilisateur connecté et données stockées');
  };

  const logout = () => {
    console.log('🔓 [Auth] Déconnexion utilisateur');
    
    // Supprimer les informations d'authentification
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    localStorage.removeItem('hoshima_username');
    
    // NE PAS supprimer hasSeenWelcomeAnimation pour éviter de revoir l'animation

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    console.log('✅ [Auth] Déconnexion terminée');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (authState.user) {
      const newUser = { ...authState.user, ...updatedUser };
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(newUser));
      
      console.log('🔄 [Auth] Utilisateur mis à jour:', {
        userId: newUser.userId,
        walletAddress: newUser.walletAddress,
        worldUsername: newUser.worldUsername
      });
      
      setAuthState(prev => ({
        ...prev,
        user: newUser,
      }));
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (authState.token) {
      return {
        'Authorization': `Bearer ${authState.token}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  };

  // Fonction utilitaire pour faire des requêtes authentifiées
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si l'authentification expire, déconnecter l'utilisateur
    if (response.status === 401) {
      console.warn('⚠️ [Auth] Session expirée, déconnexion automatique');
      logout();
      throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
    }

    return response;
  }, [authState.token, getAuthHeaders]);

  // Vérifier si MiniKit est disponible
  const isWorldAppInstalled = () => {
    return MiniKit.isInstalled();
  };

  // Obtenir les informations utilisateur depuis MiniKit
  const getMiniKitUserInfo = () => {
    if (MiniKit.isInstalled()) {
      return {
        walletAddress: (window as any).MiniKit?.walletAddress,
        username: MiniKit.user?.username,
        profilePictureUrl: MiniKit.user?.profilePictureUrl,
      };
    }
    return null;
  };

  return {
    ...authState,
    login,
    logout,
    updateUser,
    getAuthHeaders,
    authenticatedFetch,
    isWorldAppInstalled,
    getMiniKitUserInfo,
  };
}

export default useWorldWalletAuth; 