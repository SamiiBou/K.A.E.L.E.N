'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, data: any, error?: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testApi = async () => {
    setIsLoading(true);
    setResults([]);
    
    const apiUrl = 'https://k-a-e-l-e-n.onrender.com/api';
    
    // Test 1: Health check
    try {
      console.log('🔍 Test Health endpoint...');
      const healthResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        addResult('Health Check', true, healthData);
      } else {
        addResult('Health Check', false, null, `HTTP ${healthResponse.status}`);
      }
    } catch (error) {
      addResult('Health Check', false, null, error.message);
    }
    
    // Test 2: Countdown endpoint
    try {
      console.log('🔍 Test Countdown endpoint...');
      const countdownResponse = await fetch(`${apiUrl}/countdown`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (countdownResponse.ok) {
        const countdownData = await countdownResponse.json();
        addResult('Countdown API', true, countdownData);
      } else {
        addResult('Countdown API', false, null, `HTTP ${countdownResponse.status}`);
      }
    } catch (error) {
      addResult('Countdown API', false, null, error.message);
    }
    
    // Test 3: Root endpoint
    try {
      console.log('🔍 Test Root endpoint...');
      const rootResponse = await fetch('https://k-a-e-l-e-n.onrender.com/', {
        method: 'GET',
        mode: 'cors'
      });
      
      if (rootResponse.ok) {
        const rootData = await rootResponse.json();
        addResult('Root Endpoint', true, rootData);
      } else {
        addResult('Root Endpoint', false, null, `HTTP ${rootResponse.status}`);
      }
    } catch (error) {
      addResult('Root Endpoint', false, null, error.message);
    }
    
    setIsLoading(false);
  };

  const testCors = async () => {
    try {
      console.log('🔍 Test CORS avec OPTIONS...');
      const response = await fetch('https://k-a-e-l-e-n.onrender.com/api/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      
      addResult('CORS Preflight', response.ok, corsHeaders);
    } catch (error) {
      addResult('CORS Preflight', false, null, error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono mb-8 text-cyan-400">🔍 Test de l'API Backend</h1>
        
        <div className="space-y-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-mono mb-4 text-yellow-400">Informations</h2>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div><span className="text-cyan-400">URL Frontend:</span> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</div>
              <div><span className="text-cyan-400">URL Backend:</span> https://k-a-e-l-e-n.onrender.com/api</div>
              <div><span className="text-cyan-400">User Agent:</span> {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'N/A'}</div>
              <div><span className="text-cyan-400">Online:</span> {typeof navigator !== 'undefined' ? (navigator.onLine ? '✅' : '❌') : 'N/A'}</div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testApi}
              disabled={isLoading}
              className="bg-cyan-900 hover:bg-cyan-800 disabled:opacity-50 px-6 py-3 rounded-lg font-mono"
            >
              {isLoading ? '🔄 Test en cours...' : '🚀 Tester l\'API'}
            </button>
            
            <button
              onClick={testCors}
              disabled={isLoading}
              className="bg-yellow-900 hover:bg-yellow-800 disabled:opacity-50 px-6 py-3 rounded-lg font-mono"
            >
              🌐 Tester CORS
            </button>
            
            <button
              onClick={() => setResults([])}
              className="bg-red-900 hover:bg-red-800 px-6 py-3 rounded-lg font-mono"
            >
              🗑️ Vider
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-mono text-green-400">Résultats des Tests</h2>
          
          {results.length === 0 ? (
            <div className="bg-gray-800 p-4 rounded-lg text-gray-400 font-mono">
              Aucun test effectué. Cliquez sur "Tester l'API" pour commencer.
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  result.success 
                    ? 'bg-green-900/20 border-green-400' 
                    : 'bg-red-900/20 border-red-400'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-mono text-lg ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? '✅' : '❌'} {result.test}
                  </h3>
                  <span className="text-gray-400 text-sm font-mono">{result.timestamp}</span>
                </div>
                
                {result.error && (
                  <div className="bg-red-900/30 p-3 rounded mb-2">
                    <div className="text-red-300 font-mono text-sm">
                      <strong>Erreur:</strong> {result.error}
                    </div>
                  </div>
                )}
                
                {result.data && (
                  <div className="bg-gray-800 p-3 rounded">
                    <pre className="text-gray-300 text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 bg-blue-900/20 border border-blue-400/30 p-4 rounded-lg">
          <h3 className="text-blue-400 font-mono mb-2">💡 Solutions Communes</h3>
          <ul className="text-sm text-gray-300 space-y-1 font-mono">
            <li><strong>Load failed / CORS:</strong> Le backend Render peut être en mode sleep</li>
            <li><strong>Network error:</strong> Problème de connectivité ou firewall</li>
            <li><strong>HTTP 404:</strong> Route /countdown non configurée dans le backend</li>
            <li><strong>HTTP 502/503:</strong> Backend Render indisponible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}