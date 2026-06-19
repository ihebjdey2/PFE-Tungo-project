const express = require('express');
const router = express.Router();
const listUtilisateur = require('../controllers/listUtilisateur');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole'); // Vérifiez que le middleware existe
const upload = require('../middleware/upload');
const verifyPermission = require('../middleware/verifyPermission');


// 🔹 Récupérer toutes les listes
router.get('/superviseurs', authenticateToken, verifyPermission('list_superviseurs'), listUtilisateur.getAllSuperviseurs);
router.get('/clients', authenticateToken, verifyPermission('list_clients'), listUtilisateur.getAllClients);
router.get('/chauffeurs', authenticateToken, verifyPermission('list_chauffeurs'), listUtilisateur.getAllChauffeurs);


module.exports = router;
