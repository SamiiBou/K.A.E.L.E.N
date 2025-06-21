// Service pour gérer les utilisateurs et la mémoire
class UserService {
  constructor() {
    this.backendUrl = 'https://k-a-e-l-e-n.onrender.com/api';
    this.currentUser = null;
    this.currentSessionId = null;
  }

  // Récupère l'utilisateur World Wallet déjà authentifié (si présent)
  _getWorldAuthUser() {
    try {
      const stored = localStorage.getItem('hoshima_user'); // même clé que AUTH_CONFIG.USER_KEY côté hook
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  }

  // Génère un ID utilisateur unique OU réutilise celui fourni par l'auth World Wallet
  getUserId() {
    // 1️⃣ Priorité : userId issu de l'auth World Wallet
    const authUser = this._getWorldAuthUser();
    if (authUser?.userId) {
      // Stocker la correspondance pour le code existant (évite de le régénérer plus tard)
      localStorage.setItem('hoshima_user_id', authUser.userId);
      return authUser.userId;
    }

    // 2️⃣ Fallback : ID déjà enregistré par le service
    let userId = localStorage.getItem('hoshima_user_id');
    if (!userId) {
      // 3️⃣ Dernier recours : générer un ID pseudo-aléatoire (mode hors-ligne/dev)
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('hoshima_user_id', userId);
    }
    return userId;
  }

  // Récupère ou génère un nom d'utilisateur cohérent
  getUsername() {
    // 1️⃣ Priorité : username World Wallet
    const authUser = this._getWorldAuthUser();
    if (authUser?.worldUsername) {
      localStorage.setItem('hoshima_username', authUser.worldUsername);
      return authUser.worldUsername;
    }

    // 2️⃣ Sinon, valeur déjà stockée
    let username = localStorage.getItem('hoshima_username');
    if (!username) {
      // 3️⃣ Génération d'un pseudo par défaut
      username = `Explorateur_${Math.random().toString(36).substr(2, 5)}`;
      localStorage.setItem('hoshima_username', username);
    }
    return username;
  }

  // Génère un ID de session unique
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialise ou récupère un utilisateur
  async initializeUser() {
    try {
      const userId = this.getUserId();
      const username = this.getUsername();

      console.log('🔄 Tentative d\'initialisation utilisateur...');
      console.log('📍 Backend URL:', this.backendUrl);
      console.log('👤 User ID:', userId);

      const response = await fetch(`${this.backendUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, username })
      });

      console.log('📡 Status de réponse:', response.status);
      console.log('📡 Headers de réponse:', [...response.headers.entries()]);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.currentUser = data.user;
      
      console.log('✅ Utilisateur initialisé:', this.currentUser);
      console.log('🧠 Mémoire disponible:', data.user?.hasMemory ? 'OUI' : 'NON');
      return this.currentUser;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation utilisateur:', error);
      console.error('🔍 Détails:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      // Continuer sans la mémoire en cas d'erreur
      return null;
    }
  }

  // Démarre une nouvelle conversation
  async startNewConversation() {
    try {
      if (!this.currentUser) {
        await this.initializeUser();
      }

      if (!this.currentUser) {
        // Mode sans mémoire
        this.currentSessionId = this.generateSessionId();
        return this.currentSessionId;
      }

      const response = await fetch(`${this.backendUrl}/users/${this.currentUser.userId}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: this.currentUser.username 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.currentSessionId = data.sessionId;
      
      console.log('✅ Nouvelle conversation démarrée:', this.currentSessionId);
      return this.currentSessionId;
    } catch (error) {
      console.warn('⚠️ Erreur lors du démarrage de conversation:', error);
      // Fallback : ID de session local
      this.currentSessionId = this.generateSessionId();
      return this.currentSessionId;
    }
  }

  // Récupère la mémoire utilisateur
  async getUserMemory() {
    try {
      if (!this.currentUser) {
        return '';
      }

      const response = await fetch(`${this.backendUrl}/users/${this.currentUser.userId}/memory`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.memoryContext || '';
    } catch (error) {
      console.warn('⚠️ Erreur lors de la récupération de la mémoire:', error);
      return '';
    }
  }

  // Récupère l'historique utilisateur
  async getUserHistory() {
    try {
      if (!this.currentUser) {
        return null;
      }

      const response = await fetch(`${this.backendUrl}/users/${this.currentUser.userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.history;
    } catch (error) {
      console.warn('⚠️ Erreur lors de la récupération de l\'historique:', error);
      return null;
    }
  }

  // Charge une conversation existante
  async loadConversation(sessionId) {
    try {
      if (!this.currentUser) {
        return [];
      }

      const response = await fetch(`${this.backendUrl}/users/${this.currentUser.userId}/conversations/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.currentSessionId = sessionId;
      
      return data.conversation.messages || [];
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement de la conversation:', error);
      return [];
    }
  }

  // Envoie un message avec mémoire intégrée
  async sendMessage(messages) {
    try {
      const requestBody = {
        messages,
        userId: this.currentUser?.userId,
        sessionId: this.currentSessionId,
        username: this.currentUser?.username
      };

      const response = await fetch(`${this.backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  // Sauvegarde un message (utilisé pour les messages utilisateur)
  async saveMessage(message, emotionAnalysis = null, scoreChange = 0) {
    try {
      if (!this.currentUser || !this.currentSessionId) {
        return;
      }

      const response = await fetch(`${this.backendUrl}/users/${this.currentUser.userId}/conversations/${this.currentSessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          emotionAnalysis,
          scoreChange
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('⚠️ Erreur lors de la sauvegarde du message:', error);
      return null;
    }
  }

  // Supprime une conversation
  async deleteConversation(sessionId) {
    try {
      if (!this.currentUser) {
        return false;
      }

      const response = await fetch(`${this.backendUrl}/users/${this.currentUser.userId}/conversations/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.warn('⚠️ Erreur lors de la suppression de la conversation:', error);
      return false;
    }
  }

  // Obtient les statistiques utilisateur
  getUserStats() {
    return this.currentUser?.globalStats || {
      totalConversations: 0,
      totalMessages: 0,
      highestScore: 0,
      averageScore: 0,
      favoriteEmotions: []
    };
  }

  // Vérifie si la mémoire est disponible
  hasMemory() {
    return this.currentUser && this.currentUser.hasMemory;
  }

  // Change le nom d'utilisateur
  async changeUsername(newUsername) {
    try {
      localStorage.setItem('hoshima_username', newUsername);
      
      if (this.currentUser) {
        this.currentUser.username = newUsername;
        // Réinitialiser pour mettre à jour côté serveur
        await this.initializeUser();
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Erreur lors du changement de nom:', error);
      return false;
    }
  }

  // Remet à zéro les données utilisateur
  resetUser() {
    localStorage.removeItem('hoshima_user_id');
    localStorage.removeItem('hoshima_username');
    this.currentUser = null;
    this.currentSessionId = null;
  }
}

// Export en tant que singleton
const userService = new UserService();
export default userService; 