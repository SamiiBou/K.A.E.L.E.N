// Outil de diagnostic pour le backend
export class BackendDiagnostic {
  
  static async runFullDiagnostic() {
    console.log('🔍 === DIAGNOSTIC COMPLET DU BACKEND ===\n');
    
    const results = {
      environment: this.checkEnvironment(),
      network: await this.checkNetworkConnectivity(),
      backend: await this.checkBackendAvailability(),
      endpoints: await this.checkSpecificEndpoints(),
      cors: await this.checkCorsConfiguration()
    };
    
    console.log('\n📊 === RÉSUMÉ DIAGNOSTIC ===');
    console.log('Environment:', results.environment.status);
    console.log('Network:', results.network.status);
    console.log('Backend:', results.backend.status);
    console.log('Endpoints:', results.endpoints.status);
    console.log('CORS:', results.cors.status);
    
    return results;
  }
  
  static checkEnvironment() {
    console.log('1️⃣ Vérification de l\'environnement...');
    
    const info = {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
      port: typeof window !== 'undefined' ? window.location.port : 'N/A',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      onLine: typeof navigator !== 'undefined' ? navigator.onLine : 'N/A'
    };
    
    console.log('Environment info:', info);
    
    // Déterminer l'URL backend attendue
    let expectedBackendUrl = 'http://localhost:5000/api';
    if (info.hostname.includes('onrender.com')) {
      expectedBackendUrl = 'https://k-a-e-l-e-n.onrender.com/api';
    } else if (info.hostname.includes('vercel.app')) {
      expectedBackendUrl = 'https://k-a-e-l-e-n.onrender.com/api'; // Backend sur Render même si frontend sur Vercel
    }
    
    console.log('URL backend attendue:', expectedBackendUrl);
    
    return {
      status: 'success',
      info,
      expectedBackendUrl
    };
  }
  
  static async checkNetworkConnectivity() {
    console.log('\n2️⃣ Test de connectivité réseau...');
    
    try {
      // Test avec un service externe fiable
      const testUrls = [
        'https://httpbin.org/get',
        'https://jsonplaceholder.typicode.com/posts/1',
        'https://api.github.com'
      ];
      
      for (const url of testUrls) {
        try {
          console.log(`Testing connectivity to: ${url}`);
          const response = await fetch(url, { 
            method: 'GET', 
            mode: 'cors',
            signal: AbortSignal.timeout(3000)
          });
          
          if (response.ok) {
            console.log('✅ Connectivité réseau OK');
            return {
              status: 'success',
              message: 'Connexion internet disponible',
              testedUrl: url
            };
          }
        } catch (err) {
          console.log(`❌ Échec pour ${url}:`, err.message);
        }
      }
      
      throw new Error('Aucun service externe accessible');
      
    } catch (error) {
      console.log('❌ Problème de connectivité réseau');
      return {
        status: 'error',
        message: error.message || 'Connectivité réseau impossible'
      };
    }
  }
  
  static async checkBackendAvailability() {
    console.log('\n3️⃣ Test de disponibilité du backend...');
    
    const getApiUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('onrender.com')) {
          return 'https://k-a-e-l-e-n.onrender.com/api';
        }
        return 'http://localhost:5000/api';
      }
      return 'http://localhost:5000/api';
    };
    
    const apiUrl = getApiUrl();
    console.log('URL de test:', apiUrl);
    
    try {
      // Test du endpoint de santé
      const healthResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      console.log('Status de /health:', healthResponse.status);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Backend disponible');
        console.log('Health data:', healthData);
        
        return {
          status: 'success',
          message: 'Backend accessible',
          healthData,
          url: apiUrl
        };
      } else {
        throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
      }
      
    } catch (error) {
      console.log('❌ Backend indisponible');
      console.log('Erreur:', error.message);
      
      // Tests additionnels selon le type d'erreur
      if (error.name === 'AbortError') {
        console.log('⏰ Timeout - Le serveur met trop de temps à répondre');
      } else if (error.message.includes('Failed to fetch')) {
        console.log('🔌 Impossible de joindre le serveur');
        console.log('Causes possibles:');
        console.log('  - Serveur backend non démarré');
        console.log('  - Port 5000 non accessible');
        console.log('  - Problème de CORS');
        console.log('  - Firewall/proxy');
      }
      
      return {
        status: 'error',
        message: error.message || 'Backend inaccessible',
        url: apiUrl
      };
    }
  }
  
  static async checkSpecificEndpoints() {
    console.log('\n4️⃣ Test des endpoints spécifiques...');
    
    const getApiUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('onrender.com')) {
          return 'https://k-a-e-l-e-n.onrender.com/api';
        }
        return 'http://localhost:5000/api';
      }
      return 'http://localhost:5000/api';
    };
    
    const apiUrl = getApiUrl();
    const endpoints = [
      '/countdown',
      '/countdown/status',
      '/echo-balance',
      '/users'
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint}...`);
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000)
        });
        
        results[endpoint] = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
        
        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
        
      } catch (error) {
        results[endpoint] = {
          status: 'error',
          ok: false,
          error: error.message
        };
        console.log(`${endpoint}: ERROR - ${error.message}`);
      }
    }
    
    const allWorking = Object.values(results).every(r => r.ok);
    
    return {
      status: allWorking ? 'success' : 'partial',
      results,
      message: allWorking ? 'Tous les endpoints fonctionnent' : 'Certains endpoints ont des problèmes'
    };
  }
  
  static async checkCorsConfiguration() {
    console.log('\n5️⃣ Test de la configuration CORS...');
    
    const getApiUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('onrender.com')) {
          return 'https://k-a-e-l-e-n.onrender.com/api';
        }
        return 'http://localhost:5000/api';
      }
      return 'http://localhost:5000/api';
    };
    
    const apiUrl = getApiUrl();
    
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'OPTIONS', // Preflight request
        headers: {
          'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
      };
      
      console.log('CORS Headers:', corsHeaders);
      
      return {
        status: 'success',
        corsHeaders,
        message: 'Configuration CORS vérifiée'
      };
      
    } catch (error) {
      console.log('❌ Problème CORS détecté');
      return {
        status: 'error',
        message: error.message || 'Erreur CORS'
      };
    }
  }
}

// Fonction utilitaire pour lancer le diagnostic depuis la console
if (typeof window !== 'undefined') {
  (window as any).runBackendDiagnostic = () => BackendDiagnostic.runFullDiagnostic();
  console.log('💡 Pour lancer un diagnostic complet, tapez: runBackendDiagnostic()');
}