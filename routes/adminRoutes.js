const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole'); // Vérifiez que le middleware existe
const upload = require('../middleware/upload');
const verifySuperAdmin = require('../middleware/verifySuperAdmin');
const verifyPermission = require('../middleware/verifyPermission');



// 🔹 Ajouter un nouvel administrateur
router.post('/ajouter-admin', authenticateToken, verifySuperAdmin, verifyPermission('create_admin'), upload.single('image'),adminController.ajouterAdministrateur);
// 🔹 Ajouter un nouveau superviseur
router.post('/ajouter-superviseur', authenticateToken, verifyPermission('create_superviseur'), upload.single('image'),adminController.ajouterSuperviseur);
// 🔹 Récupérer toutes les stations
router.get('/stations', authenticateToken, verifyPermission('view_stations') , adminController.getStations);
// 🔹 Récupérer les destinations associées à une station spécifique
router.get('/station/:stationId/destinations', authenticateToken,   verifyPermission('view_station_destinations'), adminController.getDestinationsForStation);
//afficher les destinations du superviseur x
router.get('/superviseur/:superviseurId/destinations', authenticateToken,  verifyPermission('view_superviseur_destinations'), adminController.getDestinationsBySuperviseur);

router.get('/me', authenticateToken, verifyPermission('view_profile'), adminController.getMe);
router.put('/update-profile', authenticateToken, verifyPermission('update_profile'), upload.single('image'), adminController.updateProfile);
router.get('/villes', authenticateToken, verifyPermission('view_villes'), adminController.getAllVilles);

module.exports = router;
