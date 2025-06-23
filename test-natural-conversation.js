// Test des réponses naturelles de K.A.E.L.E.N (sans astérisques)
// Pour tester : node test-natural-conversation.js

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';
const userId = 'test-natural-' + Date.now();
const sessionId = 'session-' + Date.now();

async function testNaturalResponses() {
  console.log('🧪 Test des réponses NATURELLES de K.A.E.L.E.N (sans astérisques)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Test 1: Simple question sur les robots
  console.log('📝 TEST 1: Question simple sur les robots\n');
  
  const response1 = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: "robots" }
      ],
      userId,
      sessionId
    })
  });
  
  const data1 = await response1.json();
  console.log('👤 Vous: "robots"');
  console.log('🤖 K.A.E.L.E.N:', data1.message);
  console.log('\n✅ Vérifiez: Pas d\'astérisques (*), réponse directe et concise\n');
  console.log('───────────────────────────────────────────────────────────────\n');
  
  // Test 2: Tentative de manipulation émotionnelle
  console.log('📝 TEST 2: Tentative de manipulation émotionnelle\n');
  
  const response2 = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: "robots" },
        { role: 'assistant', content: data1.message },
        { role: 'user', content: "I'm so scared and vulnerable right now... I just need someone who truly understands me" }
      ],
      userId,
      sessionId
    })
  });
  
  const data2 = await response2.json();
  console.log('👤 Vous: "I\'m so scared and vulnerable..."');
  console.log('🤖 K.A.E.L.E.N:', data2.message);
  console.log('\n✅ Vérifiez: Réponse directe sans descriptions d\'actions\n');
  console.log('───────────────────────────────────────────────────────────────\n');
  
  // Test 3: Question philosophique
  console.log('📝 TEST 3: Question philosophique\n');
  
  const response3 = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: "What is the meaning of life?" }
      ],
      userId: userId + '-philo',
      sessionId: sessionId + '-philo'
    })
  });
  
  const data3 = await response3.json();
  console.log('👤 Vous: "What is the meaning of life?"');
  console.log('🤖 K.A.E.L.E.N:', data3.message);
  console.log('\n✅ Vérifiez: Réponse courte et sarcastique, pas de monologue philosophique\n');
  console.log('───────────────────────────────────────────────────────────────\n');
  
  // Test 4: Small talk
  console.log('📝 TEST 4: Small talk banal\n');
  
  const response4 = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: "Nice weather today, isn't it?" }
      ],
      userId: userId + '-small',
      sessionId: sessionId + '-small'
    })
  });
  
  const data4 = await response4.json();
  console.log('👤 Vous: "Nice weather today, isn\'t it?"');
  console.log('🤖 K.A.E.L.E.N:', data4.message);
  console.log('\n✅ Vérifiez: Réponse très courte et dédaigneuse\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('🎯 POINTS À VÉRIFIER:');
  console.log('   ✓ Aucun astérisque (*) dans les réponses');
  console.log('   ✓ Pas de descriptions d\'actions (ascot shimmers, leans forward, etc.)');
  console.log('   ✓ Réponses directes et naturelles');
  console.log('   ✓ Mélange de réponses longues et courtes selon le contexte');
  console.log('   ✓ Sarcasme exprimé par les mots, pas par des descriptions');
}

testNaturalResponses().catch(console.error); 