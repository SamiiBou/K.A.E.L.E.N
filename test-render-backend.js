// Test direct du backend Render
const fetch = require('node-fetch');

async function testRenderBackend() {
  console.log('🔍 === TEST DU BACKEND RENDER ===\n');
  
  const baseUrl = 'https://k-a-e-l-e-n.onrender.com';
  
  console.log('🌐 URL de base:', baseUrl);
  
  try {
    // Test 1: Root endpoint
    console.log('\n1️⃣ Test du endpoint racine...');
    const rootResponse = await fetch(baseUrl, { timeout: 10000 });
    console.log('Status:', rootResponse.status);
    
    if (rootResponse.ok) {
      const rootData = await rootResponse.json();
      console.log('✅ Endpoint racine accessible');
      console.log('Données:', JSON.stringify(rootData, null, 2));
    } else {
      console.log('❌ Endpoint racine inaccessible');
    }
    
    // Test 2: Health check
    console.log('\n2️⃣ Test du health check...');
    const healthResponse = await fetch(`${baseUrl}/api/health`, { timeout: 10000 });
    console.log('Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check OK');
      console.log('Données:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('❌ Health check échoué');
      const errorText = await healthResponse.text();
      console.log('Erreur:', errorText);
    }
    
    // Test 3: Countdown endpoint
    console.log('\n3️⃣ Test du countdown endpoint...');
    const countdownResponse = await fetch(`${baseUrl}/api/countdown`, { 
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Status:', countdownResponse.status);
    
    if (countdownResponse.ok) {
      const countdownData = await countdownResponse.json();
      console.log('✅ Countdown endpoint OK');
      console.log('Données:', JSON.stringify(countdownData, null, 2));
    } else {
      console.log('❌ Countdown endpoint échoué');
      const errorText = await countdownResponse.text();
      console.log('Erreur:', errorText);
    }
    
    console.log('\n🎯 === RÉSUMÉ ===');
    console.log('Root endpoint:', rootResponse.ok ? '✅' : '❌');
    console.log('Health endpoint:', healthResponse.ok ? '✅' : '❌');
    console.log('Countdown endpoint:', countdownResponse.ok ? '✅' : '❌');
    
    if (!rootResponse.ok) {
      console.log('\n❌ PROBLÈME MAJEUR: Le serveur Render ne répond pas du tout');
      console.log('Solutions:');
      console.log('1. Vérifier que le service Render est démarré');
      console.log('2. Vérifier l\'URL de déploiement');
      console.log('3. Consulter les logs Render');
    } else if (!healthResponse.ok || !countdownResponse.ok) {
      console.log('\n⚠️ PROBLÈME PARTIEL: Le serveur répond mais certains endpoints ont des problèmes');
      console.log('Solutions:');
      console.log('1. Vérifier les routes dans server.js');
      console.log('2. Vérifier que countdownRoutes est bien importé');
      console.log('3. Consulter les logs du serveur');
    } else {
      console.log('\n🎉 TOUT FONCTIONNE! Le problème vient du frontend ou du CORS');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('🚨 CAUSE: DNS ne peut pas résoudre k-a-e-l-e-n.onrender.com');
      console.log('SOLUTION: Vérifier l\'URL de déploiement Render');
    } else if (error.message.includes('timeout')) {
      console.log('🚨 CAUSE: Timeout - Le serveur met trop de temps à répondre');
      console.log('SOLUTION: Le serveur Render peut être en mode "sleep" et prendre du temps à se réveiller');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🚨 CAUSE: Connexion refusée');
      console.log('SOLUTION: Le serveur Render n\'est pas démarré');
    }
  }
}

testRenderBackend();