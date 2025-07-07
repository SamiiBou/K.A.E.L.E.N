// Test rapide du backend
console.log('🔍 === TEST RAPIDE BACKEND ===\n');

// Check if backend is running on port 5000
const { spawn } = require('child_process');

// Function to test if port is in use
function testPort(port) {
  return new Promise((resolve) => {
    const lsof = spawn('lsof', ['-ti', `:${port}`]);
    let output = '';
    
    lsof.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    lsof.on('close', (code) => {
      if (output.trim()) {
        resolve({ inUse: true, pid: output.trim() });
      } else {
        resolve({ inUse: false, pid: null });
      }
    });
    
    lsof.on('error', () => {
      resolve({ inUse: false, pid: null });
    });
  });
}

// Function to test HTTP endpoint
async function testEndpoint(url) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, { 
      timeout: 3000,
      headers: { 'User-Agent': 'Backend-Test-Script' }
    });
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      data: response.ok ? await response.json() : null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runQuickTest() {
  console.log('1️⃣ Vérification du port 5000...');
  const portCheck = await testPort(5000);
  
  if (portCheck.inUse) {
    console.log(`✅ Port 5000 utilisé par le processus PID ${portCheck.pid}`);
  } else {
    console.log('❌ Port 5000 libre - Aucun serveur détecté');
    console.log('💡 Solution: cd backend && npm start');
    return;
  }
  
  console.log('\n2️⃣ Test de l\'endpoint /health...');
  const healthTest = await testEndpoint('http://localhost:5000/api/health');
  
  if (healthTest.success) {
    console.log(`✅ Health check réussi (${healthTest.status})`);
    console.log('📊 Données:', JSON.stringify(healthTest.data, null, 2));
  } else {
    console.log('❌ Health check échoué:', healthTest.error);
  }
  
  console.log('\n3️⃣ Test de l\'endpoint /countdown...');
  const countdownTest = await testEndpoint('http://localhost:5000/api/countdown');
  
  if (countdownTest.success) {
    console.log(`✅ Countdown API réussi (${countdownTest.status})`);
    console.log('📊 Données:', JSON.stringify(countdownTest.data, null, 2));
  } else {
    console.log('❌ Countdown API échoué:', countdownTest.error);
  }
  
  console.log('\n4️⃣ Test de l\'endpoint racine...');
  const rootTest = await testEndpoint('http://localhost:5000/');
  
  if (rootTest.success) {
    console.log(`✅ Endpoint racine réussi (${rootTest.status})`);
  } else {
    console.log('❌ Endpoint racine échoué:', rootTest.error);
  }
  
  console.log('\n🎯 === RÉSUMÉ ===');
  console.log('Port 5000:', portCheck.inUse ? '✅ Utilisé' : '❌ Libre');
  console.log('Health API:', healthTest.success ? '✅ OK' : '❌ KO');
  console.log('Countdown API:', countdownTest.success ? '✅ OK' : '❌ KO');
  console.log('Root endpoint:', rootTest.success ? '✅ OK' : '❌ KO');
  
  if (healthTest.success && countdownTest.success) {
    console.log('\n🎉 BACKEND COMPLÈTEMENT FONCTIONNEL !');
    console.log('Le problème vient probablement du frontend ou du CORS.');
  } else if (portCheck.inUse) {
    console.log('\n⚠️ BACKEND PARTIELLEMENT FONCTIONNEL');
    console.log('Le serveur tourne mais certains endpoints ont des problèmes.');
  } else {
    console.log('\n❌ BACKEND NON DÉMARRÉ');
    console.log('Démarrer avec: cd backend && npm start');
  }
}

runQuickTest().catch(console.error);