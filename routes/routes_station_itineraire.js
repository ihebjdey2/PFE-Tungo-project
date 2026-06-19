const express = require('express');
const router = express.Router();
const stationItineraireController = require('../controllers/stationItineraireController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyPermission = require('../middleware/verifyPermission');





// ==================== ITINÉRAIRES LOUAGE ====================

// Ajouter un itinéraire Louage
router.post(
  '/itineraires',
  authenticateToken,
  verifyPermission('add_itineraires'),
  stationItineraireController.ajouterItineraire
);

// Obtenir tous les itinéraires Louage
router.get(
  '/itineraires/louage',
  authenticateToken,
  verifyPermission('get_itineraires'),
  stationItineraireController.getItineraires
);

// Mettre à jour un itinéraire Louage
router.put(
  '/itineraires/louage/:id',
  authenticateToken,
  verifyPermission('update_itineraires'),
  stationItineraireController.updateItineraire
);

// Supprimer un itinéraire Louage
router.delete(
  '/itineraires/louage/:id',
  authenticateToken,
  verifyPermission('delete_itineraires'),
  stationItineraireController.deleteItineraire
);


// ==================== ITINÉRAIRES BUS ====================

router.post(
  '/itineraires/bus',
  authenticateToken,
  verifyPermission('add_itineraires'),
  stationItineraireController.ajouterItineraireBus
);

router.get(
  '/itineraires/bus',
  authenticateToken,
  verifyPermission('get_itineraires'),
  stationItineraireController.getItinerairesBus
);

router.put(
  '/itineraires/bus/:id',
  authenticateToken,
  verifyPermission('update_itineraires'),
  stationItineraireController.modifierItineraireBus
);

router.delete(
  '/itineraires/bus/:id',
  authenticateToken,
  verifyPermission('delete_itineraires'),
  stationItineraireController.supprimerItineraireBus
);


// ==================== ITINÉRAIRES TRAIN ====================

router.post(
  '/itineraires/train',
  authenticateToken,
  verifyPermission('add_itineraires'),
  stationItineraireController.ajouterItineraireTrain
);

router.get(
  '/itineraires/train',
  authenticateToken,
  verifyPermission('get_itineraires'),
  stationItineraireController.getItinerairesTrain
);

router.put(
  '/itineraires/train/:id',
  authenticateToken,
  verifyPermission('update_itineraires'),
  stationItineraireController.modifierItineraireTrain
);

router.delete(
  '/itineraires/train/:id',
  authenticateToken,
  verifyPermission('delete_itineraires'),
  stationItineraireController.supprimerItineraireTrain
);


// ==================== STATIONS ====================

router.post(
  '/stations',
  authenticateToken,
  verifyPermission('add_station'),
  stationItineraireController.ajouterStation
);

router.put(
  '/stations/:stationId',
  authenticateToken,
  verifyPermission('update_station'),
  stationItineraireController.modifierStation
);

router.delete(
  '/stations/:stationId',
  authenticateToken,
  verifyPermission('delete_station'),
  stationItineraireController.supprimerStation
);

router.get(
  '/stations',
  authenticateToken,
  verifyPermission('list_station'),
  stationItineraireController.getStations
);

module.exports = router;
