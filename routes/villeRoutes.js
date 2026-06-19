const express = require('express');
const router = express.Router();
const villeController = require('../controllers/villeController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyPermission = require('../middleware/verifyPermission');

// ==================== VILLES ====================

// ➕ Ajouter une ville
router.post(
  '/add',
  authenticateToken,
  verifyPermission('add_ville'),
  villeController.ajouterVille
);

// 📋 Obtenir toutes les villes
router.get(
  '/villes',
  authenticateToken,
  verifyPermission('get_ville'),
  villeController.getVilles
);

// ✏️ Modifier une ville
router.put(
  '/villes/:id',
  authenticateToken,
  verifyPermission('update_ville'),
  villeController.modifierVille
);

// ❌ Supprimer une ville
router.delete(
  '/villes/:id',
  authenticateToken,
  verifyPermission('delete_ville'),
  villeController.supprimerVille
);

module.exports = router;
