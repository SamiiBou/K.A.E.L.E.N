#!/bin/bash

# Script de test de déploiement sur fork local

echo "=== TEST DE DÉPLOIEMENT DES CONTRATS UPGRADABLES ==="
echo ""

# Charger les variables d'environnement AVANT de les vérifier
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Erreur: Fichier .env introuvable"
    echo "Créez un fichier .env avec PRIVATE_KEY et RPC_URL"
    exit 1
fi

# Vérifier que les variables d'environnement sont définies
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Erreur: PRIVATE_KEY n'est pas définie dans .env"
    echo "Ajoutez PRIVATE_KEY=votre_clé_privée dans le fichier .env"
    exit 1
fi

echo "📍 RPC URL: $RPC_URL"
echo ""

# Démarrer un fork local
echo "🔄 Démarrage d'un fork local de Worldchain..."
anvil --fork-url $RPC_URL &
ANVIL_PID=$!

# Attendre que Anvil démarre
sleep 3

# Déployer sur le fork local
echo ""
echo "🚀 Déploiement des contrats sur le fork local..."
forge script Deployer/DeployUpgradableContracts.s.sol:DeployUpgradableContracts \
    --rpc-url http://localhost:8545 \
    --broadcast \
    -vvv

# Arrêter Anvil
echo ""
echo "✅ Test terminé. Arrêt du fork local..."
kill $ANVIL_PID

echo ""
echo "Pour déployer en production sur Worldchain, utilisez:"
echo "forge script Deployer/DeployUpgradableContracts.s.sol:DeployUpgradableContracts \\"
echo "    --rpc-url \$RPC_URL \\"
echo "    --broadcast \\"
echo "    --verify \\"
echo "    -vvvv" 