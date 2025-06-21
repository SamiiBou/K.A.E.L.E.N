const config = require('../config');
const OpenAI = require('openai');

class AIService {
  static async callOpenAI(messages, temperature = 0.8, max_tokens = 600) {
    if (!config.openaiApiKey) {
      console.warn('⚠️ OPENAI_API_KEY non configurée, utilisation de réponses simulées');
      // Note: La fonction de simulation getSimulatedResponse n'est pas déplacée ici
      // car elle est spécifique au contexte du chat. Le service de base ne doit pas simuler.
      throw new Error("OpenAI API key is not configured.");
    }

    try {
      const openai = new OpenAI({
        apiKey: config.openaiApiKey,
      });

      console.log('🤖 Appel OpenAI en cours...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        max_tokens: max_tokens,
        temperature: temperature,
      });

      const response = completion.choices[0]?.message?.content || "";
      console.log('✅ Réponse OpenAI reçue');
      return response;
    } catch (error) {
      console.error('❌ Erreur OpenAI:', error.message);
      throw error; // Propage l'erreur pour que l'appelant puisse la gérer
    }
  }
}

module.exports = AIService; 