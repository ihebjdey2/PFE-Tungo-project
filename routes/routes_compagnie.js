const express = require('express');
const router = express.Router();
const compagnieController = require('../controllers/compagnieController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyPermission = require('../middleware/verifyPermission');
const adminController = require('../controllers/adminController');

// CRUD
router.post('/add', authenticateToken, verifyPermission('add_compagnie'), compagnieController.ajouterCompagnie);
router.get('/compagnies', authenticateToken, verifyPermission('list_compagnie'), compagnieController.getCompagnies);
router.put('/compagnies/:id', authenticateToken, verifyPermission('update_compagnie'), compagnieController.updateCompagnie);
router.delete('/compagnies/:id', authenticateToken, verifyPermission('delete_compagnie'), compagnieController.deleteCompagnie);

// Association
router.post('/compagnies/stations', authenticateToken, verifyPermission('associer_compagnie_station'), compagnieController.associerCompagnieStation);
router.delete('/compagnies/stations', authenticateToken, verifyPermission('retirer_compagnie_station'), compagnieController.retirerCompagnieStation);
router.get('/station/:stationId',authenticateToken, compagnieController.getCompagniesByStation);

router.get(
  '/station/:stationId/destinations',
  // authenticateToken,
  adminController.getDestinationsForStation
);

module.exports = router;
