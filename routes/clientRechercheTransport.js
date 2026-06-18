const express = require('express');
const router = express.Router();
const clientRechercheTransportController = require('../controllers/clientRechercheTransportController');
const authenticateToken = require('../middleware/authenticateToken'); // pour sécuriser avec JWT

// 🔹 Effectuer une recherche (sauvegarde + résultats horaires bus/train)
router.post(
  '/recherche-transport',
  authenticateToken,
  
  clientRechercheTransportController.searchHorairesTransport
);

// 🔹 Récupérer l’historique des recherches du client
router.get(
  '/recherche-transport/historique',
  authenticateToken,
  clientRechercheTransportController.getHistoriqueRecherches
);

// 🔹 Supprimer une recherche spécifique
router.delete(
  '/recherche-transport/:id',
  authenticateToken,
  clientRechercheTransportController.deleteRecherche
);

// 🔹 Supprimer tout l’historique
router.delete(
  '/recherche-transport',
  authenticateToken,
  clientRechercheTransportController.clearHistoriqueRecherches
);

module.exports = router;
