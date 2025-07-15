const express = require('express');
const superviseurController = require('../controllers/superviseurcontroller');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole');
const upload = require('../middleware/upload'); // Middleware Multer
const router = express.Router();




router.get('/superviseur/:superviseurId/chauffeurs',authenticateToken,verifyRole('Superviseur'),superviseurController.getChauffeursForSuperviseurDestinations);

router.get('/superviseur/:superviseurId/reservations/vehicule', authenticateToken, verifyRole('Superviseur'), superviseurController.getVehiculeReservationsForSuperviseur);

router.post('/superviseur/reservation/assign', authenticateToken, verifyRole('Superviseur'), superviseurController.assignChauffeurToVehiculeReservation);

router.get('/superviseur/:chauffeur_id/reservation/:reservation_id/vehicules-compatibles',authenticateToken, verifyRole('Superviseur'),superviseurController. getCompatibleVehiculesForChauffeurReservation);
  
/*
router.post('/itineraire',authenticateToken, verifyRole('superviseur'), superviseurController.ajouterItineraire);
router.get('/itineraire',authenticateToken, verifyRole('superviseur'), superviseurController.getItineraires);
router.put('/itineraire/:id',authenticateToken, verifyRole('superviseur'), superviseurController.updateItineraire);
router.delete('/itineraire/:id',authenticateToken, verifyRole('superviseur'), superviseurController.deleteItineraire);


router.post('/stations', authenticateToken, verifyRole('superviseur'), superviseurController.ajouterStation);
router.put('/stations/:stationId', authenticateToken, verifyRole('superviseur'), superviseurController.modifierStation);
router.delete('/stations/:stationId', authenticateToken, verifyRole('superviseur'), superviseurController.supprimerStation);
router.get('/stations', authenticateToken, verifyRole('superviseur'), superviseurController.getStations);

*/

module.exports = router;
