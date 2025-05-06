const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole'); // Vérifiez que le middleware existe
const upload = require('../middleware/upload');



// 🔹 Admin Login
router.post('/login', adminController.loginAdmin);

// 🔹 Ajouter un nouvel administrateur
router.post('/ajouter-admin', authenticateToken,upload.single('image'), verifyRole('Administrateur'), adminController.ajouterAdministrateur);

// 🔹 Ajouter un nouveau superviseur
router.post('/ajouter-superviseur', authenticateToken,upload.single('image'), verifyRole('Administrateur'), adminController.ajouterSuperviseur);

// 🔹 Récupérer toutes les stations
router.get('/stations', authenticateToken, verifyRole('Administrateur'), adminController.getStations);

// 🔹 Récupérer les destinations associées à une station spécifique
router.get('/station/:stationId/destinations', authenticateToken, verifyRole('Administrateur'), adminController.getDestinationsForStation);
//afficher les destinations du superviseur x
router.get('/superviseur/:superviseurId/destinations', authenticateToken, verifyRole('Administrateur'), adminController.getDestinationsBySuperviseur);

router.get('/me', authenticateToken, verifyRole('Administrateur'), adminController.getMe);
router.put('/update-profile', authenticateToken, upload.single('image'), verifyRole('Administrateur'), adminController.updateProfile);
router.get('/villes', adminController.getAllVilles);


module.exports = router;
