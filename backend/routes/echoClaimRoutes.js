const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const EchoBalanceService = require('../services/echoBalanceService');

const ECHO_TOKEN_ADDRESS = '0xEDE26E239947d5203942b8A297E755a6B44DcdA8';
const DISTRIBUTOR_ADDRESS = '0x46090D7eFC5317F55859B14053dB68f66b220e01';
const SIGNER_PRIVATE_KEY = process.env.ECHO_DISTRIBUTOR_PRIVATE_KEY || '';
const RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public';

// Debug log
console.log('🔑 ECHO Claim Route initialized');
console.log('🔑 Signer key configured:', SIGNER_PRIVATE_KEY ? 'YES' : 'NO');

// ABI du contrat Distributor pour la fonction claim
const DISTRIBUTOR_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "nonce", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" }
        ],
        internalType: "struct DistributorUpgradeable.Voucher",
        name: "v",
        type: "tuple"
      },
      { internalType: "bytes", name: "sig", type: "bytes" }
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

// POST /api/echo-claim
router.post('/', async (req, res) => {
  try {
    const { userId, userAddress } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID required'
      });
    }

    if (!SIGNER_PRIVATE_KEY) {
      console.error('❌ ECHO_DISTRIBUTOR_PRIVATE_KEY not configured in .env file');
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'ECHO distribution service not configured. Please contact administrator.'
      });
    }

    // Plus de limite quotidienne - l'utilisateur peut claim tant qu'il a une balance

    // Si pas d'adresse fournie, on ne peut pas créer le voucher
    if (!userAddress || !ethers.isAddress(userAddress)) {
      return res.status(400).json({
        error: 'Valid user wallet address required'
      });
    }

    try {
      // Récupérer la balance actuelle de l'utilisateur
      const balanceInfo = await EchoBalanceService.getBalance(userId);
      if (!balanceInfo.success || balanceInfo.balance === 0) {
        return res.status(400).json({
          error: 'No ECHO balance to claim'
        });
      }
      
      // Convertir la balance en wei (18 decimals)
      const amountInWei = ethers.parseEther(balanceInfo.balance.toString());
      
      // Créer le wallet signer
      const signerWallet = new ethers.Wallet(SIGNER_PRIVATE_KEY);
      
      // Créer le voucher
      const voucher = {
        to: userAddress,
        amount: amountInWei.toString(),
        nonce: Date.now(), // Utiliser timestamp comme nonce unique
        deadline: Math.floor(Date.now() / 1000) + 3600 // Valide pour 1 heure
      };

      // Créer le hash typé pour la signature (EIP-712)
      const domain = {
        name: "Distributor",
        version: "1",
        chainId: 480, // World Chain mainnet
        verifyingContract: DISTRIBUTOR_ADDRESS
      };

      const types = {
        Voucher: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };

      // Signer le voucher
      const signature = await signerWallet.signTypedData(domain, types, voucher);
      
      console.log(`Created voucher for ${userAddress} to claim ${balanceInfo.balance} ECHO`);

      // Réinitialiser la balance ECHO de l'utilisateur
      const balanceReset = await EchoBalanceService.resetBalance(userId);
      console.log(`💰 Balance ECHO réinitialisée pour ${userId}:`, balanceReset);

      // Retourner les données pour la transaction MiniKit
      return res.json({
        success: true,
        message: 'Voucher created successfully',
        claimedAmount: balanceInfo.balance,
        transaction: {
          address: DISTRIBUTOR_ADDRESS,
          abi: DISTRIBUTOR_ABI,
          functionName: 'claim',
          args: [
            voucher,
            signature
          ]
        },
        voucher,
        signature,
        balanceReset: balanceReset
      });
      
    } catch (error) {
      console.error('Voucher creation error:', error);
      return res.status(500).json({
        error: 'Failed to create voucher'
      });
    }

  } catch (error) {
    console.error('Error in echo-claim:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router; 