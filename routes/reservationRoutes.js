const express = require('express');
const reservationController = require('../controllers/reservationController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole');
const router = express.Router();


router.post('/Client/create', authenticateToken,verifyRole('Client'), reservationController.createReservation);
router.post('/Client/cancel', authenticateToken,verifyRole('Client'), reservationController.cancelReservation);
router.get('/Client/current', authenticateToken,verifyRole('Client'), reservationController.getCurrentReservation);
router.get('/Client/history', authenticateToken,verifyRole('Client'), reservationController.getReservationHistory);
router.post('/chauffeur/confirm', authenticateToken,verifyRole('Chauffeur'), reservationController.confirmReservation );
router.get('/chauffeur/pending', authenticateToken,verifyRole('Chauffeur'), reservationController.getPendingReservationsForChauffeur  );
router.get('/chauffeur/confirmed', authenticateToken,verifyRole('Chauffeur'), reservationController.getConfirmedReservationsForChauffeur);
router.put('/chauffeur/start-trip', authenticateToken,verifyRole('Chauffeur'), reservationController.startTrip);
router.put('/chauffeur/end-trip', authenticateToken,verifyRole('Chauffeur'), reservationController.endTrip);
module.exports = router;
