// Script de test pour l'authentification World Wallet
const axios = require('axios');

const BASE_URL = 'https://k-a-e-l-e-n.onrender.com/api/world-wallet';

// Adresse de test - celle mentionnée par l'utilisateur
const TEST_WALLET = '0x21bee69e692ceb4c02b66c7a45620684904ba395';
const TEST_USERNAME = 'samiii';

async function testAuthFlow() {
  console.log('🧪 Test du flux d\'authentification World Wallet');
  console.log('📍 Wallet de test:', TEST_WALLET);
  console.log('👤 Username de test:', TEST_USERNAME);
  console.log('');

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    console.log('1️⃣ Vérification existence utilisateur...');
    const checkResponse = await axios.get(`${BASE_URL}/check-user/${TEST_WALLET}`);
    console.log('✅ Réponse check-user:', checkResponse.data);
    
    if (checkResponse.data.exists) {
      console.log('🔍 Utilisateur existant trouvé:');
      console.log('   - ID:', checkResponse.data.user.userId);
      console.log('   - Wallet:', checkResponse.data.user.walletAddress);
      console.log('   - Username:', checkResponse.data.user.worldUsername);
      console.log('   - Créé le:', checkResponse.data.user.createdAt);
      console.log('');
    } else {
      console.log('ℹ️ Aucun utilisateur existant avec cette wallet');
      console.log('');
    }

    // 2. Tester la génération de nonce
    console.log('2️⃣ Génération du nonce...');
    const nonceResponse = await axios.get(`${BASE_URL}/nonce`);
    console.log('✅ Nonce généré:', nonceResponse.data.nonce);
    console.log('');

    // 3. Simuler une authentification réussie (normalement fait par MiniKit)
    console.log('3️⃣ Simulation authentification SIWE...');
    console.log('⚠️ Cette étape nécessiterait une vraie signature MiniKit');
    console.log('   Pour tester complètement, utilisez l\'app dans World App');
    console.log('');

    console.log('✅ Tests de base terminés avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Fonction pour nettoyer un utilisateur de test (utile pour debug)
async function cleanupTestUser() {
  console.log('🧹 Nettoyage de l\'utilisateur de test...');
  console.log('⚠️ Cette fonction nécessiterait un endpoint de suppression côté backend');
}

// Exécuter les tests
if (require.main === module) {
  testAuthFlow();
}

module.exports = {
  testAuthFlow,
  cleanupTestUser,
  TEST_WALLET,
  TEST_USERNAME
}; 