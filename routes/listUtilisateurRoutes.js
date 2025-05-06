const express = require('express');
const router = express.Router();
const listUtilisateur = require('../controllers/listUtilisateur');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole'); // Vérifiez que le middleware existe
const upload = require('../middleware/upload');


// 🔹 Récupérer toutes les listes
router.get('/superviseurs', authenticateToken, verifyRole('Administrateur'), listUtilisateur.getAllSuperviseurs);
router.get('/clients', authenticateToken, verifyRole('Administrateur'), listUtilisateur.getAllClients);
router.get('/chauffeurs', authenticateToken, verifyRole('Administrateur'), listUtilisateur.getAllChauffeurs);


module.exports = router;
