const { TextServiceClient } = require('@google-ai/generativelanguage').v1beta;
require('dotenv').config();

const client = new TextServiceClient({ apiKey: process.env.GOOGLE_API_KEY });

async function callLLM(messages = []) {
  if (!process.env.GOOGLE_API_KEY) {
    const lastUser = messages.slice().reverse().find(m => m.role === 'user');
    return lastUser ? `Dev-echo: ${lastUser.content}` : "Bonjour, je suis le bot Tungo (dev).";
  }

  try {
    // Fusionner les messages en un seul prompt
    const promptText = messages.map(m => {
      const role = m.role === 'user' ? 'User' : (m.role === 'assistant' ? 'Bot' : 'System');
      return `${role}: ${m.content}`;
    }).join('\n');

    const request = {
      model: process.env.GOOGLE_MODEL || 'models/chat-bison-001', // <-- format exact requis
      prompt: { text: promptText },
      temperature: 0.7,
      maxOutputTokens: 512,
    };

    const [response] = await client.generateText(request);

    return response?.candidates?.[0]?.content ?? "Désolé, pas de réponse du LLM.";
  } catch (err) {
    console.error('Gemini LLM error:', err);
    return "Désolé, erreur interne lors de la génération de réponse.";
  }
}

module.exports = { callLLM };
