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
    <div className="space-y-6">
      <div className="relative group">
        {/* Glow effect background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300 animate-pulse"></div>
        
        {/* Main button */}
        <button
          onClick={signInWithWallet}
          disabled={isLoading}
          className={`
            relative w-full px-8 py-4 rounded-xl font-mono font-semibold text-lg tracking-wide
            transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
            border-2 backdrop-blur-sm
            ${isLoading 
              ? 'bg-gray-900/50 border-gray-600 cursor-not-allowed text-gray-400' 
              : 'bg-black/60 border-cyan-400/60 text-white hover:border-cyan-300 hover:bg-black/80 hover:shadow-2xl hover:shadow-cyan-500/20'
            }
          `}
          style={{
            boxShadow: isLoading ? 'none' : '0 0 30px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            textShadow: isLoading ? 'none' : '0 0 10px rgba(0, 255, 255, 0.3)'
          }}
        >
          {/* Button content */}
          <div className="relative z-10 flex items-center justify-center space-x-3">
            {isLoading ? (
              <>
                {/* Loading spinner with cyber effect */}
                <div className="relative">
                  <div className="w-6 h-6 border-2 border-gray-500 border-t-cyan-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-6 h-6 border border-cyan-400/30 rounded-full animate-ping"></div>
                </div>
                <span className="text-gray-400">{t('auth.authenticating')}</span>
              </>
            ) : (
              <>
                {/* World icon */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-black">W</span>
                </div>
                <span className="text-cyan-100 group-hover:text-white transition-colors">
                  {t('auth.signIn')}
                </span>
                {/* Arrow indicator */}
                <div className="ml-2 text-cyan-400 group-hover:translate-x-1 transition-transform">→</div>
              </>
            )}
          </div>
          
          {/* Scanning line effect */}
          {!isLoading && (
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-scan-line-button"></div>
            </div>
          )}
        </button>
      </div>

      {/* Security message */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-cyan-400/80 font-mono">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>🔒 {t('auth.connectSecurely')}</span>
        </div>
      </div>
    </div>
  );
};

export default WorldWalletAuth; 