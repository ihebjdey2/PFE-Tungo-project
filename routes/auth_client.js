const express = require('express');
const clientController = require('../controllers/clientController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole');
const upload = require('../middleware/upload'); // Middleware Multer
const router = express.Router();

// Routes
router.post('/signup', upload.single('image'), clientController.signup);
router.post('/signin', clientController.signin);
router.get('/me', authenticateToken, verifyRole('Client'), clientController.getMe);
router.put('/profile', authenticateToken, verifyRole('Client'), upload.single('image'), clientController.updateProfile);


module.exports = router;
