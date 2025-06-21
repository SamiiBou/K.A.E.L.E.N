# Guide de Debug - Authentification World Wallet

## Problème résolu

✅ **Problème**: À chaque connexion/déconnexion, un nouvel utilisateur était créé au lieu de récupérer l'utilisateur existant.

✅ **Solution implémentée**: 
- Amélioration de la recherche d'utilisateur côté backend avec normalisation d'adresse
- Nettoyage automatique des données corrompues côté frontend
- Logs de debug détaillés pour tracer les problèmes

## Améliorations apportées

### Backend (`worldWalletRoutes.js`)

1. **Recherche d'utilisateur améliorée**:
   ```javascript
   // Recherche avec plusieurs variantes d'adresse
   let user = await User.findOne({ 
     $or: [
       { walletAddress: normalizedAddress },
       { walletAddress: address }, 
       { walletAddress: address.toUpperCase() }
     ]
   });
   ```

2. **Normalisation des adresses**:
   - Toutes les adresses sont stockées en minuscules
   - Suppression des espaces avec `.trim()`

3. **Logs de debug détaillés**:
   - Logs lors de la recherche d'utilisateur
   - Logs lors de la création/mise à jour
   - Indication si c'est un nouvel utilisateur ou existant

4. **Nouvelle route de vérification**:
   ```
   GET /api/world-wallet/check-user/:walletAddress
   ```

### Frontend

1. **Hook d'authentification amélioré** (`useWorldWalletAuth.ts`):
   - Validation des données avant stockage
   - Nettoyage automatique des données incohérentes
   - Logs détaillés pour debug

2. **Gestion d'état améliorée** (`page.tsx`):
   - Meilleure logique de redirection
   - Debug des états d'authentification

3. **Utilitaire de debug** (`authDebugger.ts`):
   - Analyse de l'état d'authentification
   - Nettoyage des données corrompues
   - Exposé globalement pour debug dans la console

## Tests et Debug

### 1. Test côté backend

```bash
# Dans le dossier racine
node test-auth.js
```

### 2. Debug côté frontend

Dans la console du navigateur :
```javascript
// Analyser l'état d'authentification
AuthDebugger.logAuthReport();

// Voir toutes les clés localStorage de l'app
AuthDebugger.logAllStorageKeys();

// Nettoyer les données corrompues
AuthDebugger.cleanCorruptedAuth();

// Réinitialisation complète
AuthDebugger.fullReset();
```

### 3. Vérification d'utilisateur

```javascript
// Vérifier si un utilisateur existe avec une wallet donnée
await AuthDebugger.checkUserExists('0x21bee69e692ceb4c02b66c7a45620684904ba395');
```

## Cas d'usage spécifique de l'utilisateur

**Wallet**: `0x21bee69e692ceb4c02b66c7a45620684904ba395`
**Username**: `samiii`

### Ce qui devrait se passer maintenant :

1. **Première connexion** : Création d'un utilisateur avec `userId: world_21bee69e692ceb4c02b66c7a45620684904ba395`
2. **Déconnexion** : Suppression des données du localStorage
3. **Reconnexion** : Récupération de l'utilisateur existant au lieu d'en créer un nouveau

### Vérification dans les logs

Lors de la reconnexion, vous devriez voir :
```
🔍 Recherche utilisateur avec adresse normalisée: 0x21bee69e692ceb4c02b66c7a45620684904ba395
🔍 Résultat de la recherche utilisateur: TROUVÉ
♻️ Utilisateur existant trouvé, mise à jour de lastSeen
```

Au lieu de :
```
🔍 Résultat de la recherche utilisateur: NON TROUVÉ
🆕 Création d'un nouvel utilisateur avec userId: ...
```

## Commandes utiles

### Nettoyage du cache (dans l'app)
```
/clearcache
```

### Reset complet via console
```javascript
AuthDebugger.fullReset();
window.location.reload();
```

## Monitoring

Les logs suivants indiquent un fonctionnement correct :

- `✅ [Auth] Utilisateur connecté et données stockées`
- `♻️ Utilisateur existant trouvé, mise à jour de lastSeen`
- `🎯 [Page] Utilisateur authentifié, affichage du chat`

Les logs suivants indiquent un problème :

- `🆕 Création d'un nouvel utilisateur` (si l'utilisateur devrait déjà exister)
- `⚠️ [Auth] Données utilisateur invalides, nettoyage...`
- `❌ [Auth] Erreur lors du parsing des données utilisateur` 