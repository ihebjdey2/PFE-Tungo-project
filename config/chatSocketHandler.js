/*
// config/chatSocketHandler.js
const jwt = require('jsonwebtoken');
const chatController = require('../controllers/chatController');

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log(`[chatSocket] client connected: ${socket.id}`);

    const safe = (v, fallback = {}) => { try { return v || fallback; } catch { return fallback; } };

    // ---- AUTH ----
    socket.on('auth', (data = {}) => {
      const token = data.token;
      if (!token) return socket.emit('auth_required', { ok: false });

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
        socket.user = decoded;
        socket.emit('auth_ok', { ok: true, user: decoded });
      } catch {
        socket.emit('auth_error', { ok: false, message: 'Invalid token' });
      }
    });

    // ---- SUBSCRIBE ----
    socket.on('subscribe', (data = {}) => {
      const conversationId = parseInt(safe(data.conversationId, 0), 10);
      if (!conversationId) return socket.emit('error_message', { error: 'Missing conversationId' });

      const room = `conv_${conversationId}`;
      socket.join(room);
      socket.conversationId = conversationId;
      console.log(`[chatSocket] ${socket.id} joined ${room}`);
      socket.emit('subscribed', { conversationId });
    });

    // ---- SEND MESSAGE ----
    socket.on('send_message', async (data = {}) => {
      try {
        const conversationId = parseInt(safe(data.conversationId, socket.conversationId || 0), 10);
        const content = (safe(data.content, '') + '').trim();
        const metadata = safe(data.metadata, {});

        if (!conversationId || !content) {
          socket.emit('error_message', { error: 'conversationId and content are required' });
          return;
        }

        // On réutilise postMessage du controller
        // Simule req et res pour pouvoir appeler la fonction existante
        const fakeReq = {
          params: { conversationId },
          body: { content, metadata },
          user: socket.user
        };

        const fakeRes = {
          json: (payload) => {
            // Emit messages to room
            if (payload.userMessage) io.to(`conv_${conversationId}`).emit('new_message', { message: payload.userMessage });
            if (payload.botMessage) io.to(`conv_${conversationId}`).emit('new_message', { message: payload.botMessage });
          },
          status: () => fakeRes
        };

        await chatController.postMessage(fakeReq, fakeRes);

      } catch (err) {
        console.error('[chatSocket] send_message error:', err);
        socket.emit('error_message', { error: 'Internal server error' });
      }
    });

    // ---- DISCONNECT ----
    socket.on('disconnect', () => {
      console.log(`[chatSocket] client disconnected: ${socket.id}`);
    });
  });
};
*/