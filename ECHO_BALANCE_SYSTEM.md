# Système de Balance ECHO

## Vue d'ensemble

Le système de balance ECHO permet aux utilisateurs d'accumuler des tokens ECHO à travers différentes actions dans l'application Hoshima. Les tokens accumulés peuvent être réclamés une fois par jour via le bouton "Grab ECHO".

## Règles d'accumulation

### 1. Récompense horaire (0.5 ECHO)
- **Montant**: 0.5 ECHO
- **Fréquence**: Toutes les 3 heures
- **Bénéficiaires**: Tous les utilisateurs enregistrés
- **Automatique**: La distribution se fait automatiquement en arrière-plan

### 2. Bonus de connexion (0.1 ECHO)
- **Montant**: 0.1 ECHO
- **Fréquence**: Une fois par jour (24h)
- **Déclenchement**: Automatique lors de la première visite de l'application
- **Condition**: L'utilisateur doit être authentifié

### 3. Récompense de message (5 ECHO)
- **Montant**: 5 ECHO par message
- **Limite**: Maximum 100 messages récompensés par jour
- **Déclenchement**: À chaque envoi de message dans le chat
- **Condition**: L'utilisateur doit être authentifié

## Réclamation des tokens

### Processus de claim
1. L'utilisateur clique sur le bouton "Claim X ECHO"
2. La transaction est préparée avec la balance actuelle complète
3. Les tokens sont envoyés à l'adresse wallet de l'utilisateur
4. La balance est réinitialisée à 0

### Conditions
- L'utilisateur doit avoir une balance > 0
- L'utilisateur doit être connecté avec World Wallet
- La transaction doit être approuvée dans World App

## Interface utilisateur

### Affichage de la balance
- Position: En bas à droite, au-dessus du bouton "Grab ECHO"
- Format: "Balance: X.X ECHO"
- Animation: Pulse léger quand la balance augmente

### Notifications
- Notification popup quand l'utilisateur reçoit des ECHO
- Message d'erreur si tentative de claim sans balance
- Confirmation après claim réussi

## Architecture technique

### Backend
- **Modèle User**: Nouveaux champs pour stocker la balance et les timestamps
- **EchoBalanceService**: Service dédié pour gérer toute la logique
- **Routes API**: 
  - GET `/api/echo-balance/:userId` - Récupérer la balance
  - POST `/api/echo-balance/:userId/reset` - Réinitialiser après claim
- **Timer horaire**: Distribution automatique toutes les 3 heures

### Frontend
- **État local**: Balance mise à jour en temps réel
- **Polling**: Vérification de la balance toutes les minutes
- **Animations**: Feedback visuel pour les changements de balance

## Sécurité

- Limite de 100 messages par jour pour éviter le spam
- Vérification côté serveur de toutes les conditions
- Timestamps pour empêcher les abus
- Balance stockée uniquement côté serveur

## Configuration

Les constantes peuvent être ajustées dans `backend/services/echoBalanceService.js`:
- `CONNECTION_BONUS = 0.1`
- `MESSAGE_REWARD = 5`
- `HOURLY_REWARD = 0.5`
- `HOURLY_INTERVAL = 3 * 60 * 60 * 1000` (3 heures)
- `MAX_DAILY_MESSAGES = 100`

## Test

Pour tester le système:
```bash
cd backend
node test-echo-balance.js
```

Ce script teste tous les scénarios: bonus de connexion, récompenses de message, distribution horaire, et réinitialisation de balance. 