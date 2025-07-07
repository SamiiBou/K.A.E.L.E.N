'use client';

import { useState } from 'react';
import { BackendDiagnostic } from '@/utils/backendDiagnostic';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DebugPanel({ isVisible, onClose }: DebugPanelProps) {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const results = await BackendDiagnostic.runFullDiagnostic();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Erreur diagnostic:', error);
      setDiagnosticResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const testEndpoint = async (endpoint: string) => {
    const apiUrl = window.location.hostname.includes('onrender.com') 
      ? 'https://k-a-e-l-e-n.onrender.com/api'
      : 'http://localhost:5000/api';

    try {
      const response = await fetch(`${apiUrl}${endpoint}`);
      console.log(`Test ${endpoint}:`, response.status, await response.text());
    } catch (error) {
      console.error(`Erreur ${endpoint}:`, error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-cyan-400/30 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-400/30 p-4 flex items-center justify-between">
          <h2 className="text-white font-mono text-lg">🔍 Panneau de Diagnostic Backend</h2>
          <button 
            onClick={onClose}
            className="text-cyan-400 hover:text-white text-xl font-mono"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Actions rapides */}
          <div className="space-y-3">
            <h3 className="text-cyan-400 font-mono text-md mb-3">Actions Rapides</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={runDiagnostic}
                disabled={isRunning}
                className="bg-cyan-900/30 border border-cyan-400/50 text-cyan-100 px-4 py-2 rounded-lg font-mono text-sm hover:bg-cyan-800/30 disabled:opacity-50"
              >
                {isRunning ? '🔄 Diagnostic...' : '🔍 Diagnostic Complet'}
              </button>

              <button
                onClick={() => testEndpoint('/health')}
                className="bg-green-900/30 border border-green-400/50 text-green-100 px-4 py-2 rounded-lg font-mono text-sm hover:bg-green-800/30"
              >
                🏥 Test Health
              </button>

              <button
                onClick={() => testEndpoint('/countdown')}
                className="bg-yellow-900/30 border border-yellow-400/50 text-yellow-100 px-4 py-2 rounded-lg font-mono text-sm hover:bg-yellow-800/30"
              >
                ⏰ Test Countdown
              </button>

              <button
                onClick={() => {
                  const apiUrl = window.location.hostname.includes('onrender.com') 
                    ? 'https://k-a-e-l-e-n.onrender.com/api'
                    : 'http://localhost:5000/api';
                  window.open(apiUrl + '/health', '_blank');
                }}
                className="bg-blue-900/30 border border-blue-400/50 text-blue-100 px-4 py-2 rounded-lg font-mono text-sm hover:bg-blue-800/30"
              >
                🌐 Ouvrir API
              </button>
            </div>
          </div>

          {/* Informations système */}
          <div className="space-y-3">
            <h3 className="text-cyan-400 font-mono text-md mb-3">Informations Système</h3>
            <div className="bg-black/40 border border-gray-600 rounded-lg p-4 font-mono text-sm">
              <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div><span className="text-cyan-400">Hostname:</span> {window.location.hostname}</div>
                <div><span className="text-cyan-400">Port:</span> {window.location.port || '80/443'}</div>
                <div><span className="text-cyan-400">Protocol:</span> {window.location.protocol}</div>
                <div><span className="text-cyan-400">User Agent:</span> {navigator.userAgent.split(' ')[0]}</div>
                <div><span className="text-cyan-400">Online:</span> {navigator.onLine ? '✅' : '❌'}</div>
                <div><span className="text-cyan-400">API URL:</span> {
                  window.location.hostname.includes('onrender.com') 
                    ? 'https://k-a-e-l-e-n.onrender.com/api'
                    : 'http://localhost:5000/api'
                }</div>
              </div>
            </div>
          </div>

          {/* Commandes utiles */}
          <div className="space-y-3">
            <h3 className="text-cyan-400 font-mono text-md mb-3">Commandes Utiles</h3>
            <div className="bg-black/40 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-2">
              <div><span className="text-green-400">Démarrer backend:</span> cd backend && npm start</div>
              <div><span className="text-green-400">Tuer processus port 5000:</span> lsof -ti:5000 | xargs kill -9</div>
              <div><span className="text-green-400">Test curl health:</span> curl http://localhost:5000/api/health</div>
              <div><span className="text-green-400">Test curl countdown:</span> curl http://localhost:5000/api/countdown</div>
              <div><span className="text-green-400">Logs backend:</span> tail -f backend/logs/app.log</div>
            </div>
          </div>

          {/* Résultats du diagnostic */}
          {diagnosticResults && (
            <div className="space-y-3">
              <h3 className="text-cyan-400 font-mono text-md mb-3">Résultats du Diagnostic</h3>
              <div className="bg-black/40 border border-gray-600 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-auto max-h-64">
                <pre>{JSON.stringify(diagnosticResults, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Console logs */}
          <div className="space-y-3">
            <h3 className="text-cyan-400 font-mono text-md mb-3">Instructions</h3>
            <div className="bg-black/40 border border-gray-600 rounded-lg p-4 text-sm text-gray-300">
              <p className="mb-2">1. Ouvrez la console du navigateur (F12) pour voir les logs détaillés</p>
              <p className="mb-2">2. Les logs commencent par 🔍 === DÉBUT DIAGNOSTIC COUNTDOWN ===</p>
              <p className="mb-2">3. Recherchez les erreurs marquées 🚨</p>
              <p>4. Suivez les solutions proposées dans les logs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}