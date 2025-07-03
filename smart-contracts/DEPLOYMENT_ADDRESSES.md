# Adresses de Déploiement - ECHO Token & Distributor Upgradables

**Date de déploiement**: 3 Juillet 2025
**Réseau**: Worldchain Mainnet
**Déployeur**: 0xe336f4Ee3e5D374Db4fE63Af16A9Ec5fE06918D5

## 🪙 ECHO Token (Upgradable)

- **Proxy (UTILISER CETTE ADRESSE)**: `0xEDE26E239947d5203942b8A297E755a6B44DcdA8`
- **Implementation**: `0xe62724644f7eaa232eE49205DBc0cf17E5a8032B`

## 📦 Distributor (Upgradable)

- **Proxy (UTILISER CETTE ADRESSE)**: `0x46090D7eFC5317F55859B14053dB68f66b220e01`
- **Implementation**: `0x8506ce761FAc6fC9676866D4415B899b70a08D5b`

## 🔧 Variables d'Environnement

Ajoutez ces lignes à votre `.env` pour les futures opérations :

```bash
# Adresses des contrats déployés
ECHO_TOKEN_PROXY=0xEDE26E239947d5203942b8A297E755a6B44DcdA8
DISTRIBUTOR_PROXY=0x46090D7eFC5317F55859B14053dB68f66b220e01

# Pour les upgrades futures
ECHO_TOKEN_IMPL=0xe62724644f7eaa232eE49205DBc0cf17E5a8032B
DISTRIBUTOR_IMPL=0x8506ce761FAc6fC9676866D4415B899b70a08D5b
```

## 📊 Informations du Token

- **Nom**: ECHO
- **Symbole**: ECHO
- **Supply Initial**: 1,000,000,000,000 ECHO (1 trillion)
- **Décimales**: 18
- **Propriétaire**: 0xe336f4Ee3e5D374Db4fE63Af16A9Ec5fE06918D5

## 🚀 Commandes Utiles

### Vérifier le propriétaire
```bash
cast call 0xEDE26E239947d5203942b8A297E755a6B44DcdA8 "owner()" --rpc-url $RPC_URL
```

### Vérifier le supply
```bash
cast call 0xEDE26E239947d5203942b8A297E755a6B44DcdA8 "totalSupply()" --rpc-url $RPC_URL | cast --to-unit 18
```

### Upgrader le token
```bash
forge script Deployer/UpgradeContracts.s.sol:UpgradeContracts \
    --sig "upgradeECHOToken(address)" 0xEDE26E239947d5203942b8A297E755a6B44DcdA8 \
    --rpc-url $RPC_URL \
    --broadcast \
    -vvvv
```

### Upgrader le distributor
```bash
forge script Deployer/UpgradeContracts.s.sol:UpgradeContracts \
    --sig "upgradeDistributor(address)" 0x46090D7eFC5317F55859B14053dB68f66b220e01 \
    --rpc-url $RPC_URL \
    --broadcast \
    -vvvv
```

## ⚠️ IMPORTANT

- **TOUJOURS** utiliser les adresses PROXY pour interagir avec les contrats
- **NE JAMAIS** envoyer de tokens ou interagir directement avec les adresses d'implementation
- Gardez ces adresses en sécurité pour les futures mises à jour 