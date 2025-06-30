import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface TranslationFunction {
  (key: string, options?: any): string;
}

interface UseTranslationReturn {
  t: TranslationFunction;
  locale: string;
  changeLanguage: (lng: string) => void;
}

// Cache pour stocker les traductions chargées
const translationCache: Record<string, any> = {};

export function useTranslation(namespace: string = 'common'): UseTranslationReturn {
  const router = useRouter();
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState<any>({});

  // Déterminer la langue actuelle
  useEffect(() => {
    // Vérifier d'abord localStorage
    const storedLang = localStorage.getItem('preferred-language');
    
    // Si aucune langue n'est stockée, utiliser l'anglais par défaut
    if (!storedLang) {
      setLocale('en');
      return;
    }
    
    // Ensuite vérifier l'URL
    const pathLang = window.location.pathname.split('/')[1];
    const validLangs = ['en', 'es', 'id', 'th'];
    
    const currentLang = storedLang || (validLangs.includes(pathLang) ? pathLang : 'en');
    setLocale(currentLang);
  }, []);

  // Charger les traductions
  useEffect(() => {
    const loadTranslations = async () => {
      const cacheKey = `${locale}-${namespace}`;
      
      // Vérifier le cache d'abord
      if (translationCache[cacheKey]) {
        setTranslations(translationCache[cacheKey]);
        return;
      }

      try {
        const response = await fetch(`/locales/${locale}/${namespace}.json`);
        if (response.ok) {
          const data = await response.json();
          translationCache[cacheKey] = data;
          setTranslations(data);
        }
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };

    loadTranslations();
  }, [locale, namespace]);

  // Fonction de traduction
  const t: TranslationFunction = useCallback((key: string, options?: any) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        return key; // Retourner la clé si la traduction n'est pas trouvée
      }
    }

    // Simple remplacement de variables
    if (options && typeof value === 'string') {
      Object.keys(options).forEach(opt => {
        value = value.replace(`{{${opt}}}`, options[opt]);
      });
    }

    return value || key;
  }, [translations]);

  // Fonction pour changer de langue
  const changeLanguage = useCallback((lng: string) => {
    localStorage.setItem('preferred-language', lng);
    setLocale(lng);
    
    // Recharger la page avec la nouvelle langue
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    
    // Si l'URL contient déjà une langue, la remplacer
    if (['en', 'es', 'id', 'th'].includes(pathParts[1])) {
      pathParts[1] = lng;
    } else {
      // Sinon, l'ajouter
      pathParts.splice(1, 0, lng);
    }
    
    const newPath = pathParts.join('/');
    window.location.href = newPath;
  }, []);

  return { t, locale, changeLanguage };
} 