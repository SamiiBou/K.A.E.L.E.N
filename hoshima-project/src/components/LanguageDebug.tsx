'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';

export default function LanguageDebug() {
  const { t, locale } = useTranslation();
  const [storedLang, setStoredLang] = useState<string | null>(null);
  const [languageSelected, setLanguageSelected] = useState<string | null>(null);

  useEffect(() => {
    setStoredLang(localStorage.getItem('preferred-language'));
    setLanguageSelected(localStorage.getItem('language-selected'));
  }, []);

  return (
    <div className="fixed bottom-20 right-6 bg-black/80 backdrop-blur-md border border-cyan-500/30 
                    text-cyan-400 rounded p-4 font-mono text-xs max-w-sm z-50">
      <h3 className="text-sm mb-2 text-cyan-300">🔍 Language Debug</h3>
      <div className="space-y-1">
        <div>Current locale: <span className="text-white">{locale}</span></div>
        <div>Stored language: <span className="text-white">{storedLang || 'none'}</span></div>
        <div>Language selected: <span className="text-white">{languageSelected || 'false'}</span></div>
        <div className="mt-2 pt-2 border-t border-cyan-500/20">
          <div>Test translations:</div>
          <div className="ml-2 text-white">
            <div>• {t('game.title')}</div>
            <div>• {t('intro.line1').substring(0, 30)}...</div>
          </div>
        </div>
      </div>
    </div>
  );
} 