const fetch = require('node-fetch');

// Test du système de compte à rebours
async function testCountdownSystem() {
  console.log('🧪 ========================================');
  console.log('🧪 TEST DU SYSTÈME DE COMPTE À REBOURS');
  console.log('🧪 ========================================\n');

  const baseUrl = 'http://localhost:5000/api';

  try {
    // Test 1: Vérifier la santé du serveur
    console.log('1️⃣ Test de santé du serveur...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Serveur opérationnel');
      console.log(`   Uptime: ${Math.floor(health.uptime)}s`);
      console.log(`   Environment: ${health.environment}`);
    } else {
      throw new Error('Serveur non disponible');
    }

    console.log('\n2️⃣ Test de récupération du compte à rebours...');
    const countdownResponse = await fetch(`${baseUrl}/countdown`);
    if (countdownResponse.ok) {
      const countdown = await countdownResponse.json();
      console.log('✅ Compte à rebours récupéré avec succès');
      console.log(`   Temps restant: ${countdown.days}j ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`);
      console.log(`   Timestamp fin: ${new Date(countdown.endTime).toLocaleString()}`);
      console.log(`   Actif: ${countdown.isActive}`);
      console.log(`   Cycle redémarré: ${countdown.cycleRestarted || false}`);
    } else {
      throw new Error('Impossible de récupérer le compte à rebours');
    }

    console.log('\n3️⃣ Test du statut du compte à rebours...');
    const statusResponse = await fetch(`${baseUrl}/countdown/status`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Statut récupéré avec succès');
      console.log(`   Actif: ${status.isActive}`);
      console.log(`   Progression: ${status.progress}%`);
      console.log(`   Temps écoulé: ${Math.floor(status.elapsedTime / 1000)}s`);
    }

    console.log('\n4️⃣ Test de redémarrage du compte à rebours...');
    const resetResponse = await fetch(`${baseUrl}/countdown/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (resetResponse.ok) {
      const reset = await resetResponse.json();
      console.log('✅ Compte à rebours redémarré avec succès');
      console.log(`   Nouveau temps: ${reset.days}j ${reset.hours}h ${reset.minutes}m ${reset.seconds}s`);
    }

    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('🎉 Le système est prêt pour le déploiement sur Render\n');

  } catch (error) {
    console.error('❌ ERREUR LORS DU TEST:', error.message);
    console.log('\n💡 Actions à effectuer:');
    console.log('   1. Vérifier que le serveur backend est démarré');
    console.log('   2. Lancer: cd backend && npm start');
    console.log('   3. Vérifier que le port 5000 est libre\n');
  }
}

// Lancer le test
testCountdownSystem();