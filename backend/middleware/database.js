const mongoose = require('mongoose');
const config = require('../config');

// MongoDB connection configuration
const connectDB = async () => {
  try {
    console.log('Tentative de connexion à MongoDB...');
    console.log('URI MongoDB:', config.mongoUri);
    
    const conn = await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connecté à MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur de connexion Mongoose:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('📴 Mongoose déconnecté');
    });
    
    // Fermeture propre lors de l'arrêt de l'application
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Connexion MongoDB fermée à cause de l\'arrêt de l\'application');
      process.exit(0);
    });
    
    return conn;
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    
    // Si c'est un problème de connexion, on peut essayer de continuer en mode dégradé
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Assurez-vous que MongoDB est démarré localement.');
      console.log('💡 Commande pour démarrer MongoDB: mongod');
      console.log('💡 Ou installez MongoDB: https://docs.mongodb.com/manual/installation/');
    }
    
    // En mode développement, on peut continuer sans base de données
    if (config.nodeEnv === 'development') {
      console.log('⚠️  Mode développement: continuer sans base de données');
      return null;
    }
    
    process.exit(1);
  }
};

// Middleware pour vérifier la connexion DB
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️  Base de données non connectée pour:', req.originalUrl);
    
    // En mode développement, on peut simuler les réponses
    if (config.nodeEnv === 'development') {
      req.dbAvailable = false;
      return next();
    }
    
    return res.status(503).json({ 
      error: 'Service de base de données temporairement indisponible',
      success: false 
    });
  }
  
  req.dbAvailable = true;
  next();
};

// Fonction pour obtenir le statut de la base de données
const getDBStatus = () => {
  const states = {
    0: 'Déconnecté',
    1: 'Connecté',
    2: 'En cours de connexion',
    3: 'En cours de déconnexion'
  };
  
  return {
    state: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || 'Inconnu',
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

module.exports = {
  connectDB,
  checkDBConnection,
  getDBStatus
}; 