# Mise à jour du système de balance ECHO

## Changements effectués

### 1. Suppression de la limite quotidienne
- **Avant**: 1 ECHO par jour maximum
- **Après**: L'utilisateur peut claim toute sa balance accumulée à tout moment

### 2. Modifications Backend

#### Route `/api/echo-claim`
- Récupère la balance complète de l'utilisateur
- Crée un voucher pour le montant total de la balance
- Plus de vérification de limite quotidienne
- Suppression du système de tracking des claims

### 3. Modifications Frontend

#### Composant TerminalChat
- Suppression de l'état `hasClaimedEcho`
- Suppression du check de claim quotidien
- Le bouton affiche maintenant "Claim X.X ECHO" avec le montant exact
- Bouton désactivé uniquement si balance = 0
- Suppression du deuxième bouton "Grab 1 ECHO" dupliqué

#### Traductions
- Changement de "Grab 1 ECHO" en "Claim ECHO"
- Ajout de "Claim" pour le texte du bouton avec montant

### 4. Interface utilisateur

**Affichage actuel**:
- Balance en temps réel au-dessus du bouton
- Bouton affiche "Claim X.X ECHO" avec le montant exact
- Bouton grisé si balance = 0
- Animation lors de réception de tokens

### 5. Flux utilisateur

1. L'utilisateur accumule des ECHO en jouant
2. La balance s'affiche en temps réel
3. Quand il veut, il clique sur "Claim X.X ECHO"
4. Transaction envoyée via World App
5. Balance réinitialisée à 0
6. Il peut continuer à accumuler immédiatement

## Avantages

- Plus de flexibilité pour les utilisateurs
- Système plus simple et intuitif
- Pas besoin d'attendre 24h entre les claims
- Encourage l'engagement continu 