const express = require('express');
const router = express.Router();
const stationItineraireController = require('../controllers/stationItineraireController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole'); // Middleware pour vérification de rôle

// ==================== ITINÉRAIRES ====================

// Ajouter un itinéraire 
router.post('/itineraires', authenticateToken, verifyRole('Administrateur'), stationItineraireController.ajouterItineraire);

// Obtenir tous les itinéraires
router.get('/itineraires', authenticateToken, verifyRole('Administrateur'), stationItineraireController.getItineraires);

// Mettre à jour un itinéraire
router.put('/itineraires/:id', authenticateToken, verifyRole('Administrateur'), stationItineraireController.updateItineraire);

// Supprimer un itinéraire
router.delete('/itineraires/:id', authenticateToken, verifyRole('Administrateur'), stationItineraireController.deleteItineraire);


// ==================== STATIONS ====================

// Ajouter une station
router.post('/stations', authenticateToken, verifyRole('Administrateur'), stationItineraireController.ajouterStation);

// Modifier une station
router.put('/stations/:stationId', authenticateToken, verifyRole('Administrateur'), stationItineraireController.modifierStation);

// Supprimer une station
router.delete('/stations/:stationId', authenticateToken, verifyRole('Administrateur'), stationItineraireController.supprimerStation);

// Obtenir toutes les stations
router.get('/stations', authenticateToken, verifyRole('Administrateur'), stationItineraireController.getStations);

module.exports = router;
