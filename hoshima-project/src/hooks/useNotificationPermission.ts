'use client';

import { useState, useEffect, useCallback } from 'react';
import { MiniKit, Permission, RequestPermissionPayload, MiniAppRequestPermissionSuccessPayload, MiniAppRequestPermissionErrorPayload } from '@worldcoin/minikit-js';
import { getApiUrl } from '@/config/constants';

// Clés localStorage pour les permissions de notifications
const NOTIFICATION_PERMISSION_KEYS = {
  PERMISSION_STATUS: 'hoshima_notification_permission',
  PERMISSION_REQUESTED: 'hoshima_notification_requested',
  PERMISSION_TIMESTAMP: 'hoshima_notification_timestamp',
};

// Types pour l'état des permissions
export type NotificationPermissionStatus = 'granted' | 'denied' | 'unknown' | 'not_requested';

export interface NotificationPermissionState {
  status: NotificationPermissionStatus;
  isRequesting: boolean;
  hasBeenRequested: boolean;
  lastRequestTimestamp: number | null;
  error: string | null;
}

export function useNotificationPermission() {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    status: 'unknown',
    isRequesting: false,
    hasBeenRequested: false,
    lastRequestTimestamp: null,
    error: null,
  });

  // Charger l'état depuis le localStorage au montage
  useEffect(() => {
    loadPermissionStateFromStorage();
  }, []);

  const loadPermissionStateFromStorage = useCallback(() => {
    try {
      const storedStatus = localStorage.getItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_STATUS) as NotificationPermissionStatus;
      const hasBeenRequested = localStorage.getItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_REQUESTED) === 'true';
      const timestampStr = localStorage.getItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_TIMESTAMP);
      const lastRequestTimestamp = timestampStr ? parseInt(timestampStr, 10) : null;

      setPermissionState({
        status: storedStatus || 'not_requested',
        isRequesting: false,
        hasBeenRequested,
        lastRequestTimestamp,
        error: null,
      });
    } catch (error) {
      console.error('[NotificationPermission] Erreur lors du chargement depuis le localStorage:', error);
      setPermissionState({
        status: 'unknown',
        isRequesting: false,
        hasBeenRequested: false,
        lastRequestTimestamp: null,
        error: null,
      });
    }
  }, []);

  const savePermissionStateToStorage = useCallback((
    status: NotificationPermissionStatus,
    hasBeenRequested: boolean,
    timestamp?: number
  ) => {
    try {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_STATUS, status);
      localStorage.setItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_REQUESTED, hasBeenRequested.toString());
      
      if (timestamp) {
        localStorage.setItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_TIMESTAMP, timestamp.toString());
      }
    } catch (error) {
      console.error('[NotificationPermission] Erreur lors de la sauvegarde dans le localStorage:', error);
    }
  }, []);

  // Synchroniser avec l'API backend
  const syncWithBackend = useCallback(async (
    status: NotificationPermissionStatus,
    timestamp: number
  ) => {
    try {
      // Récupérer les données utilisateur depuis le localStorage
      const storedUser = localStorage.getItem('hoshima_user');
      if (!storedUser) {
        console.warn('[NotificationPermission] Aucun utilisateur trouvé pour la synchronisation');
        return;
      }

      const user = JSON.parse(storedUser);
      const payload = {
        userId: user.userId,
        walletAddress: user.walletAddress,
        status,
        timestamp
      };

      console.log('[NotificationPermission] Synchronisation avec le backend:', payload);

      const response = await fetch(getApiUrl('/api/notifications/permission'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[NotificationPermission] ✅ Synchronisation réussie:', result.data);
      } else {
        const error = await response.json();
        console.error('[NotificationPermission] ❌ Erreur de synchronisation:', error);
      }
    } catch (error) {
      console.error('[NotificationPermission] ❌ Erreur lors de la synchronisation:', error);
      // Ne pas faire échouer le processus principal si la sync échoue
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<{
    success: boolean;
    status: NotificationPermissionStatus;
    error?: string;
  }> => {
    // Vérifier si MiniKit est disponible
    if (!MiniKit.isInstalled()) {
      const error = 'World App is required to request notification permissions';
      setPermissionState(prev => ({ ...prev, error }));
      return { success: false, status: 'unknown', error };
    }

    // Éviter les demandes multiples simultanées
    if (permissionState.isRequesting) {
      return { success: false, status: permissionState.status, error: 'Already requesting permission' };
    }

    // Vérifier si l'utilisateur a déjà refusé (ne demander qu'une fois)
    if (permissionState.hasBeenRequested && permissionState.status === 'denied') {
      return { 
        success: false, 
        status: 'denied', 
        error: 'Permission has already been denied. Please enable notifications in World App settings.' 
      };
    }

    setPermissionState(prev => ({ ...prev, isRequesting: true, error: null }));

    try {
      const requestPermissionPayload: RequestPermissionPayload = {
        permission: Permission.Notifications,
      };

      console.log('[NotificationPermission] Requesting notification permission...');
      const response = await MiniKit.commandsAsync.requestPermission(requestPermissionPayload);
      const timestamp = Date.now();

      if (response.finalPayload.status === 'success') {
        const successPayload = response.finalPayload as MiniAppRequestPermissionSuccessPayload;
        console.log('[NotificationPermission] Permission granted:', successPayload);
        
        setPermissionState({
          status: 'granted',
          isRequesting: false,
          hasBeenRequested: true,
          lastRequestTimestamp: timestamp,
          error: null,
        });
        
        savePermissionStateToStorage('granted', true, timestamp);
        
        // Synchroniser avec le backend
        await syncWithBackend('granted', timestamp);
        
        return { success: true, status: 'granted' };
      } else {
        const errorPayload = response.finalPayload as MiniAppRequestPermissionErrorPayload;
        console.log('[NotificationPermission] Permission denied or error:', errorPayload);
        
        let status: NotificationPermissionStatus = 'denied';
        let errorMessage = 'Permission request failed';

        switch (errorPayload.error_code) {
          case 'user_rejected':
            status = 'denied';
            errorMessage = 'User declined the notification permission request';
            break;
          case 'already_granted':
            status = 'granted';
            errorMessage = '';
            break;
          case 'already_requested':
            status = 'denied';
            errorMessage = 'Permission has already been requested and denied';
            break;
          case 'permission_disabled':
            status = 'denied';
            errorMessage = 'Notifications are disabled for World App';
            break;
          case 'unsupported_permission':
            status = 'unknown';
            errorMessage = 'Notification permission is not supported';
            break;
          case 'generic_error':
          default:
            status = 'unknown';
            errorMessage = 'An error occurred while requesting permission';
            break;
        }

        setPermissionState({
          status,
          isRequesting: false,
          hasBeenRequested: true,
          lastRequestTimestamp: timestamp,
          error: errorMessage,
        });

        savePermissionStateToStorage(status, true, timestamp);
        
        // Synchroniser avec le backend (même en cas d'erreur pour tracking)
        await syncWithBackend(status, timestamp);
        
        return { success: false, status, error: errorMessage };
      }
    } catch (error) {
      console.error('[NotificationPermission] Error requesting permission:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setPermissionState(prev => ({
        ...prev,
        isRequesting: false,
        error: errorMessage,
      }));

      return { success: false, status: 'unknown', error: errorMessage };
    }
  }, [permissionState.isRequesting, permissionState.hasBeenRequested, permissionState.status, savePermissionStateToStorage, syncWithBackend]);

  // Vérifier si on doit demander les permissions (première visite ou permissions non accordées)
  const shouldRequestPermission = useCallback((): boolean => {
    return !permissionState.hasBeenRequested || 
           (permissionState.status !== 'granted' && permissionState.status !== 'denied');
  }, [permissionState.hasBeenRequested, permissionState.status]);

  // Réinitialiser l'état des permissions (pour le développement/debug)
  const resetPermissionState = useCallback(() => {
    try {
      localStorage.removeItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_STATUS);
      localStorage.removeItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_REQUESTED);
      localStorage.removeItem(NOTIFICATION_PERMISSION_KEYS.PERMISSION_TIMESTAMP);
      
      setPermissionState({
        status: 'not_requested',
        isRequesting: false,
        hasBeenRequested: false,
        lastRequestTimestamp: null,
        error: null,
      });
    } catch (error) {
      console.error('[NotificationPermission] Error resetting permission state:', error);
    }
  }, []);

  return {
    ...permissionState,
    requestNotificationPermission,
    shouldRequestPermission,
    resetPermissionState,
    isWorldAppInstalled: MiniKit.isInstalled(),
  };
} 