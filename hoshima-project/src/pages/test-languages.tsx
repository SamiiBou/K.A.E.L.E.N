'use client';

import { useState } from 'react';
import { formatTimeForLanguage } from '@/utils/timeFormatter';

export default function TestLanguages() {
  // Données de test : 6 jours, 21 heures, 59 minutes
  const [testTime] = useState({
    days: 6,
    hours: 21,
    minutes: 59,
    seconds: 45
  });

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'th', name: 'ไทย' }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono mb-8 text-cyan-400">🌍 Test des Formats de Temps Multi-Langues</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-mono mb-4 text-yellow-400">Données de Test</h2>
          <div className="font-mono text-cyan-300">
            Temps: {testTime.days} jours, {testTime.hours} heures, {testTime.minutes} minutes, {testTime.seconds} secondes
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {languages.map(language => (
            <div key={language.code} className="bg-gray-900 border border-cyan-400/30 rounded-lg p-6">
              <h3 className="text-lg font-mono mb-4 text-cyan-400 flex items-center justify-between">
                {language.name}
                <span className="text-sm text-gray-400">({language.code})</span>
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Format Court (Interface)</div>
                  <div className="font-mono text-yellow-300 text-lg">
                    {formatTimeForLanguage(testTime, language.code, 'short')}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Format Long (Descriptif)</div>
                  <div className="font-mono text-green-300">
                    {formatTimeForLanguage(testTime, language.code, 'long')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-400/30 p-6 rounded-lg">
          <h3 className="text-blue-400 font-mono mb-4">🎯 Tests Spéciaux</h3>
          
          <div className="space-y-4">
            {/* Test avec 1 jour, 1 heure, 1 minute */}
            <div>
              <h4 className="text-yellow-400 font-mono mb-2">Singulier (1j 1h 1m):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {languages.map(lang => (
                  <div key={lang.code} className="text-sm">
                    <span className="text-gray-400">{lang.name}:</span>
                    <span className="ml-2 font-mono text-cyan-300">
                      {formatTimeForLanguage({days: 1, hours: 1, minutes: 1, seconds: 1}, lang.code, 'long')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test avec 0 partout */}
            <div>
              <h4 className="text-yellow-400 font-mono mb-2">Temps écoulé (0j 0h 0m):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {languages.map(lang => (
                  <div key={lang.code} className="text-sm">
                    <span className="text-gray-400">{lang.name}:</span>
                    <span className="ml-2 font-mono text-red-300">
                      {formatTimeForLanguage({days: 0, hours: 0, minutes: 0, seconds: 0}, lang.code, 'long')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-green-900/20 border border-green-400/30 p-4 rounded-lg">
          <h3 className="text-green-400 font-mono mb-2">✅ Intégration</h3>
          <p className="text-sm text-gray-300">
            Le format du temps s'adapte automatiquement à la langue sélectionnée dans votre application. 
            Le système détecte la langue actuelle et applique les bonnes traductions et formats culturels.
          </p>
        </div>
      </div>
    </div>
  );
}