'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface TranslationFunction {
  (key: string, options?: any): string;
}

interface LanguageContextType {
  locale: string;
  t: TranslationFunction;
  changeLanguage: (lng: string) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cache global pour les traductions
const translationCache: Record<string, any> = {};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<string>('en');
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialisation et écoute des changements de localStorage
  useEffect(() => {
    const initializeLanguage = () => {
      const storedLang = localStorage.getItem('preferred-language');
      if (storedLang && ['en', 'es', 'id', 'th', 'fr'].includes(storedLang)) {
        console.log('🌍 [LanguageContext] Initializing with language:', storedLang);
        setLocale(storedLang);
      } else {
        console.log('🌍 [LanguageContext] No stored language, using default: en');
        setLocale('en');
      }
    };

    // Initialiser au montage
    initializeLanguage();

    // Écouter les changements de localStorage (pour synchroniser entre onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'preferred-language' && e.newValue) {
        console.log('🌍 [LanguageContext] Language changed via storage:', e.newValue);
        setLocale(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Écouter les changements custom (dans le même onglet)
    const handleLanguageChange = (e: CustomEvent) => {
      console.log('🌍 [LanguageContext] Language changed via custom event:', e.detail);
      setLocale(e.detail);
    };
    
    window.addEventListener('languageChanged', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  // Charger les traductions quand la locale change
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      const cacheKey = `${locale}-common`;
      
      // Vérifier le cache
      if (translationCache[cacheKey]) {
        console.log('🌍 [LanguageContext] Using cached translations for:', locale);
        setTranslations(translationCache[cacheKey]);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🌍 [LanguageContext] Loading translations for:', locale);
        const response = await fetch(`/locales/${locale}/common.json`);
        if (response.ok) {
          const data = await response.json();
          translationCache[cacheKey] = data;
          setTranslations(data);
          console.log('🌍 [LanguageContext] Translations loaded successfully');
        } else {
          console.error('🌍 [LanguageContext] Failed to load translations:', response.status);
        }
      } catch (error) {
        console.error('🌍 [LanguageContext] Error loading translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [locale]);

  // Fonction de traduction
  const t: TranslationFunction = useCallback((key: string, options?: any) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`🌍 [LanguageContext] Translation missing for key: ${key}`);
        return key;
      }
    }

    // Remplacement de variables
    if (options && typeof value === 'string') {
      Object.keys(options).forEach(opt => {
        value = value.replace(new RegExp(`{{${opt}}}`, 'g'), options[opt]);
      });
    }

    return value || key;
  }, [translations]);

  // Fonction pour changer de langue
  const changeLanguage = useCallback((lng: string) => {
    console.log('🌍 [LanguageContext] Changing language to:', lng);
    localStorage.setItem('preferred-language', lng);
    setLocale(lng);
    
    // Émettre un événement custom pour synchroniser dans le même onglet
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lng }));
  }, []);

  const value: LanguageContextType = {
    locale,
    t,
    changeLanguage,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 