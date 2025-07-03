#!/bin/bash

echo "=== DÉPLOIEMENT DES CONTRATS ECHO UPGRADABLES SUR WORLDCHAIN ==="
echo ""

# Vérifier que les variables sont dans .env
if [ ! -f .env ]; then
    echo "❌ Erreur: Fichier .env introuvable"
    exit 1
fi

echo "📍 Utilisation du fichier .env pour les variables"
echo ""

# Afficher les adresses (sans la clé privée)
DEPLOYER_ADDRESS=$(cast wallet address --private-key $(grep PRIVATE_KEY .env | cut -d '=' -f2))
echo "🔑 Adresse du déployeur: $DEPLOYER_ADDRESS"

if grep -q SIGNER_ADDRESS .env; then
    SIGNER=$(grep SIGNER_ADDRESS .env | cut -d '=' -f2)
    echo "✍️  Adresse du signer: $SIGNER"
fi

echo ""
echo "🚀 Démarrage du déploiement..."
echo ""

# Déployer les contrats
forge script Deployer/DeployUpgradableContracts.s.sol:DeployUpgradableContracts \
    --rpc-url $(grep RPC_URL .env | cut -d '=' -f2) \
    --broadcast \
    --verify \
    -vvvv

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "N'oubliez pas de sauvegarder les adresses des proxies affichées ci-dessus !" 