// Service pour gérer le compte à rebours avec fallback
export class CountdownService {
  private static instance: CountdownService;
  private apiUrl: string;

  constructor() {
    this.apiUrl = this.getApiUrl();
  }

  static getInstance(): CountdownService {
    if (!CountdownService.instance) {
      CountdownService.instance = new CountdownService();
    }
    return CountdownService.instance;
  }

  private getApiUrl(): string {
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
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getCountdown(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.apiUrl}/countdown`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async resetCountdown(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/countdown/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Calcul local du compte à rebours
  calculateLocalCountdown(endTime: number) {
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
  }

  // Créer un compte à rebours de fallback (7 jours à partir de maintenant)
  createFallbackCountdown() {
    const now = Date.now();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    
    return {
      days: 7,
      hours: 0,
      minutes: 0,
      seconds: 0,
      timeRemaining: 7 * 24 * 60 * 60 * 1000,
      isActive: true,
      endTime: sevenDaysFromNow,
      startTime: now,
      isFallback: true
    };
  }
}