// Test script pour vérifier la configuration ECHO
require('dotenv').config();

console.log('🧪 Test de configuration ECHO Claim');
console.log('=====================================');

// 1. Vérifier le fichier .env
const fs = require('fs');
const envExists = fs.existsSync('.env');
console.log(`📁 Fichier .env existe: ${envExists ? '✅ OUI' : '❌ NON'}`);

if (!envExists) {
  console.log('❌ ERREUR: Créez un fichier .env dans le dossier backend/');
  process.exit(1);
}

// 2. Vérifier la variable ECHO_DISTRIBUTOR_PRIVATE_KEY
const privateKey = process.env.ECHO_DISTRIBUTOR_PRIVATE_KEY;
console.log(`🔑 ECHO_DISTRIBUTOR_PRIVATE_KEY définie: ${privateKey ? '✅ OUI' : '❌ NON'}`);

if (!privateKey) {
  console.log('❌ ERREUR: Ajoutez ECHO_DISTRIBUTOR_PRIVATE_KEY=votre_clé dans le fichier .env');
  process.exit(1);
}

// 3. Vérifier le format de la clé
const isValidFormat = privateKey.startsWith('0x') && privateKey.length === 66;
console.log(`🔍 Format de la clé valide: ${isValidFormat ? '✅ OUI' : '⚠️  VÉRIFIER'}`);

if (!isValidFormat) {
  console.log('⚠️  La clé privée doit commencer par 0x et avoir 64 caractères hexadécimaux (66 au total)');
}

// 4. Test de création d'un wallet
try {
  const { ethers } = require('ethers');
  const wallet = new ethers.Wallet(privateKey);
  console.log(`👛 Adresse du signer: ${wallet.address}`);
  console.log('✅ Configuration valide!');
  
  console.log('\n📝 IMPORTANT:');
  console.log('- Cette adresse doit être autorisée dans le contrat Distributor');
  console.log('- Le contrat Distributor doit avoir des tokens ECHO');
  
} catch (error) {
  console.log('❌ ERREUR: Clé privée invalide');
  console.log(error.message);
  process.exit(1);
}

console.log('\n✅ Tout est configuré correctement!');
console.log('Vous pouvez maintenant utiliser le bouton "Grab 1 ECHO"'); 