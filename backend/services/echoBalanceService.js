const User = require('../models/User');

class EchoBalanceService {
  // Constantes
  static CONNECTION_BONUS = 0.1;
  static MESSAGE_REWARD = 5;
  static HOURLY_REWARD = 0.5;
  static WORLD_ID_REWARD = 1; // Nouveau: récompense pour vérification World ID
  static HOURLY_INTERVAL = 3 * 60 * 60 * 1000; // 3 heures en millisecondes
  static MAX_DAILY_MESSAGES = 100; // Limite pour éviter le spam

  // Donner le bonus de connexion (0.1 ECHO)
  static async giveConnectionBonus(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return null;

      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

      // Vérifier si l'utilisateur a déjà reçu le bonus aujourd'hui
      if (user.lastConnectionBonus && user.lastConnectionBonus > oneDayAgo) {
        console.log(`⏰ Bonus de connexion déjà reçu pour ${userId}`);
        return { success: false, message: 'Connection bonus already received today' };
      }

      // Donner le bonus
      user.echoBalance += this.CONNECTION_BONUS;
      user.lastConnectionBonus = now;
      await user.save();

      console.log(`✅ Bonus de connexion de ${this.CONNECTION_BONUS} ECHO donné à ${userId}`);
      return { 
        success: true, 
        newBalance: user.echoBalance,
        bonus: this.CONNECTION_BONUS
      };
    } catch (error) {
      console.error('Erreur bonus connexion:', error);
      return { success: false, error: error.message };
    }
  }

  // Récompenser l'envoi de message (5 ECHO)
  static async rewardMessage(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return null;

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Réinitialiser le compteur quotidien si nécessaire
      if (!user.dailyMessageCountReset || user.dailyMessageCountReset < todayStart) {
        user.dailyMessageCount = 0;
        user.dailyMessageCountReset = now;
      }

      // Vérifier la limite quotidienne
      if (user.dailyMessageCount >= this.MAX_DAILY_MESSAGES) {
        console.log(`⚠️ Limite quotidienne atteinte pour ${userId}`);
        return { success: false, message: 'Daily message limit reached' };
      }

      // Donner la récompense
      user.echoBalance += this.MESSAGE_REWARD;
      user.lastMessageSent = now;
      user.dailyMessageCount += 1;
      await user.save();

      console.log(`✅ Récompense de ${this.MESSAGE_REWARD} ECHO pour message de ${userId}`);
      return { 
        success: true, 
        newBalance: user.echoBalance,
        reward: this.MESSAGE_REWARD,
        dailyCount: user.dailyMessageCount
      };
    } catch (error) {
      console.error('Erreur récompense message:', error);
      return { success: false, error: error.message };
    }
  }

  // Distribuer les récompenses horaires (0.5 ECHO toutes les 3 heures)
  static async distributeHourlyRewards() {
    try {
      console.log('🕐 Distribution des récompenses horaires...');
      
      // Trouver tous les utilisateurs actifs
      const result = await User.updateMany(
        {}, 
        { $inc: { echoBalance: this.HOURLY_REWARD } }
      );

      console.log(`✅ ${result.modifiedCount} utilisateurs ont reçu ${this.HOURLY_REWARD} ECHO`);
      return { 
        success: true, 
        usersRewarded: result.modifiedCount,
        reward: this.HOURLY_REWARD
      };
    } catch (error) {
      console.error('Erreur distribution horaire:', error);
      return { success: false, error: error.message };
    }
  }

  // Nouveau: Récompenser la vérification World ID (1 ECHO)
  static async giveWorldIdVerificationReward(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return { success: false, message: 'User not found' };

      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

      // Vérifier si l'utilisateur a déjà reçu la récompense World ID aujourd'hui
      if (user.lastWorldIdVerification && user.lastWorldIdVerification > oneDayAgo) {
        console.log(`⏰ Récompense World ID déjà reçue pour ${userId}`);
        const remainingTime = 24 * 60 * 60 * 1000 - (now - user.lastWorldIdVerification);
        const hours = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        return { 
          success: false, 
          message: 'World ID verification reward already claimed today',
          cooldownHours: hours,
          cooldownMinutes: minutes
        };
      }

      // Donner la récompense
      user.echoBalance += this.WORLD_ID_REWARD;
      user.lastWorldIdVerification = now;
      await user.save();

      console.log(`✅ Récompense World ID de ${this.WORLD_ID_REWARD} ECHO donnée à ${userId}`);
      return { 
        success: true, 
        newBalance: user.echoBalance,
        reward: this.WORLD_ID_REWARD
      };
    } catch (error) {
      console.error('Erreur récompense World ID:', error);
      return { success: false, error: error.message };
    }
  }

  // Récupérer la balance actuelle
  static async getBalance(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return { success: false, balance: 0 };

      return { 
        success: true, 
        balance: user.echoBalance,
        lastClaim: user.lastEchoClaim,
        dailyMessageCount: user.dailyMessageCount
      };
    } catch (error) {
      console.error('Erreur récupération balance:', error);
      return { success: false, balance: 0, error: error.message };
    }
  }

  // Réinitialiser la balance après un claim
  static async resetBalance(userId) {
    try {
      const user = await User.findOne({ userId });
      if (!user) return { success: false };

      const claimedAmount = user.echoBalance;
      user.echoBalance = 0;
      user.lastEchoClaim = new Date();
      await user.save();

      console.log(`🔄 Balance réinitialisée pour ${userId} après claim de ${claimedAmount} ECHO`);
      return { 
        success: true, 
        claimedAmount,
        newBalance: 0
      };
    } catch (error) {
      console.error('Erreur réinitialisation balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Démarrer le timer pour les récompenses horaires
  static startHourlyRewardTimer() {
    console.log('⏰ Démarrage du timer de récompenses horaires');
    
    // Distribution immédiate au démarrage
    this.distributeHourlyRewards();
    
    // Puis toutes les 3 heures
    setInterval(() => {
      this.distributeHourlyRewards();
    }, this.HOURLY_INTERVAL);
  }
}

module.exports = EchoBalanceService; 