const express = require('express');
const chauffeurSessionController = require('../controllers/chauffeurSessionController');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Routes pour choisir un véhicule et un itinéraire
router.get('/vehicules-disponibles', authenticateToken, chauffeurSessionController.getVehiculesDisponibles);
router.post('/choisir-vehicule', authenticateToken, chauffeurSessionController.choisirVehicule);
router.get('/itineraire', authenticateToken, chauffeurSessionController.getItineraire);
router.post('/choisir-itineraire', authenticateToken, chauffeurSessionController.choisirItineraire);
router.get('/stations', chauffeurSessionController.getStationsPourTrajet);

module.exports = router;
