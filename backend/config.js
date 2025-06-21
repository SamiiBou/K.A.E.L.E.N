require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hoshima',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY
};

module.exports = config; 