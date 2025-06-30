# Guide d'adaptation de TerminalChat avec i18n

## Modifications à apporter dans TerminalChat.tsx

### 1. Importer le hook de traduction

```typescript
import { useTranslation } from '@/hooks/useTranslation';
```

### 2. Dans la fonction du composant

```typescript
export default function TerminalChat(props: TerminalChatProps) {
  const { t } = useTranslation();
  // ... reste du code
}
```

### 3. Remplacer les textes hardcodés

#### Homeostasis
```typescript
// Avant :
<div className="text-cyan-400/70 text-xs font-mono">HOMEOSTASIS</div>

// Après :
<div className="text-cyan-400/70 text-xs font-mono">{t('chat.homeostasis')}</div>
```

#### Sub-Terminal
```typescript
// Prize Pool
<span className="text-yellow-300">
  {t('chat.prizePool')}: {prizePool} WLD
</span>

// Rank
<div>
  {t('chat.rank')}: {currentRank}/{totalCandidates}
</div>

// Time Remaining
<div>
  {t('chat.timeRemaining')}: {timeRemaining.hours}{t('time.hours')} {timeRemaining.minutes}{t('time.minutes')}
</div>

// Registry Button
<button>{t('chat.registry')}</button>
```

#### Input placeholder
```typescript
<input 
  placeholder={t('chat.inputPlaceholder')}
  value={input}
  onChange={(e) => setInput(e.target.value)}
/>
```

#### Messages système
```typescript
// Au lieu de hardcoder les messages :
const systemMessage = "// System: Welcome to K.A.E.L.E.N.";

// Utiliser :
const systemMessage = t('chat.systemMessage');
```

#### Boutons Yes/No
```typescript
{showChoiceButtons && (
  <div className="choice-buttons">
    <button onClick={handleYes}>{t('chat.yes')}</button>
    <button onClick={handleNo}>{t('chat.no')}</button>
  </div>
)}
```

#### Messages du tutoriel
```typescript
const tutorialSteps: TutorialStep[] = [
  {
    ref: homeostasisRef,
    text: t('tutorial.step1'),
    position: 'top'
  },
  {
    ref: homeostasisRef,
    text: t('tutorial.step2'),
    position: 'bottom'
  },
  {
    ref: chatWindowRef,
    text: t('tutorial.step3'),
    position: 'middle'
  },
  {
    ref: consoleButtonRef,
    text: t('tutorial.step4'),
    position: 'bottom'
  },
  {
    ref: purchaseModuleRef,
    text: t('tutorial.step5'),
    position: 'top'
  },
  {
    text: t('tutorial.step6'),
    position: 'middle',
    isFinal: true
  }
];
```

#### Leaderboard
```typescript
// Titre
<h2>{t('leaderboard.title')}</h2>

// En-têtes de colonnes
<th>{t('leaderboard.rank')}</th>
<th>{t('leaderboard.name')}</th>
<th>{t('leaderboard.score')}</th>

// Message de chargement
{isLoadingRegistry && (
  <div>{t('leaderboard.loading')}</div>
)}
```

#### Vérification
```typescript
// Bouton de vérification
<button onClick={handleHumanityVerification}>
  {t('verification.button')}
</button>

// Messages de vérification
{verificationMessage && (
  <div className={isVerified ? "success" : "error"}>
    {isVerified ? t('verification.success') : t('verification.error')}
  </div>
)}
```

## Notes importantes

1. **Messages dynamiques de K.A.E.L.E.N** : Les réponses de K.A.E.L.E.N venant du backend devront être traduites côté serveur en fonction de la langue de l'utilisateur.

2. **Transmission de la langue au backend** : Ajouter la langue dans les headers des requêtes API :

```typescript
const { locale } = useTranslation();

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': locale, // Ajouter la langue ici
  },
  body: JSON.stringify({ message })
});
```

3. **Formatage des nombres et dates** : Utiliser les formatters appropriés selon la locale :

```typescript
// Pour les nombres
const formattedScore = new Intl.NumberFormat(locale).format(playerScore);

// Pour les dates/heures
const formattedTime = new Intl.DateTimeFormat(locale, {
  hour: '2-digit',
  minute: '2-digit'
}).format(date);
```

4. **Ajustements UI** : Certains textes traduits peuvent être plus longs, prévoir des marges suffisantes dans l'interface. 