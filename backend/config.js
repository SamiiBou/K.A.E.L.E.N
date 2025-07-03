require('dotenv').config();

// Debug log pour vérifier le chargement du .env
console.log('🔧 Loading environment variables...');
console.log('🔧 Current directory:', process.cwd());
console.log('🔧 .env file loaded:', require('fs').existsSync('.env') ? 'YES' : 'NO');

const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hoshima',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
  echoDistributorPrivateKey: process.env.ECHO_DISTRIBUTOR_PRIVATE_KEY
};

// Debug pour ECHO
console.log('🔑 ECHO_DISTRIBUTOR_PRIVATE_KEY loaded:', config.echoDistributorPrivateKey ? 'YES' : 'NO');

module.exports = config; 