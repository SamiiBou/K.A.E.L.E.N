// Utilitaire pour débugger et nettoyer les problèmes d'authentification
import { AUTH_CONFIG } from '@/config/constants';

interface AuthDebugInfo {
  hasToken: boolean;
  hasUser: boolean;
  tokenValue?: string;
  userValue?: unknown;
  isUserValid: boolean;
  walletAddress?: string;
  username?: string;
  issues: string[];
}

export class AuthDebugger {
  /**
   * Analyse l'état actuel de l'authentification dans le localStorage
   */
  static analyzeAuthState(): AuthDebugInfo {
    const issues: string[] = [];
    
    const storedToken = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    
    let parsedUser = null;
    let isUserValid = false;
    
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
        isUserValid = !!(parsedUser?.userId && parsedUser?.walletAddress);
        
        if (!isUserValid) {
          issues.push('Données utilisateur invalides dans localStorage');
        }
      } catch {
        issues.push('Données utilisateur corrompues dans localStorage');
      }
    }
    
    if (storedToken && !storedUser) {
      issues.push('Token présent mais pas de données utilisateur');
    }
    
    if (!storedToken && storedUser) {
      issues.push('Données utilisateur présentes mais pas de token');
    }
    
    return {
      hasToken: !!storedToken,
      hasUser: !!storedUser,
      tokenValue: storedToken || undefined,
      userValue: parsedUser,
      isUserValid,
      walletAddress: parsedUser?.walletAddress,
      username: parsedUser?.worldUsername,
      issues
    };
  }
  
  /**
   * Affiche un rapport complet de l'état d'authentification
   */
  static logAuthReport(): void {
    const analysis = this.analyzeAuthState();
    
    console.group('🔍 [AuthDebugger] Rapport d\'authentification');
    console.log('Token présent:', analysis.hasToken);
    console.log('Utilisateur présent:', analysis.hasUser);
    console.log('Utilisateur valide:', analysis.isUserValid);
    
    if (analysis.walletAddress) {
      console.log('Adresse wallet:', analysis.walletAddress);
    }
    
    if (analysis.username) {
      console.log('Username:', analysis.username);
    }
    
    if (analysis.issues.length > 0) {
      console.warn('⚠️ Problèmes détectés:');
      analysis.issues.forEach(issue => console.warn('  -', issue));
    } else {
      console.log('✅ Aucun problème détecté');
    }
    
    console.groupEnd();
  }
  
  /**
   * Nettoie toutes les données d'authentification corrompues
   */
  static cleanCorruptedAuth(): boolean {
    const analysis = this.analyzeAuthState();
    
    if (analysis.issues.length > 0) {
      console.warn('🧹 [AuthDebugger] Nettoyage des données corrompues...');
      
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      localStorage.removeItem('hoshima_username');
      
      console.log('✅ [AuthDebugger] Données nettoyées');
      return true;
    }
    
    return false;
  }
  
  /**
   * Vérifie si l'utilisateur avec la wallet donnée existe déjà côté backend
   */
  static async checkUserExists(walletAddress: string): Promise<boolean> {
    try {
      const response = await fetch(`https://7048b6546b0f.ngrok.app/api/world-wallet/check-user/${walletAddress.toLowerCase()}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
    } catch {
      console.warn('⚠️ [AuthDebugger] Erreur lors de la vérification utilisateur');
    }
    
    return false;
  }
  
  /**
   * Affiche toutes les clés localStorage liées à l'app
   */
  static logAllStorageKeys(): void {
    console.group('🗂️ [AuthDebugger] Clés localStorage de l\'app');
    
    const appKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('hoshima') || 
      key.includes('auth') || 
      key.includes('world') ||
      key === 'hasSeenWelcomeAnimation'
    );
    
    appKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value);
    });
    
    if (appKeys.length === 0) {
      console.log('Aucune clé trouvée');
    }
    
    console.groupEnd();
  }
  
  /**
   * Réinitialise complètement l'état d'authentification
   */
  static fullReset(): void {
    console.warn('🔄 [AuthDebugger] Réinitialisation complète...');
    
    // Supprimer toutes les clés liées à l'authentification
    const keysToRemove = [
      AUTH_CONFIG.TOKEN_KEY,
      AUTH_CONFIG.USER_KEY,
      'hoshima_username',
      'hoshima_user_id',
      'hasSeenWelcomeAnimation',
      'humanity_verified'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('✅ [AuthDebugger] Réinitialisation terminée');
  }
}

// Exposer globalement pour debug dans la console
if (typeof window !== 'undefined') {
  (window as any).AuthDebugger = AuthDebugger;
} 