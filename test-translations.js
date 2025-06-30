// Script de test pour vérifier les traductions

const fs = require('fs');
const path = require('path');

const languages = ['en', 'es', 'id', 'th'];

console.log('🔍 Vérification des fichiers de traduction...\n');

languages.forEach(lang => {
  const filePath = path.join(__dirname, 'hoshima-project', 'public', 'locales', lang, 'common.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    console.log(`✅ ${lang.toUpperCase()} - Fichier trouvé`);
    console.log(`   - Sections: ${Object.keys(translations).join(', ')}`);
    console.log(`   - Exemple: "${translations.intro?.line1 || 'N/A'}"`);
    console.log('');
  } catch (error) {
    console.log(`❌ ${lang.toUpperCase()} - Erreur: ${error.message}`);
  }
});

console.log('\n📝 Clés importantes à vérifier:');
console.log('- intro.line1-4 (textes d\'introduction)');
console.log('- game.title, game.season');
console.log('- auth.loadingApp');
console.log('- chat.* (interface du chat)');
console.log('- tutorial.* (étapes du tutoriel)'); 