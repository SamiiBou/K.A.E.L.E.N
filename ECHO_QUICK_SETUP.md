# 🚀 Guide Rapide - Configuration ECHO Claim

## ❌ Erreur: "Service temporarily unavailable"

Cette erreur signifie que la clé privée du signer n'est pas configurée.

## ✅ Solution Rapide

### 1. Créez ou modifiez le fichier `.env` dans le dossier `backend/`

```bash
cd backend
```

### 2. Ajoutez cette ligne dans le fichier `.env` :

```env
ECHO_DISTRIBUTOR_PRIVATE_KEY=votre_clé_privée_ici
```

**⚠️ IMPORTANT** : Remplacez `votre_clé_privée_ici` par la vraie clé privée du wallet autorisé dans le contrat Distributor.

### 3. Exemple de fichier `.env` complet :

```env
# MongoDB (optionnel)
MONGODB_URI=mongodb://localhost:27017/hoshima

# Port du serveur
PORT=3001

# OpenAI API Key
OPENAI_API_KEY=sk-...

# JWT Secret
JWT_SECRET=un-secret-random

# Clé privée pour signer les vouchers ECHO (OBLIGATOIRE)
ECHO_DISTRIBUTOR_PRIVATE_KEY=0x1234567890abcdef...
```

### 4. Redémarrez le serveur backend

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez-le
npm run dev
```

### 5. Vérifiez les logs au démarrage

Vous devriez voir :
```
🔑 ECHO_DISTRIBUTOR_PRIVATE_KEY loaded: YES
🔑 ECHO Claim Route initialized
🔑 Signer key configured: YES
```

## 🔐 Note de Sécurité

- **JAMAIS** commiter le fichier `.env` sur Git
- La clé privée doit être celle du signer autorisé dans le contrat
- Cette clé ne contient pas de tokens, elle signe juste les vouchers 