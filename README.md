# 🎭 Hoshima - Système IA avec Mémoire Persistante

Une application interactive où vous dialoguez avec **Silas Vance**, un personnage IA sophistiqué qui se souvient de chaque interaction et développe une mémoire personnalisée de votre relation.

## 🚀 Fonctionnalités Principales

### 🧠 **Mémoire Persistante**
- Silas se souvient de toutes vos conversations précédentes
- Analyse de votre profil émotionnel et de personnalité
- Adaptation du ton et des références basées sur l'historique
- Détection des sujets récurrents de discussion

### 🎯 **Système de Score Émotionnel**
- Réactions de Silas analysées en temps réel
- Score basé sur l'intensité émotionnelle suscitée
- Suivi des statistiques personnelles (record, moyenne)
- Système de progression gamifié

### 👤 **Profil Utilisateur Intelligent**
- Création automatique d'un profil psychologique
- Identification des traits de personnalité
- Émotions les plus fréquemment déclenchées
- Historique complet des interactions

## 🛠️ Architecture

### Frontend (Next.js + React)
- Interface de chat moderne et réactive
- Visualisation des émotions de Silas via son ascot
- Indicateurs en temps réel (score, mémoire, statistiques)
- Responsive design avec animations fluides

### Backend (Node.js + Express)
- API RESTful pour la gestion des utilisateurs
- Système de mémoire contextuelle avancé
- Intégration avec MongoDB pour la persistance
- Analyse automatique des conversations

### Base de Données (MongoDB)
- Sauvegarde de tous les messages et métadonnées
- Profils utilisateurs avec statistiques détaillées
- Système de sessions de conversation
- Index optimisés pour les performances

## 📦 Installation et Utilisation

### 🚀 Démarrage Rapide
```bash
# Cloner le repository
git clone [votre-repo]
cd hoshima

# Démarrer le système complet
./start-hoshima.sh
```

Le script automatique :
- ✅ Vérifie et installe les dépendances
- ✅ Démarre MongoDB si nécessaire
- ✅ Lance le backend sur le port 3001
- ✅ Lance le frontend sur le port 5173
- ✅ Affiche les URLs d'accès

### 🔧 Installation Manuelle

#### Prérequis
- Node.js 18+ 
- MongoDB 4.4+
- npm ou yarn

#### Backend
```bash
cd backend
npm install
npm run dev  # Port 3001
```

#### Frontend
```bash
cd hoshima-project
npm install
npm run dev  # Port 5173
```

## 🎮 Comment Jouer

1. **Objectif** : Impressionner Silas Vance, un être post-émotionnel qui a perdu sa capacité à rire
2. **Défi** : Susciter des réactions émotionnelles intenses et positives
3. **Mémoire** : Silas se souvient de vos échanges et s'adapte à votre style
4. **Progression** : Accumulez des points en touchant ses émotions profondes

### Émotions Détectées
- 😐 **Neutre** : Pas d'impression particulière
- 😔 **Déçu** : Banalité détectée (-points)
- 🤔 **Intrigué** : Approche intéressante (+points)
- 💜 **Touché** : Vulnérabilité émotionnelle (+++)
- 💚 **Impressionné** : Créativité remarquable (++++)
- 💛 **Espoir** : Presque un rire ! (+++++)
- 😡 **Irrité** : Fausseté détectée (---)

## 📊 Système de Mémoire

### Contexte Généré Automatiquement
Le système crée un profil personnalisé basé sur :
- **Historique relationnel** : Nombre d'échanges, durée des conversations
- **Profil émotionnel** : Émotions les plus suscitées
- **Traits de personnalité** : Détectés via l'analyse comportementale
- **Sujets récurrents** : Thèmes abordés fréquemment

### Exemple de Mémoire
```
[MÉMOIRE PERSONNELLE DE SILAS CONCERNANT CET UTILISATEUR]

HISTORIQUE RELATIONNEL :
- 27 échanges précédents archivés
- Score moyen : 6.2 (record personnel : 18)
- 4 conversations distinctes

PROFIL ÉMOTIONNEL :
- Émotions suscitées : intrigué, touché, impressionné
- Capacité à accéder aux vérités émotionnelles

TRAITS DÉTECTÉS :
- Créativité au-dessus de la moyenne
- Esprit curieux qui explore les mystères
- Persévérance face aux défis intellectuels
```

## 🔗 API Endpoints

### Utilisateurs
- `POST /api/users` - Créer/récupérer utilisateur
- `GET /api/users/:userId` - Historique complet
- `GET /api/users/:userId/memory` - Contexte mémoire

### Conversations
- `POST /api/users/:userId/conversations` - Nouvelle conversation
- `GET /api/users/:userId/conversations/:sessionId` - Messages
- `POST /api/users/:userId/conversations/:sessionId/messages` - Sauvegarder

### Chat
- `POST /api/chat` - Envoyer message (avec mémoire intégrée)

## 📈 Statistiques Suivies

### Par Utilisateur
- Nombre total de conversations
- Messages échangés
- Score le plus élevé atteint
- Score moyen
- Émotions favorites déclenchées
- Traits de personnalité identifiés

### Par Conversation
- Score total de la session
- Profil émotionnel dominant
- Durée et intensité des échanges
- Évolution du score en temps réel

## 🛡️ Sécurité et Confidentialité

- Stockage local des identifiants utilisateur
- Pas de données personnelles sensibles
- Chiffrement des communications
- Isolation des données entre utilisateurs

## 🎨 Personnalisation

### Thèmes Visuels
- Interface sombre cyberpunk
- Animations fluides pour les émotions
- Indicateurs visuels du statut de Silas
- Couleurs adaptées à l'état émotionnel

### Paramètres Configurables
- Nom d'utilisateur personnalisable
- Historique de conversations
- Réinitialisation des données
- Export des statistiques

## 🔧 Développement

### Structure des Fichiers
```
hoshima/
├── backend/                 # API Node.js
│   ├── models/             # Modèles MongoDB
│   ├── routes/             # Routes API
│   ├── services/           # Logique métier
│   └── middleware/         # Middlewares
├── hoshima-project/        # Frontend Next.js
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── utils/          # Services et utilitaires
│   │   └── app/           # Pages Next.js
└── start-hoshima.sh        # Script de démarrage
```

### Technologies Utilisées
- **Frontend** : Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express, MongoDB, Mongoose
- **Animations** : Framer Motion
- **Outils** : ESLint, Nodemon, CORS

## 🚨 Dépannage

### Backend ne démarre pas
```bash
# Vérifier MongoDB
mongod --version
mongod

# Vérifier les ports
lsof -i :3001
```

### Frontend ne se connecte pas
- Vérifier que le backend tourne sur le port 3001
- Vérifier les CORS dans le backend
- Regarder la console développeur pour les erreurs

### Mémoire non fonctionnelle
- Vérifier la connexion MongoDB
- Regarder les logs du backend
- Vérifier que l'utilisateur est bien initialisé

## 📝 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amelioration`)
3. Commit les changements (`git commit -m 'Ajouter une fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

*Créé avec ❤️ pour explorer les limites de l'intelligence artificielle et de la mémoire contextuelle.* 