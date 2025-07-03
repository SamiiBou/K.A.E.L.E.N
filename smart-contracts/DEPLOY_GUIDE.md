# Guide de Déploiement - ECHO Token & Distributor Upgradables

## Vue d'ensemble

Ce projet contient deux smart contracts entièrement upgradables utilisant le pattern UUPS d'OpenZeppelin:
- **ECHO Token**: Un token ERC20 upgradable avec des fonctionnalités de mint, burn et permit
- **Distributor**: Un contrat de distribution upgradable avec signature EIP-712

## Prérequis

1. Foundry installé
2. Variables d'environnement configurées dans `.env`:
```bash
RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
PRIVATE_KEY=your_private_key_here
SIGNER_ADDRESS=0x... # Optionnel, utilisera l'adresse du deployer si non spécifié
```

## Déploiement Initial

### 1. Déployer les deux contrats upgradables:
```bash
forge script Deployer/DeployUpgradableContracts.s.sol:DeployUpgradableContracts \
    --root . \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    -vvvv
```

Cela déploiera:
- ECHO Token (proxy + implementation)
- Distributor (proxy + implementation)

Les adresses seront sauvegardées dans `deployments/latest.json`.

## Fonctionnalités Upgradables

### ECHO Token
- ✅ Changer le nom/symbole (dans une nouvelle version)
- ✅ Modifier MAX_SUPPLY avec `setMaxSupply()`
- ✅ Ajouter/retirer des fonctionnalités
- ✅ Modifier la logique de mint/burn
- ✅ Ajouter des limites de transfert
- ✅ Implémenter des taxes ou fees

### Distributor
- ✅ Pauser/reprendre les claims avec `setClaimingPaused()`
- ✅ Définir des limites min/max avec `setClaimLimits()`
- ✅ Changer le signer avec `setSigner()`
- ✅ Changer le token avec `updateToken()`
- ✅ Ajouter de nouvelles méthodes de distribution
- ✅ Modifier la logique de vérification

## Mise à Jour des Contrats

### 1. Modifier le contrat source
Exemple pour ajouter une limite de transfert au token:
```solidity
// Dans ECHOToken.sol
uint256 public maxTransferAmount;

function setMaxTransferAmount(uint256 amount) public onlyOwner {
    maxTransferAmount = amount;
}

function _beforeTokenTransfer(address from, address to, uint256 amount) 
    internal override {
    if (maxTransferAmount > 0 && amount > maxTransferAmount) {
        revert("Transfer amount exceeds limit");
    }
    super._beforeTokenTransfer(from, to, amount);
}
```

### 2. Déployer la mise à jour
```bash
# Pour mettre à jour ECHO Token
forge script Deployer/UpgradeContracts.s.sol:UpgradeContracts \
    --sig "upgradeECHOToken(address)" ECHO_PROXY_ADDRESS \
    --root . \
    --rpc-url $RPC_URL \
    --broadcast \
    -vvvv

# Pour mettre à jour Distributor
forge script Deployer/UpgradeContracts.s.sol:UpgradeContracts \
    --sig "upgradeDistributor(address)" DISTRIBUTOR_PROXY_ADDRESS \
    --root . \
    --rpc-url $RPC_URL \
    --broadcast \
    -vvvv
```

## Commandes Utiles

### Vérifier le propriétaire actuel
```bash
cast call ECHO_PROXY_ADDRESS "owner()" --rpc-url $RPC_URL
```

### Vérifier l'implementation actuelle
```bash
cast storage ECHO_PROXY_ADDRESS 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc --rpc-url $RPC_URL
```

### Transférer la propriété
```bash
cast send ECHO_PROXY_ADDRESS "transferOwnership(address)" NEW_OWNER_ADDRESS \
    --private-key $PRIVATE_KEY \
    --rpc-url $RPC_URL
```

## Sécurité

1. **Seul le owner peut upgrader** - Les upgrades sont protégées par `onlyOwner`
2. **Initializers** - Les contrats utilisent `_disableInitializers()` pour éviter la réinitialisation
3. **Storage Gaps** - Considérez l'ajout de storage gaps pour les futures mises à jour

## Architecture

```
Proxy (adresse permanente) ──────> Implementation (logique upgradable)
     │                                    │
     └── Storage persistant              └── Code exécutable
```

Les utilisateurs interagissent toujours avec l'adresse du Proxy, qui délègue les appels à l'Implementation actuelle. 