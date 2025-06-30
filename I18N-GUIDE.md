# Guide d'internationalisation (i18n) - Projet K.A.E.L.E.N

## Vue d'ensemble

Le système d'internationalisation permet au jeu K.A.E.L.E.N d'être disponible en plusieurs langues :
- 🇬🇧 Anglais (en) - langue par défaut
- 🇪🇸 Espagnol (es)
- 🇮🇩 Indonésien (id) 
- 🇹🇭 Thaïlandais (th)

## Architecture

### Structure des fichiers
```
hoshima-project/
├── public/
│   └── locales/
│       ├── en/
│       │   └── common.json
│       ├── es/
│       │   └── common.json
│       ├── id/
│       │   └── common.json
│       └── th/
│           └── common.json
├── src/
│   ├── components/
│   │   └── LanguageSelectorClient.tsx
│   ├── hooks/
│   │   └── useTranslation.ts
│   └── ...
```

### Composants clés

1. **useTranslation Hook** (`src/hooks/useTranslation.ts`)
   - Hook personnalisé pour accéder aux traductions
   - Gère le changement de langue
   - Cache les traductions pour optimiser les performances

2. **LanguageSelectorClient** (`src/components/LanguageSelectorClient.tsx`)
   - Composant de sélection de langue avec design futuriste
   - Effets sonores et animations
   - Sauvegarde la préférence dans localStorage

## Utilisation

### Dans un composant

```typescript
import { useTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('game.title')}</h1>
      <p>{t('intro.line1')}</p>
    </div>
  );
}
```

### Ajout de nouvelles traductions

1. Ouvrir le fichier de traduction dans chaque langue :
   - `/public/locales/en/common.json`
   - `/public/locales/es/common.json`
   - `/public/locales/id/common.json`
   - `/public/locales/th/common.json`

2. Ajouter la nouvelle clé dans chaque fichier :
```json
{
  "newSection": {
    "newKey": "Translated text"
  }
}
```

3. Utiliser dans le code :
```typescript
const text = t('newSection.newKey');
```

## Ajout d'une nouvelle langue

1. Créer le dossier de la langue :
```bash
mkdir -p public/locales/[code_langue]
```

2. Copier et traduire le fichier common.json :
```bash
cp public/locales/en/common.json public/locales/[code_langue]/
```

3. Mettre à jour le composant LanguageSelectorClient :
```typescript
const languages = [
  // ... langues existantes
  { code: '[code_langue]', name: '[Nom langue]', flag: '[emoji_drapeau]' }
];
```

4. Mettre à jour le hook useTranslation pour reconnaître la nouvelle langue :
```typescript
const validLangs = ['en', 'es', 'id', 'th', '[code_langue]'];
```

## Bonnes pratiques

1. **Organisation des clés** : Utiliser une structure hiérarchique logique
   ```json
   {
     "game": { /* éléments du jeu */ },
     "chat": { /* interface de chat */ },
     "auth": { /* authentification */ }
   }
   ```

2. **Nommage** : Utiliser des clés descriptives en anglais
   - ✅ `chat.inputPlaceholder`
   - ❌ `placeholder1`

3. **Variables** : Pour les textes dynamiques
   ```json
   "welcome": "Bienvenue {{username}}"
   ```
   ```typescript
   t('welcome', { username: 'Player1' })
   ```

4. **Textes longs** : Pour les dialogues de K.A.E.L.E.N, créer des clés séparées
   ```json
   "kaelen": {
     "responses": {
       "greeting1": "...",
       "greeting2": "..."
     }
   }
   ```

## Traduction côté serveur (Backend)

Pour le backend Node.js, vous pouvez utiliser `i18next` :

1. Installation :
```bash
cd backend
npm install i18next i18next-fs-backend
```

2. Configuration dans `server.js` :
```javascript
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');

i18next
  .use(Backend)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json'
    }
  });
```

3. Utilisation dans les routes :
```javascript
app.get('/api/message', (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
  const message = i18next.t('key', { lng: lang });
  res.json({ message });
});
```

## Considérations spéciales pour K.A.E.L.E.N

1. **Ton et personnalité** : Adapter le ton de K.A.E.L.E.N selon la langue
   - Anglais : Mystérieux et philosophique
   - Espagnol : Poétique et émotionnel
   - Indonésien : Respectueux et sage
   - Thaïlandais : Spirituel et contemplatif

2. **Longueur des textes** : Certaines langues nécessitent plus d'espace
   - Prévoir des marges dans l'UI
   - Tester avec les textes les plus longs

3. **Caractères spéciaux** : S'assurer que les polices supportent tous les caractères
   - Particulièrement important pour le thaïlandais

## Débogage

1. Si une traduction n'apparaît pas :
   - Vérifier la console pour les erreurs
   - Confirmer que le fichier JSON est valide
   - Vider le cache du navigateur

2. Pour voir la langue active :
```typescript
const { locale } = useTranslation();
console.log('Langue actuelle:', locale);
```

3. Pour forcer une langue en développement :
```typescript
localStorage.setItem('preferred-language', 'es');
// Puis recharger la page
```

## Performance

- Les traductions sont mises en cache après le premier chargement
- Le changement de langue recharge la page (par design)
- Les fichiers de traduction sont servis statiquement pour une performance optimale

## Ressources

- [Documentation Next.js i18n](https://nextjs.org/docs/advanced-features/i18n-routing)
- [Guide i18next](https://www.i18next.com/)
- Services de traduction recommandés :
  - DeepL pour l'espagnol
  - Google Translate API pour l'indonésien et le thaïlandais
  - Révision par des locuteurs natifs recommandée 