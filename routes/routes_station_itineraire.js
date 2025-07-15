const express = require('express');
const router = express.Router();
const stationItineraireController = require('../controllers/stationItineraireController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole'); // Middleware pour vérification de rôle
const verifyPermission = require('../middleware/verifyPermission');


// ==================== ITINÉRAIRES ====================

// Ajouter un itinéraire 
router.post('/itineraires', authenticateToken, verifyPermission('add_itineraires'), stationItineraireController.ajouterItineraire);

// Obtenir tous les itinéraires
router.get('/itineraires', authenticateToken, verifyPermission('get_itineraires'), stationItineraireController.getItineraires);

// Mettre à jour un itinéraire
router.put('/itineraires/:id', authenticateToken, verifyPermission('update_itineraires'), stationItineraireController.updateItineraire);

// Supprimer un itinéraire
router.delete('/itineraires/:id', authenticateToken, verifyPermission('delete_itineraires'), stationItineraireController.deleteItineraire);


// ==================== STATIONS ====================

// Ajouter une station
router.post('/stations', authenticateToken, verifyPermission('add_station'), stationItineraireController.ajouterStation);

// Modifier une station
router.put('/stations/:stationId', authenticateToken, verifyPermission('update_station'), stationItineraireController.modifierStation);

// Supprimer une station
router.delete('/stations/:stationId', authenticateToken, verifyPermission('delete_station'), stationItineraireController.supprimerStation);

// Obtenir toutes les stations
router.get('/stations', authenticateToken, verifyPermission('list_station'), stationItineraireController.getStations);

module.exports = router;
