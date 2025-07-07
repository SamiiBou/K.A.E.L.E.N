# 🔍 Guide de Diagnostic du Système de Compte à Rebours

## 🚨 Problème Actuel
Le système affiche "Backend non disponible, utilisation du mode fallback" au lieu de se connecter au serveur backend.

## 🛠️ Outils de Diagnostic Disponibles

### 1. Logs Détaillés dans la Console
Ouvrez la console du navigateur (F12) et recherchez les logs commençant par :
- `🔍 === DÉBUT DIAGNOSTIC COUNTDOWN ===`
- `🚨 === ERREUR COUNTDOWN DÉTAILLÉE ===`

### 2. Panneau de Diagnostic Interactif
- **Raccourci clavier** : `Ctrl+Shift+D`
- **Bouton de retry** : Cliquez sur `↻` à côté de "Mode Local" dans la console

### 3. Scripts de Test
```bash
# Test rapide du backend
node quick-test-backend.js

# Test complet avec Node.js
node test-countdown.js
```

### 4. Fonction de Diagnostic dans la Console
```javascript
// Dans la console du navigateur
runBackendDiagnostic()
```

## 🔧 Solutions Possibles

### Problème 1: Backend non démarré
```bash
cd backend
npm start
```

### Problème 2: Port 5000 occupé
```bash
# Tuer le processus sur le port 5000
lsof -ti:5000 | xargs kill -9

# Puis redémarrer
cd backend && npm start
```

### Problème 3: Problème de CORS
Vérifiez que le backend inclut votre domaine frontend dans la configuration CORS (`backend/server.js` ligne 21-30).

### Problème 4: URL API incorrecte
Le hook utilise automatiquement :
- **Local** : `http://localhost:5000/api`
- **Render** : `https://k-a-e-l-e-n.onrender.com/api`

### Problème 5: Firewall/Proxy
Testez directement l'API :
```bash
# Test de santé
curl http://localhost:5000/api/health

# Test countdown
curl http://localhost:5000/api/countdown
```

## 📊 Informations de Diagnostic

### URLs Testées
- Health: `{API_URL}/health`
- Countdown: `{API_URL}/countdown`
- Status: `{API_URL}/countdown/status`
- Reset: `{API_URL}/countdown/reset` (POST)

### Codes d'Erreur Courants
- **Failed to fetch** : Serveur inaccessible
- **HTTP 404** : Endpoint non trouvé
- **HTTP 500** : Erreur serveur interne
- **HTTP 502** : Bad Gateway
- **AbortError** : Timeout (>5s)
- **NETWORK_OFFLINE** : Pas d'internet

### Structure du Fichier de Données
```
backend/data/countdown.json
{
  "startTime": 1704067200000,
  "endTime": 1704672000000,
  "duration": 604800000
}
```

## 🎯 Étapes de Résolution

1. **Vérifiez la console** pour les logs détaillés
2. **Ouvrez le panneau de debug** (`Ctrl+Shift+D`)
3. **Testez la connectivité** avec les scripts fournis
4. **Vérifiez que le backend tourne** sur le port 5000
5. **Testez les endpoints** directement avec curl

## 🔄 Mode Fallback

Quand le backend est indisponible, le système active automatiquement :
- Compte à rebours local de 7 jours
- Pas de persistance entre les rechargements
- Affichage "Mode Local" avec indicateur orange 🟠

## 🌐 Déploiement sur Render

Pour le déploiement :
1. Le backend doit être accessible sur `https://k-a-e-l-e-n.onrender.com`
2. L'endpoint `/api/countdown` doit répondre
3. Le fichier `data/countdown.json` doit être créé automatiquement
4. Les logs Render doivent être consultés en cas d'erreur

## 💡 Tips de Debug

- Utilisez `runBackendDiagnostic()` dans la console pour un diagnostic complet
- Le panneau de debug montre l'URL API utilisée
- Les logs incluent des solutions spécifiques à chaque erreur
- Le bouton `↻` force une nouvelle tentative de connexion