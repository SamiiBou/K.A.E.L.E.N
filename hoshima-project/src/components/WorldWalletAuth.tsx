'use client';

import { useState, useEffect } from 'react';
import { authenticateWithWorldWallet, User } from '@/utils/worldWalletAuth';
import { MiniKit } from '@worldcoin/minikit-js';
import { useLanguage } from '@/contexts/LanguageContext';

interface WorldWalletAuthProps {
  onAuthSuccess: (user: User, token: string) => void;
  onAuthError: (error: string) => void;
}

const WorldWalletAuth: React.FC<WorldWalletAuthProps> = ({ onAuthSuccess, onAuthError }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isWorldAppInstalled, setIsWorldAppInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si MiniKit est installé
    setIsWorldAppInstalled(MiniKit.isInstalled());
  }, []);

  const signInWithWallet = async () => {
    setIsLoading(true);
    try {
      const { user, token } = await authenticateWithWorldWallet();
      onAuthSuccess(user, token);
    } catch (error: any) {
      console.error('World Wallet authentication error:', error);
      onAuthError(error.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isWorldAppInstalled) {
    return (
      <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          {t('auth.worldAppRequired')}
        </h3>
        <p className="text-yellow-700">
          {t('auth.worldAppRequiredDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto">
      {/* Carte principale avec effet holographique */}
      <div className="relative group">
        {/* Aura extérieure multi-couches */}
        <div className="absolute -inset-8 bg-gradient-to-r from-cyan-500/10 via-blue-500/20 to-purple-500/10 rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition-all duration-700 animate-pulse"></div>
        <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 via-blue-400/30 to-purple-400/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-500"></div>
        
        {/* Cadre principal de la carte */}
        <div className="relative overflow-hidden rounded-2xl bg-black/90 backdrop-blur-xl border border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
          {/* Grille de circuit en arrière-plan */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px),
                linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}></div>
          </div>
          
          {/* Lignes de scan animées */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-scan-line-button"></div>
            <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-scan-line-button" style={{ animationDelay: '1s' }}></div>
          </div>
          
          {/* Header de la carte */}
          <div className="relative px-8 py-6 border-b border-cyan-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <span className="text-lg font-bold text-black tracking-tight">W</span>
                  </div>
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 opacity-30 blur animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-white font-mono font-semibold text-lg tracking-wide">WORLD WALLET</h3>
                  <p className="text-cyan-400/70 text-xs font-mono tracking-wider">PROTOCOLE D'AUTHENTIFICATION</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-2 h-2 bg-green-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
          
          {/* Corps de la carte */}
          <div className="relative px-8 py-8">
            {/* Bouton de connexion principal */}
            <button
              onClick={signInWithWallet}
              disabled={isLoading}
              className={`
                relative w-full h-16 rounded-xl font-mono font-semibold text-lg tracking-wide
                transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98]
                border-2 backdrop-blur-sm overflow-hidden
                ${isLoading 
                  ? 'bg-gray-900/50 border-gray-600 cursor-not-allowed text-gray-400' 
                  : 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-cyan-400/60 text-white hover:border-cyan-300 hover:from-cyan-800/60 hover:to-blue-800/60 hover:shadow-2xl hover:shadow-cyan-500/30'
                }
              `}
              style={{
                boxShadow: isLoading ? 'none' : '0 0 40px rgba(0, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                textShadow: isLoading ? 'none' : '0 0 15px rgba(0, 255, 255, 0.4)'
              }}
            >
              {/* Effet de fond animé */}
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/20 to-purple-500/10 animate-pulse"></div>
              )}
              
              {/* Contenu du bouton */}
              <div className="relative z-10 flex items-center justify-center h-full">
                {isLoading ? (
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-8 h-8 border-2 border-gray-500 border-t-cyan-400 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 w-8 h-8 border border-cyan-400/30 rounded-full animate-ping"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-base">{t('auth.authenticating')}</div>
                      <div className="text-cyan-400/60 text-xs font-mono tracking-wider mt-1">CONNEXION EN COURS...</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-cyan-100 group-hover:text-white transition-colors text-base">
                        {t('auth.signIn')}
                      </div>
                      <div className="text-cyan-400/70 text-xs font-mono tracking-wider mt-1 uppercase">Connexion sécurisée</div>
                    </div>
                    <div className="text-cyan-400 group-hover:translate-x-2 transition-transform duration-300 text-xl">›</div>
                  </div>
                )}
              </div>
              
              {/* Ligne de scan interne */}
              {!isLoading && (
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-scan-line-button top-1/2 transform -translate-y-1/2"></div>
                </div>
              )}
            </button>
            
            {/* Message de sécurité amélioré */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-400/20">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-green-400/60 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  <div className="w-1 h-1 bg-green-400/30 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                </div>
                <span className="text-green-400 text-sm font-mono tracking-wide">🔒 {t('auth.connectSecurely')}</span>
              </div>
            </div>
          </div>
          
          {/* Footer avec informations techniques */}
          <div className="relative px-8 py-4 border-t border-cyan-400/20 bg-black/40">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400/60">
              <div className="flex items-center space-x-2">
                <span>PROTOCOLE:</span>
                <span className="text-cyan-400">WORLD ID</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>CHIFFREMENT:</span>
                <span className="text-cyan-400">AES-256</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>STATUT:</span>
                <span className="text-green-400">ACTIF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldWalletAuth; 