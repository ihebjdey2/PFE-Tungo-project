const express = require('express');
const chauffeurController = require('../controllers/chauffeurController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole');
const upload = require('../middleware/upload');
const router = express.Router();


// Route pour mettre à jour la disponibilité
router.put('/disponibilite', authenticateToken, chauffeurController.updateDisponibilite);

// Route pour mettre à jour le profil
router.put('/profile',authenticateToken ,verifyRole('Chauffeur'), upload.single('image'), authenticateToken, chauffeurController.updateProfile);

module.exports = router;
