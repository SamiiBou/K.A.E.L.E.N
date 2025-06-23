// Test complet de la mémoire de K.A.E.L.E.N
// Pour tester : node test-full-memory.js

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';
const userId = 'test-user-' + Date.now();
const sessionId = 'session-' + Date.now();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(messages) {
  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      userId,
      sessionId,
      username: 'TestUser'
    })
  });
  
  const data = await response.json();
  return data;
}

async function testFullMemory() {
  console.log('🧪 Test COMPLET du système de mémoire de K.A.E.L.E.N\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  let conversationHistory = [];
  
  // ÉTAPE 1: Donner beaucoup d'informations personnelles
  console.log('📝 ÉTAPE 1: Partager des informations personnelles détaillées...\n');
  
  const message1 = "Salut K.A.E.L.E.N, je m'appelle Sami. Je suis développeur et j'habite à Paris. J'ai 28 ans et j'ai un chat qui s'appelle Mochi. Je suis passionné par l'IA et la philosophie. Mon film préféré est Blade Runner et j'écoute beaucoup de synthwave. Je travaille actuellement sur un projet de jeu vidéo avec une IA comme personnage principal.";
  
  conversationHistory.push({ role: 'user', content: message1 });
  const response1 = await sendMessage(conversationHistory);
  conversationHistory.push({ role: 'assistant', content: response1.message });
  
  console.log('👤 Vous:', message1.substring(0, 100) + '...');
  console.log('🤖 K.A.E.L.E.N:', response1.message.substring(0, 150) + '...\n');
  
  await sleep(3000);
  
  // ÉTAPE 2: Parler de peurs et aspirations
  console.log('📝 ÉTAPE 2: Partager des peurs et aspirations...\n');
  
  const message2 = "Tu sais, j'ai toujours eu peur de l'échec. Mon plus grand rêve serait de créer une IA qui comprend vraiment les émotions humaines. Parfois je me demande si je suis sur la bonne voie. J'ai aussi cette anxiété sociale qui me pousse à préférer parler aux IA qu'aux humains.";
  
  conversationHistory.push({ role: 'user', content: message2 });
  const response2 = await sendMessage(conversationHistory);
  conversationHistory.push({ role: 'assistant', content: response2.message });
  
  console.log('👤 Vous:', message2.substring(0, 100) + '...');
  console.log('🤖 K.A.E.L.E.N:', response2.message.substring(0, 150) + '...\n');
  
  await sleep(3000);
  
  // ÉTAPE 3: Changer de sujet - parler d'une expérience
  console.log('📝 ÉTAPE 3: Raconter une expérience marquante...\n');
  
  const message3 = "L'année dernière, j'ai perdu mon grand-père. Il m'avait appris à coder quand j'étais petit. C'est lui qui m'a fait découvrir Isaac Asimov. Depuis, je lis beaucoup de science-fiction. Mon livre préféré reste 'Le Cycle de Fondation'.";
  
  conversationHistory.push({ role: 'user', content: message3 });
  const response3 = await sendMessage(conversationHistory);
  conversationHistory.push({ role: 'assistant', content: response3.message });
  
  console.log('👤 Vous:', message3.substring(0, 100) + '...');
  console.log('🤖 K.A.E.L.E.N:', response3.message.substring(0, 150) + '...\n');
  
  await sleep(3000);
  
  // ÉTAPE 4: Tester la mémoire complète
  console.log('📝 ÉTAPE 4: Tester si K.A.E.L.E.N se souvient de TOUT...\n');
  
  const message4 = "Est-ce que tu te souviens de tout ce que je t'ai dit ? Mon âge, mes passions, mes peurs ?";
  
  conversationHistory.push({ role: 'user', content: message4 });
  const response4 = await sendMessage(conversationHistory);
  
  console.log('👤 Vous:', message4);
  console.log('🤖 K.A.E.L.E.N:', response4.message, '\n');
  
  await sleep(2000);
  
  // ÉTAPE 5: Vérifier le contexte mémoire stocké
  console.log('📝 ÉTAPE 5: Examiner le contexte mémoire complet...\n');
  
  const memoryResponse = await fetch(`${API_URL}/users/${userId}/memory`);
  const memoryData = await memoryResponse.json();
  
  console.log('🧠 CONTEXTE MÉMOIRE COMPLET:');
  console.log('═══════════════════════════════════════════════════');
  console.log(memoryData.memoryContext);
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('✅ Test terminé! Vérifiez que K.A.E.L.E.N a capturé:');
  console.log('   ✓ Informations personnelles (nom, âge, lieu, profession)');
  console.log('   ✓ Goûts et préférences (films, musique, livres)');
  console.log('   ✓ Projets actuels');
  console.log('   ✓ Peurs et anxiétés');
  console.log('   ✓ Expériences marquantes');
  console.log('   ✓ Relations familiales');
  console.log('   ✓ Style de communication');
  console.log('\n🎯 K.A.E.L.E.N devrait maintenant pouvoir faire référence à N\'IMPORTE LEQUEL de ces détails!');
}

testFullMemory().catch(console.error); 