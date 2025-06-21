# 🤖 Hoshima Backend - Système de Mémoire IA

Backend Node.js pour l'application Hoshima qui gère la mémoire persistante des utilisateurs et leurs interactions avec l'IA Silas Vance.

## 🚀 Fonctionnalités

- **Mémoire Utilisateur Persistante** : Sauvegarde toutes les conversations
- **Analyse Émotionnelle** : Suivi des réactions émotionnelles de Silas
- **Profil Personnalisé** : Création d'un profil de personnalité pour chaque utilisateur
- **Système de Score** : Tracking des performances dans le jeu
- **Contexte Adaptatif** : L'IA utilise l'historique pour personnaliser ses réponses

## 🛠️ Installation

1. **Cloner et naviguer dans le dossier backend :**
```bash
cd backend
```

2. **Installer les dépendances :**
```bash
npm install
```

3. **Configurer MongoDB :**
   - Installer MongoDB localement : https://docs.mongodb.com/manual/installation/
   - Ou utiliser MongoDB Atlas (cloud)
   - Démarrer MongoDB : `mongod`

4. **Configuration des variables d'environnement :**
   Créer un fichier `.env` avec :
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/hoshima
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key-here
```

## 🏃‍♂️ Utilisation

### Démarrage en mode développement
```bash
npm run dev
```

### Démarrage en production
```bash
npm start
```

Le serveur démarre sur `http://localhost:3001`

## 📡 API Endpoints

### Utilisateurs
- `POST /api/users` - Créer/récupérer un utilisateur
- `GET /api/users/:userId` - Historique complet d'un utilisateur
- `GET /api/users/:userId/memory` - Contexte mémoire d'un utilisateur

### Conversations
- `POST /api/users/:userId/conversations` - Nouvelle conversation
- `GET /api/users/:userId/conversations/:sessionId` - Messages d'une conversation
- `POST /api/users/:userId/conversations/:sessionId/messages` - Sauvegarder un message
- `DELETE /api/users/:userId/conversations/:sessionId` - Supprimer une conversation

### Chat
- `POST /api/chat` - Envoyer un message à l'IA (avec mémoire intégrée)

### Système
- `GET /api/health` - Statut du système
- `GET /` - Informations générales

## 🧠 Système de Mémoire

### Contexte Utilisateur Généré
Le système génère automatiquement un contexte personnalisé pour chaque utilisateur basé sur :
- Historique des conversations
- Profil émotionnel (émotions les plus suscitées)
- Traits de personnalité détectés
- Sujets récurrents de discussion
- Statistiques de performance

### Exemple de Contexte Mémoire
```
[MÉMOIRE PERSONNELLE DE SILAS CONCERNANT CET UTILISATEUR]

HISTORIQUE RELATIONNEL :
- 42 échanges précédents archivés
- Score moyen atteint : 8.3 (record personnel : 15)
- 7 conversations distinctes

PROFIL ÉMOTIONNEL OBSERVÉ :
- Émotions les plus suscitées : intrigued, touched, impressed
- Cette personne semble privilégier la stimulation intellectuelle

SUJETS RÉCURRENTS :
- Questionnements philosophiques profonds
- Tentatives d'humour et quête du rire
- Réflexions sur les relations humaines

TRAITS DE PERSONNALITÉ DÉTECTÉS :
- Montre une créativité au-dessus de la moyenne
- Esprit curieux qui aime explorer les mystères
- Déterminé à relever le défi intellectuel
```

## 🗄️ Structure de la Base de Données

### Collection `users`
```javascript
{
  userId: String,           // ID unique de l'utilisateur
  username: String,         // Nom d'affichage
  conversations: [{         // Historique des conversations
    sessionId: String,
    messages: [{
      id: String,
      role: 'user' | 'assistant',
      content: String,
      timestamp: Date,
      emotionAnalysis: {
        color: String,
        intensity: Number,
        type: String
      },
      scoreChange: Number
    }],
    totalScore: Number,
    emotionalProfile: {
      dominantEmotions: [String],
      averageIntensity: Number
    }
  }],
  globalStats: {           // Statistiques globales
    totalConversations: Number,
    totalMessages: Number,
    highestScore: Number,
    averageScore: Number,
    favoriteEmotions: [String],
    personalityInsights: [String]
  },
  memoryContext: String,   // Contexte personnalisé généré
  createdAt: Date,
  lastSeen: Date
}
```

## 🎯 Analyse Émotionnelle

Le système analyse les réponses de Silas pour détecter :
- **Banalité/Déception** (gris) - Intensité 3
- **Intrigue/Intérêt** (bleu) - Intensité 2
- **Touché/Vulnérabilité** (violet) - Intensité 4
- **Impressionné/Créativité** (vert) - Intensité 5
- **Espoir/Presque Rire** (jaune) - Intensité 6
- **Rage/Colère** (rouge) - Intensité 4
- **Mystère/Contemplation** (indigo) - Intensité 2

## 🔧 Intégration avec le Frontend

Pour connecter votre frontend Next.js :

1. **Modifier l'endpoint de chat :**
```javascript
// Dans votre frontend, remplacer l'appel API
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: messages,
    userId: 'user-unique-id',    // ID utilisateur
    sessionId: 'session-id',     // ID de session
    username: 'Nom Utilisateur'
  })
});
```

2. **Initialiser un utilisateur :**
```javascript
// Créer/récupérer un utilisateur
const userResponse = await fetch('http://localhost:3001/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-unique-id',
    username: 'Nom Utilisateur'
  })
});
```

## 🐛 Dépannage

### MongoDB non connecté
```bash
# Vérifier que MongoDB est installé
mongod --version

# Démarrer MongoDB
mongod

# Ou avec brew sur macOS
brew services start mongodb-community
```

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port 3001
lsof -i :3001

# Tuer le processus
kill -9 <PID>
```

### Logs de débogage
Le serveur affiche des logs détaillés pour faciliter le débogage :
- ✅ Succès (connexions, opérations réussies)
- ⚠️ Avertissements (mode dégradé, données manquantes)
- ❌ Erreurs (connexions échouées, erreurs serveur)

## 🔐 Sécurité

- CORS configuré pour le développement local
- Validation des données d'entrée
- Gestion des erreurs appropriée
- Pas d'exposition des détails d'erreur en production

## 📈 Performance

- Index MongoDB sur les champs fréquemment recherchés
- Limitation de la taille des requêtes (10MB)
- Gestion des connexions de base de données
- Cache des contextes mémoire

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails. 