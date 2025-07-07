'use client';

import { useState } from 'react';

export default function TestEndpoints() {
  const [results, setResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testEndpoint = async (url: string, name: string) => {
    try {
      addLog(`🔄 Test ${name}: ${url}`);
      const response = await fetch(url);
      const status = response.status;
      
      if (response.ok) {
        const data = await response.json();
        addLog(`✅ ${name} SUCCESS (${status}): ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        const text = await response.text();
        addLog(`❌ ${name} FAILED (${status}): ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      addLog(`❌ ${name} ERROR: ${error.message}`);
    }
  };

  const runTests = async () => {
    setResults([]);
    
    const baseUrl = window.location.origin;
    
    // Test tous les endpoints possibles
    await testEndpoint(`${baseUrl}/api/countdown-proxy`, 'Countdown Proxy');
    await testEndpoint(`${baseUrl}/api/test-countdown`, 'Test Countdown');
    await testEndpoint(`${baseUrl}/api/chat`, 'Chat Endpoint');
    await testEndpoint(`${baseUrl}/api/verify`, 'Verify Endpoint');
    await testEndpoint('https://k-a-e-l-e-n.onrender.com/api/countdown', 'Direct Backend');
    await testEndpoint('https://k-a-e-l-e-n.onrender.com/api/health', 'Backend Health');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono mb-8 text-cyan-400">🧪 Test des Endpoints</h1>
        
        <button
          onClick={runTests}
          className="bg-cyan-900 hover:bg-cyan-800 px-6 py-3 rounded-lg font-mono mb-8"
        >
          🚀 Lancer tous les tests
        </button>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-mono mb-4 text-green-400">Résultats</h2>
          
          {results.length === 0 ? (
            <div className="text-gray-400 font-mono">
              Aucun test lancé. Cliquez sur "Lancer tous les tests".
            </div>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`${
                    result.includes('SUCCESS') ? 'text-green-400' :
                    result.includes('FAILED') || result.includes('ERROR') ? 'text-red-400' :
                    'text-yellow-400'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-900/20 border border-blue-400/30 p-4 rounded-lg">
          <h3 className="text-blue-400 font-mono mb-2">URLs testées:</h3>
          <ul className="text-sm text-gray-300 space-y-1 font-mono">
            <li>• {typeof window !== 'undefined' ? window.location.origin : 'N/A'}/api/countdown-proxy</li>
            <li>• {typeof window !== 'undefined' ? window.location.origin : 'N/A'}/api/test-countdown</li>
            <li>• https://k-a-e-l-e-n.onrender.com/api/countdown (backend direct)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}