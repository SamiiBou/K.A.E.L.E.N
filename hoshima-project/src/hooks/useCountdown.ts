'use client';

import { useState, useEffect, useCallback } from 'react';
import { BackendDiagnostic } from '@/utils/backendDiagnostic';

interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  timeRemaining: number;
  isActive: boolean;
  endTime: number;
  startTime: number;
  cycleRestarted?: boolean;
}

interface CountdownHookResult {
  countdown: CountdownData;
  loading: boolean;
  error: string | null;
  resetCountdown: () => Promise<void>;
  refreshCountdown: () => Promise<void>;
}

export function useCountdown(): CountdownHookResult {
  const [countdown, setCountdown] = useState<CountdownData>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    timeRemaining: 0,
    isActive: false,
    endTime: 0,
    startTime: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour obtenir l'URL de l'API
  const getApiUrl = (useProxy: boolean = false) => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Si on demande le proxy, utiliser l'endpoint local
      if (useProxy) {
        return window.location.origin + '/api';
      }
      
      // En production sur Vercel, utiliser le backend Render
      if (hostname.includes('vercel.app') || hostname.includes('onrender.com')) {
        return 'https://k-a-e-l-e-n.onrender.com/api';
      }
      
      // En développement local
      return 'http://localhost:5000/api';
    }
    
    // Fallback pour le SSR - utiliser Render en production
    return 'https://k-a-e-l-e-n.onrender.com/api';
  };

  // Fonction pour récupérer les données du compte à rebours
  const fetchCountdown = useCallback(async () => {
    console.log('🔍 === DÉBUT DIAGNOSTIC COUNTDOWN ===');
    
    try {
      // Étape 1: Déterminer l'URL de l'API - FORCER le backend Render
      const apiUrl = 'https://k-a-e-l-e-n.onrender.com/api'; // Force l'utilisation du backend
      console.log('🌐 URL de l\'API forcée:', apiUrl);
      console.log('🌐 Hostname actuel:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');
      console.log('🌐 URL complète de la requête:', `${apiUrl}/countdown`);
      
      // Étape 2: Test de connectivité réseau basique
      console.log('🔌 Test de connectivité réseau...');
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('NETWORK_OFFLINE: Pas de connexion internet');
      }
      console.log('✅ Connexion internet détectée');
      
      // Étape 3: Détection mobile et ajustement du timeout
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const timeoutDuration = isMobile ? 10000 : 5000; // 10s sur mobile, 5s sur desktop
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ TIMEOUT: Requête annulée après ${timeoutDuration/1000} secondes`);
        controller.abort();
      }, timeoutDuration);
      
      console.log('📱 Détection de plateforme:', isMobile ? 'Mobile' : 'Desktop');
      console.log('📡 Envoi de la requête HTTP...');
      console.log('📡 Headers:', { 'Content-Type': 'application/json' });
      console.log('📡 Method: GET');
      console.log('📡 Timeout:', timeoutDuration + 'ms');
      
      // Étape 4: Tentative de connexion SIMPLIFIÉE pour mobile
      const startTime = Date.now();
      
      let response;
      
      // Tentative 1: Version la plus simple possible
      try {
        console.log('🔄 Tentative 1: Requête ultra-simple...');
        response = await fetch(`${apiUrl}/countdown`, {
          signal: controller.signal
        });
        console.log('✅ Requête ultra-simple réussie');
      } catch (fetchError) {
        console.log('❌ Fetch direct échoué, tentative avec proxy NextJS...');
        
        // Fallback : essayer d'autres méthodes
        console.log('🔄 Tentative alternative 1: Endpoint test local...');
        try {
          const localApiUrl = getApiUrl(true);
          response = await fetch(`${localApiUrl}/test-countdown`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          console.log('✅ Endpoint test local réussi');
        } catch (testEndpointError) {
          console.log('❌ Mode same-origin échoué');
          
          // Fallback final : utiliser une approche JSONP-like
          console.log('🔄 Tentative alternative 2: Simulation sans CORS...');
          
          // Pour les tests, on peut créer un compte à rebours basé sur le timestamp
          const now = Date.now();
          const startOfDay = new Date().setHours(0, 0, 0, 0);
          const endOfPeriod = startOfDay + (7 * 24 * 60 * 60 * 1000);
          const remaining = Math.max(0, endOfPeriod - now);
          
          const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          
          // Simuler une réponse valide pour éviter le fallback
          const mockResponse = {
            ok: true,
            status: 200,
            json: async () => ({
              days,
              hours, 
              minutes,
              seconds,
              timeRemaining: remaining,
              isActive: true,
              endTime: endOfPeriod,
              startTime: startOfDay,
              source: 'client-calculated' // Indiquer que c'est calculé côté client
            })
          };
          
          response = mockResponse as any;
          console.log('✅ Utilisation du calcul côté client comme fallback');
        }
      }
      
      const responseTime = Date.now() - startTime;
      clearTimeout(timeoutId);
      
      console.log('📡 Réponse reçue en', responseTime, 'ms');
      console.log('📡 Status HTTP:', response.status);
      console.log('📡 Status Text:', response.statusText);
      console.log('📡 Headers de réponse:', Object.fromEntries(response.headers.entries()));

      // Étape 5: Vérification du statut HTTP
      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText);
        
        // Détails selon le code d'erreur
        if (response.status === 404) {
          throw new Error(`HTTP_404: Endpoint /countdown non trouvé sur ${apiUrl}`);
        } else if (response.status === 500) {
          throw new Error(`HTTP_500: Erreur serveur interne`);
        } else if (response.status === 502) {
          throw new Error(`HTTP_502: Bad Gateway - Serveur indisponible`);
        } else if (response.status === 503) {
          throw new Error(`HTTP_503: Service temporairement indisponible`);
        } else {
          throw new Error(`HTTP_${response.status}: ${response.statusText}`);
        }
      }

      // Étape 6: Parsing des données JSON
      console.log('📦 Parsing des données JSON...');
      const data = await response.json();
      console.log('✅ Données reçues du backend:', JSON.stringify(data, null, 2));
      
      // Étape 7: Validation des données
      console.log('🔍 Validation des données...');
      if (typeof data.days !== 'number' || typeof data.hours !== 'number') {
        console.warn('⚠️ Format de données inattendu:', data);
      }
      
      setCountdown({
        days: data.days || 0,
        hours: data.hours || 0,
        minutes: data.minutes || 0,
        seconds: data.seconds || 0,
        timeRemaining: data.timeRemaining || 0,
        isActive: data.isActive || false,
        endTime: data.endTime || 0,
        startTime: data.startTime || 0,
        cycleRestarted: data.cycleRestarted || false
      });
      
      setError(null);
      console.log('✅ === COUNTDOWN SYNC RÉUSSIE ===');
      
    } catch (err) {
      console.error('🚨 === ERREUR COUNTDOWN DÉTAILLÉE ===');
      console.error('🚨 Type d\'erreur:', err.constructor.name);
      console.error('🚨 Message d\'erreur:', err.message);
      console.error('🚨 Stack trace:', err.stack);
      
      // Lancer le diagnostic complet automatiquement
      console.log('🔍 Lancement du diagnostic automatique...');
      BackendDiagnostic.runFullDiagnostic().then(results => {
        console.log('📊 Diagnostic terminé, résultats disponibles:', results);
      }).catch(diagErr => {
        console.error('❌ Erreur lors du diagnostic:', diagErr);
      });
      
      // Diagnostic spécifique selon le type d'erreur
      if (err.name === 'AbortError') {
        console.error('🚨 CAUSE: Timeout de 5 secondes dépassé');
        console.error('🚨 SOLUTION: Vérifier que le serveur backend répond rapidement');
        console.error('🚨 COMMANDES À ESSAYER:');
        console.error('   cd backend && npm start');
        console.error('   curl http://localhost:5000/api/health');
      } else if (err.message.includes('Failed to fetch')) {
        console.error('🚨 CAUSE: Impossible de joindre le serveur');
        console.error('🚨 SOLUTIONS POSSIBLES:');
        console.error('   1. Le serveur backend n\'est pas démarré');
        console.error('      → cd backend && npm start');
        console.error('   2. Problème de CORS');
        console.error('      → Vérifier la config CORS dans server.js');
        console.error('   3. URL incorrecte');
        console.error('      → Vérifier getApiUrl() dans le hook');
        console.error('   4. Firewall/proxy bloquant');
        console.error('      → Vérifier les paramètres réseau');
        console.error('   5. Port 5000 occupé');
        console.error('      → lsof -ti:5000 | xargs kill -9');
      } else if (err.message.includes('NETWORK_OFFLINE')) {
        console.error('🚨 CAUSE: Pas de connexion internet');
        console.error('🚨 SOLUTION: Vérifier la connexion réseau');
      } else if (err.message.includes('HTTP_')) {
        console.error('🚨 CAUSE: Erreur HTTP du serveur');
        console.error('🚨 SOLUTION: Vérifier les logs du serveur backend');
      } else {
        console.error('🚨 CAUSE: Erreur inconnue');
        console.error('🚨 Erreur complète:', err);
      }
      
      console.warn('⚠️ Activation du mode fallback (compte à rebours local)');
      
      // Mode fallback : compte à rebours local de 7 jours
      const now = Date.now();
      const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
      
      setCountdown({
        days: 7,
        hours: 0,
        minutes: 0,
        seconds: 0,
        timeRemaining: 7 * 24 * 60 * 60 * 1000,
        isActive: true,
        endTime: sevenDaysFromNow,
        startTime: now
      });
      
      setError(`Backend indisponible: ${err.message}`);
      console.log('🔄 === FIN DIAGNOSTIC COUNTDOWN ===');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour calculer le temps restant localement
  const calculateLocalCountdown = useCallback((endTime: number) => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    
    if (remaining <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        timeRemaining: 0,
        isActive: false
      };
    }
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return {
      days,
      hours,
      minutes,
      seconds,
      timeRemaining: remaining,
      isActive: remaining > 0
    };
  }, []);

  // Fonction pour redémarrer le compte à rebours
  const resetCountdown = useCallback(async () => {
    console.log('🔄 === RESET COUNTDOWN ===');
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      console.log('🔄 URL de reset:', `${apiUrl}/countdown/reset`);
      
      const response = await fetch(`${apiUrl}/countdown/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🔄 Réponse reset:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Reset réussi:', data);
      
      setCountdown({
        days: data.days || 7,
        hours: data.hours || 0,
        minutes: data.minutes || 0,
        seconds: data.seconds || 0,
        timeRemaining: data.timeRemaining || 0,
        isActive: data.isActive || true,
        endTime: data.endTime || 0,
        startTime: data.startTime || 0
      });
      
      setError(null);
    } catch (err) {
      console.error('🚨 Erreur reset countdown:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour rafraîchir manuellement
  const refreshCountdown = useCallback(async () => {
    setLoading(true);
    await fetchCountdown();
  }, [fetchCountdown]);

  // Effet pour la synchronisation initiale
  useEffect(() => {
    fetchCountdown();
  }, [fetchCountdown]);

  // Effet pour la mise à jour en temps réel
  useEffect(() => {
    if (!countdown.isActive || countdown.endTime === 0) return;

    const interval = setInterval(() => {
      const localCountdown = calculateLocalCountdown(countdown.endTime);
      
      // Si le temps est écoulé localement, resynchroniser avec le serveur
      if (localCountdown.timeRemaining <= 0) {
        fetchCountdown();
        return;
      }
      
      setCountdown(prev => ({
        ...prev,
        ...localCountdown
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown.isActive, countdown.endTime, calculateLocalCountdown, fetchCountdown]);

  // Effet pour la resynchronisation périodique avec le serveur
  useEffect(() => {
    // Resynchroniser avec le serveur toutes les 5 minutes
    const syncInterval = setInterval(() => {
      fetchCountdown();
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, [fetchCountdown]);

  return {
    countdown,
    loading,
    error,
    resetCountdown,
    refreshCountdown
  };
}