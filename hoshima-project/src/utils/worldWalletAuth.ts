import { MiniKit, MiniAppWalletAuthPayload } from '@worldcoin/minikit-js';

// User type aligned with backend response
export interface User {
  userId: string;
  walletAddress: string;
  worldUsername?: string;
  profilePictureUrl?: string;
  authMethod: string;
  currentScore?: number;
}

export interface AuthResult {
  user: User;
  token: string;
}

/**
 * Effectue tout le flux d'authentification World Wallet (nonce → walletAuth → vérification backend).
 * Lance une erreur si quelque chose échoue.
 */
export async function authenticateWithWorldWallet (): Promise<AuthResult> {
  if (!MiniKit.isInstalled()) {
    throw new Error('Cette application doit être ouverte dans World App');
  }

  // 1. Récupérer le nonce depuis le backend
  const nonceResponse = await fetch('https://k-a-e-l-e-n.onrender.com/api/world-wallet/nonce');
  if (!nonceResponse.ok) {
    throw new Error('Impossible de récupérer le nonce');
  }
  const { nonce } = await nonceResponse.json();

  // 2. Appeler walletAuth de MiniKit
  const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
    nonce,
    requestId: '0',
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
                     statement: 'Connect to Hoshima with your World Wallet to access K.A.E.L.E.N',
  });

  if (finalPayload.status === 'error') {
    throw new Error(finalPayload.details || 'Authentification annulée');
  }

  // 3. Vérification côté backend
  const verifyResponse = await fetch('https://k-a-e-l-e-n.onrender.com/api/world-wallet/complete-siwe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: finalPayload as MiniAppWalletAuthPayload,
      nonce,
    }),
  });

  if (!verifyResponse.ok) {
    throw new Error('Échec de la vérification de l\'authentification');
  }

  const verifyResult = await verifyResponse.json();

  if (verifyResult.status !== 'success' || !verifyResult.isValid) {
    throw new Error(verifyResult.message || 'Authentification invalide');
  }

  // 4. Mettre à jour le profil si dispo
  const worldUsername = MiniKit.user?.username;
  const profilePictureUrl = MiniKit.user?.profilePictureUrl;

  if (worldUsername || profilePictureUrl) {
    await fetch('https://k-a-e-l-e-n.onrender.com/api/world-wallet/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifyResult.token}`,
      },
      body: JSON.stringify({ worldUsername, profilePictureUrl }),
    });
  }

  const result: AuthResult = { user: verifyResult.user as User, token: verifyResult.token as string };

  // --- LOG FRONTEND ---
  console.log('✅ WorldWallet auth success:', result);

  return result;
} 