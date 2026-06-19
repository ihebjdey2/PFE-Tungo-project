const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authenticateToken'); // Vérifiez que le middleware existe

// ✅ Route unique pour tous les rôles
router.post('/signin', authController.login);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
