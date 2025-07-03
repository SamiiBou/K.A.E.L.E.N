require('dotenv').config();

// Debug log pour vérifier le chargement du .env
console.log('🔧 Loading environment variables...');
console.log('🔧 Current directory:', process.cwd());
console.log('🔧 .env file loaded:', require('fs').existsSync('.env') ? 'YES' : 'NO');

// Obtenir le nom de la branche Git actuelle
const { execSync } = require('child_process');
let gitBranch = 'main';
try {
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  console.log('🌿 Git branch detected:', gitBranch);
} catch (error) {
  console.log('⚠️ Could not detect git branch, using default');
}

// Créer un nom de base de données spécifique à la branche
const getBranchSpecificDbName = (branch) => {
  // Nettoyer le nom de branche pour MongoDB (enlever caractères spéciaux)
  const cleanBranch = branch.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `hoshima_${cleanBranch}`;
};

const dbName = getBranchSpecificDbName(gitBranch);
console.log('🗄️ Database name:', dbName);

const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
  echoDistributorPrivateKey: process.env.ECHO_DISTRIBUTOR_PRIVATE_KEY,
  gitBranch: gitBranch,
  dbName: dbName
};

// Debug pour ECHO
console.log('🔑 ECHO_DISTRIBUTOR_PRIVATE_KEY loaded:', config.echoDistributorPrivateKey ? 'YES' : 'NO');

module.exports = config; 