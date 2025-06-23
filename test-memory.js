// Test de la mémoire de K.A.E.L.E.N
// Pour tester : node test-memory.js

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';
const userId = 'test-user-' + Date.now();
const sessionId = 'session-' + Date.now();

async function testMemory() {
  console.log('🧪 Test du système de mémoire de K.A.E.L.E.N\n');
  
  // 1. Première conversation - donner des infos personnelles
  console.log('📝 ÉTAPE 1: Donner des informations personnelles...');
  const response1 = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: "Bonjour, je m'appelle Sami et j'habite à Paris. J'ai un chat qui s'appelle Mochi." }
      ],
      userId,
      sessionId,
      username: 'Sami'
    })
  });
  
  const data1 = await response1.json();
  console.log('🤖 K.A.E.L.E.N:', data1.message.substring(0, 100) + '...\n');
  
  // Attendre un peu pour que les données soient sauvegardées
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. Deuxième message - vérifier s'il se souvient
  console.log('📝 ÉTAPE 2: Demander s\'il se souvient...');
  const response2 = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: "Bonjour, je m'appelle Sami et j'habite à Paris. J'ai un chat qui s'appelle Mochi." },
        { role: 'assistant', content: data1.message },
        { role: 'user', content: "Est-ce que tu te souviens de mon nom et où j'habite?" }
      ],
      userId,
      sessionId
    })
  });
  
  const data2 = await response2.json();
  console.log('🤖 K.A.E.L.E.N:', data2.message.substring(0, 200) + '...\n');
  
  // 3. Vérifier le contexte mémoire
  console.log('📝 ÉTAPE 3: Vérifier le contexte mémoire stocké...');
  const memoryResponse = await fetch(`${API_URL}/users/${userId}/memory`);
  const memoryData = await memoryResponse.json();
  
  console.log('🧠 Contexte mémoire:');
  console.log(memoryData.memoryContext.substring(0, 500) + '...\n');
  
  console.log('✅ Test terminé! Vérifiez que K.A.E.L.E.N a bien mentionné:');
  console.log('   - Votre nom (Sami)');
  console.log('   - Votre ville (Paris)');
  console.log('   - Votre chat (Mochi)');
}

testMemory().catch(console.error); 