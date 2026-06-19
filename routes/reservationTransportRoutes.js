const express = require('express');
const router = express.Router();
const reservationTransportCtrl = require('../controllers/reservationTransportController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole');
// ==============================
// 📌 ROUTES CÔTÉ CLIENT
// ==============================

// ➕ Créer une réservation bus/train
router.post('/',authenticateToken,verifyRole('Client'), reservationTransportCtrl.createReservationTransport);

// ❌ Annuler une réservation (client)
router.delete('/:id',authenticateToken,verifyRole('Client'), reservationTransportCtrl.cancelReservationTransport);

// 📋 Voir ses réservations
router.get('/client/mes-reservations', reservationTransportCtrl.getReservationsByClient);

// 📋 Historique client
router.get('/client/historique',authenticateToken,verifyRole('Client'), reservationTransportCtrl.getReservationHistoryTransport);


// ==============================
// 📌 ROUTES CÔTÉ SUPERVISEUR
// ==============================

// 📋 Voir toutes les réservations gérées par sa station
router.get('/superviseur', reservationTransportCtrl.getReservationsForSuperviseur);

// ✅ Confirmer une réservation
router.put('/superviseur/:id/confirm', reservationTransportCtrl.confirmReservationTransport);

// ❌ Annuler une réservation
router.put('/superviseur/:id/cancel', reservationTransportCtrl.cancelBySuperviseur);


module.exports = router;
