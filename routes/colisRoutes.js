const express = require('express');
const router = express.Router();
const colisController = require('../controllers/colisController');
const chauffeurSessionController = require('../controllers/chauffeurSessionController');
const authenticateToken = require('../middleware/authenticateToken');
const verifyRole = require('../middleware/verifyRole');

// 📦 Créer un colis (client connecté)
router.post('/colis', authenticateToken, verifyRole('Client'), colisController.creerColis);

// 📋 Historique des colis envoyés par un client
router.get('/colis/client', authenticateToken, verifyRole('Client'), colisController.colisParClient);

// 🚚 Liste des colis à livrer par un chauffeur
router.get('/colis/chauffeur', authenticateToken, verifyRole('Chauffeur'), colisController.colisParChauffeur);

// ⏳ Liste des colis en attente (superviseur)
router.get('/colis/attente', authenticateToken, verifyRole('Superviseur'), colisController.colisEnAttente);

// 🔁 Affecter un chauffeur à un colis
router.put('/colis/:id/affecter', authenticateToken, verifyRole('Superviseur'), colisController.affecterChauffeur);

// 🧾 Mettre à jour le statut manuellement (chauffeur ou superviseur)
router.put('/colis/:id/statut', authenticateToken, verifyRole(['Chauffeur', 'Superviseur']), colisController.mettreAJourStatut);

// 🚚 Liste des colis EN LIVRAISON du chauffeur connecté
router.get('/chauffeur/en-livraison', authenticateToken, verifyRole('Chauffeur'), colisController.colisEnLivraisonParChauffeur);

// ✅ Marquer un colis comme livré (chauffeur)
router.put('/colis/:id/marquer-livre', authenticateToken, verifyRole('Chauffeur'), colisController.marquerLivre);

// 🏢 Déposer un colis à la station (chauffeur)
router.put('/colis/:id/deposer-station', authenticateToken, verifyRole('Chauffeur'), colisController.deposerAStation);

// 🎯 Suivre un colis via code de retrait (public, sans token)
router.post('/colis/suivre', colisController.suivreColisParCode);

// historique des colis livré par le chauffeur 
router.get(
  '/colis/chauffeur/livres',
  authenticateToken,
  verifyRole('Chauffeur'),                                              
  colisController.colisLivres
);

router.get('/colis/detail/:id', authenticateToken, verifyRole('Client'),colisController.getColisByIdForClient);

router.put('/chauffeur/position', authenticateToken, chauffeurSessionController.mettreAJourPosition);
router.post('/chauffeur/position/init', authenticateToken, chauffeurSessionController.initPosition);


module.exports = router;
