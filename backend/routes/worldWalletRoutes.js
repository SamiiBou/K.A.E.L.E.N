const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verifySiweMessage } = require('@worldcoin/minikit-js');
const User = require('../models/User');

const router = express.Router();

// Stockage temporaire des nonces (en production, utiliser Redis)
const nonceStore = new Map();

// Route pour vérifier si un utilisateur existe déjà
router.get('/check-user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Adresse wallet requise' });
    }
    
    const normalizedAddress = walletAddress.toLowerCase().trim();
    console.log('🔍 Vérification existence utilisateur:', normalizedAddress);
    
    const user = await User.findOne({ 
      $or: [
        { walletAddress: normalizedAddress },
        { walletAddress: walletAddress }, 
        { walletAddress: walletAddress.toUpperCase() }
      ]
    });
    
    const exists = !!user;
    console.log('🔍 Utilisateur existe:', exists);
    
    res.json({ 
      exists,
      user: exists ? {
        userId: user.userId,
        walletAddress: user.walletAddress,
        worldUsername: user.worldUsername,
        authMethod: user.authMethod,
        createdAt: user.createdAt
      } : null
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Génération du nonce pour SIWE
router.get('/nonce', (req, res) => {
  try {
    // Génère un nonce aléatoire d'au moins 8 caractères alphanumériques
    const nonce = crypto.randomUUID().replace(/-/g, '');
    
    // Stocke le nonce avec une expiration de 10 minutes
    nonceStore.set(nonce, {
      timestamp: Date.now(),
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    
    // Nettoie les anciens nonces expirés
    for (const [key, value] of nonceStore.entries()) {
      if (Date.now() > value.expires) {
        nonceStore.delete(key);
      }
    }
    
    res.json({ nonce });
  } catch (error) {
    console.error('Erreur lors de la génération du nonce:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la génération du nonce' });
  }
});

// Vérification et completion de l'authentification SIWE
router.post('/complete-siwe', async (req, res) => {
  try {
    const { payload, nonce } = req.body;
    
    if (!payload || !nonce) {
      return res.status(400).json({
        status: 'error',
        isValid: false,
        message: 'Payload et nonce requis'
      });
    }
    
    // Vérification du nonce
    const storedNonce = nonceStore.get(nonce);
    if (!storedNonce) {
      return res.status(400).json({
        status: 'error',
        isValid: false,
        message: 'Nonce invalide ou expiré'
      });
    }
    
    // Supprime le nonce utilisé
    nonceStore.delete(nonce);
    
    // Vérification de la signature SIWE
    const validMessage = await verifySiweMessage(payload, nonce);
    
    if (!validMessage.isValid) {
      return res.status(400).json({
        status: 'error',
        isValid: false,
        message: 'Signature SIWE invalide'
      });
    }
    
    // Extraction des informations du payload
    const { address, message, signature } = payload;
    
    // Normalisation de l'adresse wallet (toujours en minuscules)
    const normalizedAddress = address.toLowerCase().trim();
    console.log('🔍 Recherche utilisateur avec adresse normalisée:', normalizedAddress);
    
    const userIdDeterministic = `world_${normalizedAddress}`; // Préfixe clair, toujours la même valeur pour une adresse donnée

    // Opération atomique pour garantir qu'un seul document existe par walletAddress
    const user = await User.findOneAndUpdate(
      { walletAddress: { $regex: new RegExp(`^${normalizedAddress}$`, 'i') } },
      {
        $setOnInsert: {
          userId: userIdDeterministic,
          walletAddress: normalizedAddress,
          authMethod: 'world_wallet',
          createdAt: new Date()
        },
        $set: {
          lastSeen: new Date()
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    console.log('✅ Utilisateur récupéré ou créé (upsert):', {
      userId: user.userId,
      walletAddress: user.walletAddress
    });
    
    // Génération du JWT
    const token = jwt.sign(
      { 
        userId: user.userId,
        walletAddress: user.walletAddress,
        authMethod: 'world_wallet'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Authentification SIWE validée. Utilisateur connecté:', {
      userId: user.userId,
      walletAddress: user.walletAddress,
      worldUsername: user.worldUsername,
      isNewUser: !user.createdAt || (Date.now() - user.createdAt.getTime()) < 5000 // Créé il y a moins de 5 secondes
    });
    
    res.json({
      status: 'success',
      isValid: true,
      token,
      user: {
        userId: user.userId,
        walletAddress: user.walletAddress,
        worldUsername: user.worldUsername,
        profilePictureUrl: user.profilePictureUrl,
        authMethod: user.authMethod,
        currentScore: user.currentScore || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification SIWE:', error);
    res.status(500).json({
      status: 'error',
      isValid: false,
      message: error.message || 'Erreur serveur lors de la vérification'
    });
  }
});

// Mise à jour des informations utilisateur World (username, photo de profil)
router.put('/update-profile', async (req, res) => {
  try {
    // Récupération du token depuis les headers
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }
    
    // Vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const { worldUsername, profilePictureUrl } = req.body;
    
    // Mise à jour de l'utilisateur
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    if (worldUsername) user.worldUsername = worldUsername;
    if (profilePictureUrl) user.profilePictureUrl = profilePictureUrl;
    
    await user.save();
    
    console.log('✅ Profil utilisateur World Wallet mis à jour (update-profile):', {
      userId: user.userId,
      worldUsername: user.worldUsername,
      profilePictureUrl: user.profilePictureUrl
    });
    
    res.json({
      success: true,
      user: {
        userId: user.userId,
        walletAddress: user.walletAddress,
        worldUsername: user.worldUsername,
        profilePictureUrl: user.profilePictureUrl,
        authMethod: user.authMethod,
        currentScore: user.currentScore || 0
      }
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 