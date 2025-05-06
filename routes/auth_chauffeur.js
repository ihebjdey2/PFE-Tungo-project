const express = require('express');
const chauffeurController = require('../controllers/chauffeurController'); // Vérifiez que le chemin est correct
const authenticateToken = require('../middleware/authenticateToken'); // Vérifiez que le middleware existe
const verifyRole = require('../middleware/verifyRole'); // Vérifiez que le middleware existe
const upload = require('../middleware/upload');
const router = express.Router();


// Routes
router.post('/signup',upload.single('image'), chauffeurController.signup);
router.post('/signin', chauffeurController.signin);
router.get('/me', authenticateToken,verifyRole('Chauffeur'),  chauffeurController.getMe);
router.get('/villes',chauffeurController.getAllVilles);

module.exports = router;
