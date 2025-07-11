const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Fichier pour stocker le timestamp du compte à rebours
const COUNTDOWN_FILE = path.join(__dirname, '../data/countdown.json');

// Durée du compte à rebours en millisecondes (3 jours)
const COUNTDOWN_DURATION = 3 * 24 * 60 * 60 * 1000;

// Fonction pour initialiser le fichier de données
async function initializeCountdownFile() {
  try {
    // Vérifier si le dossier data existe
    const dataDir = path.dirname(COUNTDOWN_FILE);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // Vérifier si le fichier existe
    try {
      await fs.access(COUNTDOWN_FILE);
    } catch {
      // Si le fichier n'existe pas, l'initialiser avec un nouveau compte à rebours
      const initialData = {
        startTime: Date.now(),
        endTime: Date.now() + COUNTDOWN_DURATION,
        duration: COUNTDOWN_DURATION
      };
      await fs.writeFile(COUNTDOWN_FILE, JSON.stringify(initialData, null, 2));
      console.log('🕐 Nouveau compte à rebours de 3 jours initialisé');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du fichier countdown:', error);
  }
}

// Fonction pour lire les données du compte à rebours
async function getCountdownData() {
  try {
    const data = await fs.readFile(COUNTDOWN_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier countdown:', error);
    return null;
  }
}

// Fonction pour mettre à jour les données du compte à rebours
async function updateCountdownData(data) {
  try {
    await fs.writeFile(COUNTDOWN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erreur lors de l\'écriture du fichier countdown:', error);
  }
}

// GET /api/countdown - Récupérer le temps restant
router.get('/', async (req, res) => {
  try {
    await initializeCountdownFile();
    const countdownData = await getCountdownData();
    
    if (!countdownData) {
      return res.status(500).json({ 
        error: 'Impossible de récupérer les données du compte à rebours' 
      });
    }

    const now = Date.now();
    const remainingTime = countdownData.endTime - now;

    // Si le temps est écoulé, redémarrer un nouveau cycle
    if (remainingTime <= 0) {
      const newData = {
        startTime: now,
        endTime: now + COUNTDOWN_DURATION,
        duration: COUNTDOWN_DURATION
      };
      await updateCountdownData(newData);
      
      return res.json({
        timeRemaining: COUNTDOWN_DURATION,
        endTime: newData.endTime,
        startTime: newData.startTime,
        isActive: true,
        cycleRestarted: true
      });
    }

    // Calculer les jours, heures, minutes et secondes restantes
    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    res.json({
      timeRemaining: remainingTime,
      endTime: countdownData.endTime,
      startTime: countdownData.startTime,
      days,
      hours,
      minutes,
      seconds,
      isActive: true,
      cycleRestarted: false
    });

  } catch (error) {
    console.error('Erreur dans GET /api/countdown:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du compte à rebours' 
    });
  }
});

// POST /api/countdown/reset - Redémarrer le compte à rebours
router.post('/reset', async (req, res) => {
  try {
    const now = Date.now();
    const newData = {
      startTime: now,
      endTime: now + COUNTDOWN_DURATION,
      duration: COUNTDOWN_DURATION
    };
    
    await updateCountdownData(newData);
    
    console.log('🔄 Compte à rebours redémarré pour 3 jours');
    
    res.json({
      message: 'Compte à rebours redémarré avec succès',
      timeRemaining: COUNTDOWN_DURATION,
      endTime: newData.endTime,
      startTime: newData.startTime,
      days: 3,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isActive: true
    });

  } catch (error) {
    console.error('Erreur dans POST /api/countdown/reset:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du redémarrage du compte à rebours' 
    });
  }
});

// GET /api/countdown/status - Vérifier le statut du compte à rebours
router.get('/status', async (req, res) => {
  try {
    await initializeCountdownFile();
    const countdownData = await getCountdownData();
    
    if (!countdownData) {
      return res.status(500).json({ 
        error: 'Impossible de récupérer les données du compte à rebours' 
      });
    }

    const now = Date.now();
    const remainingTime = countdownData.endTime - now;
    const isActive = remainingTime > 0;
    const totalDuration = countdownData.duration;
    const elapsedTime = now - countdownData.startTime;
    const progress = Math.min(100, (elapsedTime / totalDuration) * 100);

    res.json({
      isActive,
      remainingTime: Math.max(0, remainingTime),
      totalDuration,
      elapsedTime,
      progress: progress.toFixed(2),
      startTime: countdownData.startTime,
      endTime: countdownData.endTime
    });

  } catch (error) {
    console.error('Erreur dans GET /api/countdown/status:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la vérification du statut' 
    });
  }
});

module.exports = router;