const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDB, checkDBConnection, getDBStatus } = require('./middleware/database');

// Import des routes
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const worldWalletRoutes = require('./routes/worldWalletRoutes');
const worldIdVerifyRoutes = require('./routes/worldIdVerifyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const prizePoolRoutes = require('./routes/prizePoolRoutes');
const echoClaimRoutes = require('./routes/echoClaimRoutes');
const echoBalanceRoutes = require('./routes/echoBalanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const countdownRoutes = require('./routes/countdownRoutes');
const EchoBalanceService = require('./services/echoBalanceService');

// Initialisation de l'application Express
const app = express();

// Middleware de base
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://localhost:5000',
    'https://399c788608d9.ngrok.app',
    'https://k-a-e-l-e-n-oafw.vercel.app',  // Frontend Vercel
    'https://k-a-e-l-e-n.onrender.com',     // Backend Render
    // Support pour tous les sous-domaines Vercel
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/k-a-e-l-e-n.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging amélioré avec debug CORS
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.get('Origin') || 'N/A';
  const userAgent = req.get('User-Agent') || 'N/A';
  
  console.log(`${timestamp} - ${req.method} ${req.originalUrl}`);
  console.log(`  Origin: ${origin}`);
  console.log(`  User-Agent: ${userAgent.substring(0, 50)}...`);
  
  // Log spécial pour les requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    console.log(`  🌐 CORS Preflight Request`);
    console.log(`  Access-Control-Request-Method: ${req.get('Access-Control-Request-Method') || 'N/A'}`);
    console.log(`  Access-Control-Request-Headers: ${req.get('Access-Control-Request-Headers') || 'N/A'}`);
  }
  
  next();
});

// Middleware de vérification de la base de données
app.use('/api', checkDBConnection);

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: '🤖 Hoshima Backend - Système de mémoire IA',
    version: '1.0.0',
    status: 'Opérationnel',
    database: getDBStatus(),
    endpoints: {
      users: '/api/users',
      chat: '/api/chat',
      worldWallet: '/api/world-wallet',
      countdown: '/api/countdown',
      health: '/api/health'
    }
  });
});

// Route de santé système
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbStatus,
    environment: config.nodeEnv
  };
  
  res.json(health);
});

// Routes principales
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/world-wallet', worldWalletRoutes);
app.use('/api/world-id-verify', worldIdVerifyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/prize-pool', prizePoolRoutes);
app.use('/api/echo-claim', echoClaimRoutes);
app.use('/api/echo-balance', echoBalanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/countdown', countdownRoutes);

// Middleware de gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    message: `La route ${req.originalUrl} n'existe pas`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'POST /api/users',
      'GET /api/users/:userId',
      'POST /api/users/:userId/conversations',
      'POST /api/chat',
      'GET /api/world-wallet/nonce',
      'POST /api/world-wallet/complete-siwe',
      'PUT /api/world-wallet/update-profile',
      'POST /api/echo-claim',
      'PUT /api/notifications/permission',
      'GET /api/notifications/permission/:identifier',
      'GET /api/notifications/stats',
      'GET /api/notifications/users'
    ]
  });
});

// Middleware de gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  
  // Erreur de validation Mongoose
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Données invalides',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  // Erreur de duplication MongoDB
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Ressource déjà existante',
      message: 'Un utilisateur avec cet ID existe déjà'
    });
  }
  
  // Erreur générique
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: config.nodeEnv === 'development' ? error.message : 'Une erreur inattendue s\'est produite'
  });
});

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Connexion à la base de données
    await connectDB();
    
    // Démarrage du serveur
    const server = app.listen(config.port, () => {
      console.log('🚀 =====================================');
      console.log('🚀 HOSHIMA BACKEND DÉMARRÉ');
      console.log('🚀 =====================================');
      console.log(`🚀 Port: ${config.port}`);
      console.log(`🚀 Environment: ${config.nodeEnv}`);
      console.log(`🚀 URL: http://localhost:${config.port}`);
      console.log(`🚀 API: http://localhost:${config.port}/api`);
      console.log(`🚀 Health: http://localhost:${config.port}/api/health`);
      console.log('🚀 =====================================');
      
      // Test de connexion à la base de données
      const dbStatus = getDBStatus();
      console.log(`🗄️  Base de données: ${dbStatus.status}`);
      
      if (dbStatus.state === 1) {
        console.log('✅ Système de mémoire IA opérationnel');
      } else {
        console.log('⚠️  Fonctionnement en mode dégradé (sans persistance)');
      }
      
      // Démarrer le timer pour les récompenses horaires ECHO
      EchoBalanceService.startHourlyRewardTimer();
    });
    
    // Gestion de l'arrêt propre du serveur
    process.on('SIGTERM', () => {
      console.log('🛑 Signal SIGTERM reçu, arrêt en cours...');
      server.close(() => {
        console.log('🔌 Serveur HTTP fermé');
        process.exit(0);
      });
    });
    
    return server;
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Export pour les tests
module.exports = app;

// Démarrage du serveur si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
} 