'use client';

import { useState, useEffect } from 'react';
import { authenticateWithWorldWallet, User } from '@/utils/worldWalletAuth';
import { MiniKit } from '@worldcoin/minikit-js';

interface WorldWalletAuthProps {
  onAuthSuccess: (user: User, token: string) => void;
  onAuthError: (error: string) => void;
}

const WorldWalletAuth: React.FC<WorldWalletAuthProps> = ({ onAuthSuccess, onAuthError }) => {
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
          World App Requis
        </h3>
        <p className="text-yellow-700">
          Cette application doit être ouverte dans World App pour utiliser l'authentification World Wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={signInWithWallet}
        disabled={isLoading}
        className={`
          w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
          }
        `}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Authentification en cours...</span>
          </div>
        ) : (
          'Se connecter avec World Wallet'
        )}
      </button>

      <div className="text-center text-sm text-gray-600">
                        <p>Connect securely with your World Wallet</p>
      </div>
    </div>
  );
};

export default WorldWalletAuth; 