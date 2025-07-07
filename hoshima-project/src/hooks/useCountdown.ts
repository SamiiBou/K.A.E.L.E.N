'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // En production sur Render
      if (hostname.includes('onrender.com')) {
        return 'https://k-a-e-l-e-n.onrender.com/api';
      }
      
      // En développement local
      return 'http://localhost:5000/api';
    }
    
    // Fallback pour le SSR
    return 'http://localhost:5000/api';
  };

  // Fonction pour récupérer les données du compte à rebours
  const fetchCountdown = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/countdown`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
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
    } catch (err) {
      console.error('Erreur lors de la récupération du compte à rebours:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
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
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/countdown/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
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
      console.error('Erreur lors du redémarrage du compte à rebours:', err);
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