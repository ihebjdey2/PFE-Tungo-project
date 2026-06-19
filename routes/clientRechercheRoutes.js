const express = require('express');
const clientRechercheController = require('../controllers/clientRechercheController');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Route pour créer une nouvelle recherche
router.post('/', authenticateToken, clientRechercheController.createRecherche);

// Route pour obtenir les chauffeurs disponibles
router.get('/chauffeurs', authenticateToken, clientRechercheController.getChauffeursDisponibles);
router.delete('/del', authenticateToken, clientRechercheController.cancelRecherche);
router.get('/villes', clientRechercheController.getAllVilles);
router.get('/stations', clientRechercheController.getStationsPourTrajet);

module.exports = router;
