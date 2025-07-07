# 🌍 World ID Daily Message Feature - Documentation

## 📋 Statut
**ACTUELLEMENT DÉSACTIVÉ** - Fonctionnalité temporairement commentée

## 🔄 Comment réactiver la fonctionnalité

### 1. Dans `hoshima-project/src/components/TerminalChat.tsx`

**Étape 1 : Décommenter le useEffect d'initialisation**
```typescript
// Chercher cette section (ligne ~330) et décommenter :
useEffect(() => {
  if (typeof window !== 'undefined') {
    const verified = localStorage.getItem('humanity_verified');
    if (verified === 'true') {
      setIsVerified(true);
    }
  }
}, []);
```

**Étape 2 : Décommenter la fonction handleHumanityVerification**
```typescript
// Chercher cette section (ligne ~1540) et décommenter :
const handleHumanityVerification = async () => {
  // ... tout le code de la fonction ...
};
```

**Étape 3 : Décommenter l'interface utilisateur**
```typescript
// Chercher cette section (ligne ~2925) et décommenter :
<div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
  <span className="text-slate-400 text-xs font-mono">{t('chat.humanVerification')}:</span>
  {/* ... tout le JSX du bouton ... */}
</div>
```

### 2. Vérifier l'API route (déjà fonctionnelle)
- `hoshima-project/src/app/api/verify/route.ts` est déjà prête
- Pas de modifications nécessaires

### 3. Vérifier les traductions (déjà présentes)
- Toutes les traductions sont déjà présentes dans `public/locales/*/common.json`
- Clés utilisées : `verification.*`, `chat.humanVerification`, `chat.verified`, etc.

## 📚 Comment ça fonctionne

### Frontend
1. **Bouton de vérification** : Permet à l'utilisateur de déclencher la vérification World ID
2. **États** : `isVerified`, `isVerifying`, `verificationMessage`
3. **Cooldown** : 24h entre chaque réclamation (stocké dans localStorage)
4. **Récompense** : +1 CRU (message gratuit) après vérification réussie

### Backend
1. **API `/api/verify`** : Vérifie la preuve World ID via `verifyCloudProof`
2. **Sécurité** : Vérifie l'action `humanity-action` et le signal utilisateur
3. **Réponse** : Renvoie le statut de vérification (200 = succès, 400 = échec)

### Flow complet
```
User clicks button → MiniKit.verify() → World ID proof → 
Frontend sends to /api/verify → Backend validates → 
Success: +1 CRU + localStorage update
```

## 🔒 Sécurité
- Utilise World ID pour prouver l'humanité
- Nullifier hash pour éviter les doubles réclamations
- Cooldown de 24h côté client
- Vérification côté serveur obligatoire

## 🎯 Raisons de la désactivation
- Fonctionnalité temporairement désactivée pour tests
- Peut être réactivée à tout moment
- Code préservé et documenté

## ⚠️ Notes importantes
- Le fichier `/api/verify/route.ts` reste actif
- Les traductions sont conservées
- Le localStorage peut contenir des données anciennes
- Tester après réactivation sur plusieurs appareils

---
*Dernière mise à jour : [Date actuelle]*
*Status : DÉSACTIVÉ* 