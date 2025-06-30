# Instructions pour corriger les traductions dans TerminalChat

## Problème identifié
Seul le texte "K.A.E.L.E.N has indexed..." est traduit car il utilise le hook useTranslation dans WelcomePage. Les autres textes ne sont pas traduits.

## Solution

### 1. Dans TerminalChat.tsx, ajouter en haut du fichier :
```typescript
import { useTranslation } from '@/hooks/useTranslation';
```

### 2. Dans la fonction TerminalChat, ajouter :
```typescript
const { t, locale } = useTranslation();
```

### 3. Remplacer tous les textes hardcodés :

#### Exemple - HOMEOSTASIS :
```typescript
// Avant :
<div className="text-cyan-400/70 text-xs font-mono">HOMEOSTASIS</div>

// Après :
<div className="text-cyan-400/70 text-xs font-mono">{t('chat.homeostasis')}</div>
```

### 4. Pour les messages système, adapter la fonction init() :
```typescript
const systemMessage = t('chat.systemMessage');
addMessage(systemMessage, 'assistant');
```

### 5. Pour transmettre la langue au backend :
```typescript
const response = await authenticatedFetch(getApiUrl('/api/chat'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': locale, // Ajouter cette ligne
  },
  body: JSON.stringify({
    message: input,
    conversationHistory: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  })
});
```

## Test rapide
Pour tester, changez la langue et vérifiez que :
1. Le texte "HOMEOSTASIS" change
2. Les messages système sont traduits
3. Les boutons Yes/No sont traduits
4. Le placeholder de l'input est traduit 