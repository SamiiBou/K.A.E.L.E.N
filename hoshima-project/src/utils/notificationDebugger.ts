import { MiniKit } from '@worldcoin/minikit-js';

/**
 * Utilitaire de debug pour les permissions de notifications
 * Usage en console: NotificationDebugger.methodName()
 */
export class NotificationDebugger {
  /**
   * Affiche l'état actuel des permissions de notifications dans le localStorage
   */
  static logPermissionState() {
    console.group('🔔 [NotificationDebugger] État des permissions');
    
    try {
      const status = localStorage.getItem('hoshima_notification_permission');
      const requested = localStorage.getItem('hoshima_notification_requested');
      const timestamp = localStorage.getItem('hoshima_notification_timestamp');
      
      console.log('📊 État actuel:');
      console.log('  - Status:', status || 'not_requested');
      console.log('  - Requested:', requested === 'true' ? 'Oui' : 'Non');
      console.log('  - Timestamp:', timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Jamais');
      
      console.log('🔧 World App:');
      console.log('  - MiniKit disponible:', MiniKit.isInstalled());
      
      if (timestamp) {
        const time = parseInt(timestamp);
        const now = Date.now();
        const diff = now - time;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        console.log('  - Dernière demande:', 
          hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
        );
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la lecture du localStorage:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Réinitialise complètement l'état des permissions de notifications
   */
  static resetPermissions() {
    try {
      localStorage.removeItem('hoshima_notification_permission');
      localStorage.removeItem('hoshima_notification_requested');
      localStorage.removeItem('hoshima_notification_timestamp');
      
      console.log('✅ [NotificationDebugger] Permissions réinitialisées');
      console.log('💡 Rechargez la page pour voir la demande de permission');
      
    } catch (error) {
      console.error('❌ [NotificationDebugger] Erreur lors de la réinitialisation:', error);
    }
  }

  /**
   * Simule un état de permission accordée
   */
  static simulateGranted() {
    try {
      const timestamp = Date.now();
      localStorage.setItem('hoshima_notification_permission', 'granted');
      localStorage.setItem('hoshima_notification_requested', 'true');
      localStorage.setItem('hoshima_notification_timestamp', timestamp.toString());
      
      console.log('✅ [NotificationDebugger] Permission simulée comme accordée');
      this.logPermissionState();
      
    } catch (error) {
      console.error('❌ [NotificationDebugger] Erreur lors de la simulation:', error);
    }
  }

  /**
   * Simule un état de permission refusée
   */
  static simulateDenied() {
    try {
      const timestamp = Date.now();
      localStorage.setItem('hoshima_notification_permission', 'denied');
      localStorage.setItem('hoshima_notification_requested', 'true');
      localStorage.setItem('hoshima_notification_timestamp', timestamp.toString());
      
      console.log('❌ [NotificationDebugger] Permission simulée comme refusée');
      this.logPermissionState();
      
    } catch (error) {
      console.error('❌ [NotificationDebugger] Erreur lors de la simulation:', error);
    }
  }

  /**
   * Affiche toutes les clés localStorage liées aux notifications
   */
  static logAllNotificationKeys() {
    console.group('🗂️ [NotificationDebugger] Clés localStorage notifications');
    
    try {
      const notificationKeys = Object.keys(localStorage).filter(key =>
        key.includes('notification') || key.includes('hoshima_notification')
      );
      
      if (notificationKeys.length === 0) {
        console.log('ℹ️ Aucune clé de notification trouvée');
      } else {
        notificationKeys.forEach(key => {
          const value = localStorage.getItem(key);
          console.log(`  - ${key}:`, value);
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la lecture des clés:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Affiche un rapport complet de debug
   */
  static fullReport() {
    console.group('📋 [NotificationDebugger] Rapport complet');
    
    this.logPermissionState();
    this.logAllNotificationKeys();
    
    console.log('🔧 Commandes disponibles:');
    console.log('  - NotificationDebugger.resetPermissions() // Réinitialiser');
    console.log('  - NotificationDebugger.simulateGranted() // Simuler accordé');
    console.log('  - NotificationDebugger.simulateDenied() // Simuler refusé');
    console.log('  - NotificationDebugger.logPermissionState() // État actuel');
    
    console.groupEnd();
  }

  /**
   * Force l'affichage de la demande de permission (debug uniquement)
   */
  static forceShowPermissionModal() {
    console.log('🔔 [NotificationDebugger] Pour forcer l\'affichage de la modal:');
    console.log('1. Réinitialisez les permissions: NotificationDebugger.resetPermissions()');
    console.log('2. Rechargez la page');
    console.log('3. Ou utilisez le prop forceShow={true} sur NotificationPermissionManager');
  }

  /**
   * Vérifie si MiniKit est disponible et prêt pour les notifications
   */
  static checkMiniKitAvailability() {
    console.group('🌍 [NotificationDebugger] Vérification MiniKit');
    
    console.log('📱 MiniKit installé:', MiniKit.isInstalled());
    
    if (MiniKit.isInstalled()) {
      console.log('✅ MiniKit est disponible');
      console.log('🔔 Vous pouvez demander les permissions de notification');
    } else {
      console.warn('⚠️ MiniKit non disponible');
      console.log('📖 Cette application doit être ouverte dans World App');
    }
    
    console.groupEnd();
  }

  /**
   * Teste la synchronisation avec l'API backend
   */
  static async testBackendSync() {
    console.group('🔄 [NotificationDebugger] Test synchronisation backend');
    
    try {
      // Récupérer les données utilisateur
      const storedUser = localStorage.getItem('hoshima_user');
      if (!storedUser) {
        console.error('❌ Aucun utilisateur trouvé dans localStorage');
        console.groupEnd();
        return;
      }

      const user = JSON.parse(storedUser);
      console.log('👤 Utilisateur:', {
        userId: user.userId,
        walletAddress: user.walletAddress
      });

      // Tester la récupération de la permission
      const baseUrl = 'https://k-a-e-l-e-n.onrender.com';
      const response = await fetch(`${baseUrl}/api/notifications/permission/${user.userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Permission récupérée du backend:', data.data);
        
        // Comparer avec localStorage
        const localStatus = localStorage.getItem('hoshima_notification_permission');
        const localRequested = localStorage.getItem('hoshima_notification_requested') === 'true';
        
        console.log('🔍 Comparaison localStorage vs Backend:');
        console.log('  Local:', { status: localStatus, requested: localRequested });
        console.log('  Backend:', { 
          status: data.data.notificationPermission, 
          requested: data.data.notificationPermissionRequested 
        });
        
        if (localStatus === data.data.notificationPermission) {
          console.log('✅ Synchronisation OK');
        } else {
          console.warn('⚠️ Désynchronisation détectée');
        }
        
      } else {
        const error = await response.json();
        console.error('❌ Erreur backend:', error);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Récupère les statistiques backend
   */
  static async fetchBackendStats() {
    console.group('📊 [NotificationDebugger] Statistiques backend');
    
    try {
      const baseUrl = 'https://k-a-e-l-e-n.onrender.com';
      const response = await fetch(`${baseUrl}/api/notifications/stats`);
      
      if (response.ok) {
        const data = await response.json();
        const stats = data.data;
        
        console.log('📈 Statistiques globales:');
        console.log(`   Total utilisateurs: ${stats.total}`);
        
        console.log('📊 Répartition:');
        stats.breakdown.forEach((stat: any) => {
          console.log(`   ${stat.status}: ${stat.count} (${stat.percentage}%)`);
        });
        
        const grantedStat = stats.breakdown.find((s: any) => s.status === 'granted');
        if (grantedStat) {
          console.log(`\n🎯 Taux d'acceptation: ${grantedStat.percentage}%`);
        }
        
      } else {
        console.error('❌ Erreur récupération statistiques');
      }
      
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
    
    console.groupEnd();
  }
}

// Exposer globalement pour usage en console de développement
if (typeof window !== 'undefined') {
  (window as any).NotificationDebugger = NotificationDebugger;
} 