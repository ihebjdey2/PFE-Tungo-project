const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateToken = require('../middleware/authenticateToken');

// POST /chat
router.post('/', authenticateToken, chatController.chat);
router.get('/conversations',authenticateToken, chatController.getConversations);
router.get('/conversations/:conversationId/messages',authenticateToken, chatController.getMessagesByConversation);
router.delete('/conversations/:conversationId',authenticateToken, chatController.deleteConversation);
module.exports = router;
