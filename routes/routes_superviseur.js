const express = require('express');
const superviseurController = require('../controllers/superviseurcontroller');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole');
const upload = require('../middleware/upload'); // Middleware Multer
const router = express.Router();


router.post('/signin', superviseurController.signin);


router.get('/superviseur/:superviseurId/chauffeurs',authenticateToken,verifyRole('Superviseur'),superviseurController.getChauffeursForSuperviseurDestinations);

  
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
