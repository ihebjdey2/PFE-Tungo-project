// controllers/chatController.js
const { HfInference } = require('@huggingface/inference');
const { Pool } = require('pg');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Vérifie HF token mais laisse l'app démarrer si absent (log)
const HF_TOKEN = process.env.HF_TOKEN || null;
if (!HF_TOKEN) console.warn('⚠️ HF_TOKEN non défini dans .env — génération via HF désactivée');
const hf = HF_TOKEN ? new HfInference(HF_TOKEN) : null;

// =======================
// Helpers Sequelize
// =======================
async function getOrCreateConversation(userId, title = null) {
  const conversation = await Conversation.findOne({ where: { user_id: userId } });
  if (conversation) return conversation;
  return Conversation.create({ user_id: userId, title });
}

async function saveUserMessage(conversationId, content) {
  return Message.create({
    conversation_id: conversationId,
    sender: 'user',
    content,
    metadata: {}
  });
}

async function saveBotMessage(conversationId, content, metadata = {}) {
  return Message.create({
    conversation_id: conversationId,
    sender: 'bot',
    content,
    metadata
  });
}

// =======================
// Controller Methods
// =======================

// POST /chat
exports.chat = async (req, res) => {
  try {
    // AUTH
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ error: 'Utilisateur non authentifié' });
    const userId = user.id;

    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message requis' });

    console.log(`📥 [user:${userId}] Message reçu: ${message}`);

    // 1) Conversation
    const conversation = await getOrCreateConversation(userId);

    // 2) Sauvegarder le message utilisateur
    await saveUserMessage(conversation.id, message);

    // 3) Recherche vectorielle (embedding + PG)
    let context = '';
    let contextDocs = [];
    if (!hf) {
      console.warn('⚠️ hf client non initialisé — on ne peut pas faire de recherche vectorielle');
    } else {
      try {
        const embeddingResult = await hf.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: message
        });

        const embedding = Array.isArray(embeddingResult[0]) ? embeddingResult[0] : embeddingResult;
        console.log(`✅ Embedding généré: dim=${embedding.length}`);

        const vectorLiteral = `[${embedding.join(',')}]`;
        const searchQuery = `
          SELECT id, content, embedding <=> $1::vector as distance
          FROM documents
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT 10;
        `;
        const { rows } = await pool.query(searchQuery, [vectorLiteral]);
        contextDocs = rows;
        context = rows.map(r => r.content).join('\n');

        console.log(`✅ Contexte trouvé: ${rows.length} docs`);
      } catch (e) {
        console.warn('⚠️ Embedding / recherche vectorielle échouée:', e.message || e);
      }
    }

    if (!context || context.trim() === '') {
      // Sauvegarde message bot minimal et retourner réponse guidée
      const fallback = "Désolé, je n'ai pas trouvé d'informations dans ma base de données pour répondre à votre question.";
      await saveBotMessage(conversation.id, fallback, { contextDocs });
      return res.json({ reply: fallback, conversation_id: conversation.id });
    }

    // 4) Génération réponse HuggingFace
    if (!hf) {
      const fallback = "Service d'IA non configuré (HF_TOKEN manquant).";
      await saveBotMessage(conversation.id, fallback, { contextDocs });
      return res.status(503).json({ error: fallback });
    }

    try {
      const userPrompt = `Voici des informations sur Tungo :

${context}

Question : ${message}

Instructions :
- Réponds directement
- Cite les informations exactes
- Sois précis et concis
- Réponds en français`;

      const chatCompletion = await hf.chatCompletion({
        model: 'meta-llama/Llama-3.2-3B-Instruct',
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 500,
        temperature: 0.2
      });

      const reply = chatCompletion.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";
      console.log(`✅ Réponse générée (user:${userId}): ${reply.substring(0, 120)}...`);

      // 5) Sauvegarder le message du bot
      await saveBotMessage(conversation.id, reply, { contextDocs });

      // 6) Retourner la réponse
      return res.json({
        reply: reply.trim(),
        conversation_id: conversation.id
      });
    } catch (err) {
      console.error('❌ Erreur génération HF:', err);
      const fallback = "Erreur lors de la génération de la réponse par le modèle.";
      await saveBotMessage(conversation.id, fallback, { error: err.message });
      return res.status(500).json({ error: fallback, details: err.message });
    }
  } catch (err) {
    console.error('❌ Erreur dans /chat:', err);
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
};

// GET /conversations
exports.getConversations = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ error: 'Utilisateur non authentifié' });
    const userId = user.id;

    // Récupère conversations + messages triés
    const conversations = await Conversation.findAll({
      where: { user_id: userId },
      include: [{ model: Message, as: 'messages' }],
      order: [
        ['created_at', 'DESC'],
        [{ model: Message, as: 'messages' }, 'created_at', 'ASC']
      ]
    });

    return res.json({ conversations });
  } catch (err) {
    console.error('❌ Erreur getConversations:', err);
    return res.status(500).json({ error: 'Impossible de récupérer les conversations', details: err.message });
  }
};

// GET /conversations/:conversationId/messages
exports.getMessagesByConversation = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ error: 'Utilisateur non authentifié' });
    const userId = user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      where: { id: conversationId, user_id: userId },
      include: [{ model: Message, as: 'messages' }]
    });

    if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });

    // Renvoie les messages triés par created_at asc
    const messages = (conversation.messages || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return res.json({ messages });
  } catch (err) {
    console.error('❌ Erreur getMessagesByConversation:', err);
    return res.status(500).json({ error: 'Impossible de récupérer les messages', details: err.message });
  }
};

// DELETE /conversations/:conversationId
exports.deleteConversation = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ error: 'Utilisateur non authentifié' });
    const userId = user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({ where: { id: conversationId, user_id: userId } });
    if (!conversation) return res.status(404).json({ error: 'Conversation introuvable' });

    // supprime les messages puis la conversation (sécurisé)
    await Message.destroy({ where: { conversation_id: conversationId } });
    await conversation.destroy();

    return res.json({ message: 'Conversation supprimée avec succès' });
  } catch (err) {
    console.error('❌ Erreur deleteConversation:', err);
    return res.status(500).json({ error: 'Impossible de supprimer la conversation', details: err.message });
  }
};
