const express = require('express');
const router = express.Router();
const horaireCtrl = require('../controllers/horaireTransportController');
const arretCtrl = require('../controllers/arretTransportController');

router.get('/details/itineraire', horaireCtrl.getItineraire);

// CRUD horaires
router.post('/', horaireCtrl.createHoraire);
router.get('/', horaireCtrl.getAllHoraires);
router.get('/station/:stationId', horaireCtrl.getHorairesByStation);
router.get('/:id', horaireCtrl.getHoraireById);
router.put('/:id', horaireCtrl.updateHoraire);
router.delete('/:id', horaireCtrl.deleteHoraire);

// Statut
router.put('/:id/statut', horaireCtrl.updateStatut);


router.get('/villes/:villeId/stations', horaireCtrl.getStationsByVilleAndType);

router.get('/itineraire', horaireCtrl.getItineraire);


// CRUD arrêts (imbriqués dans un horaire)
router.post('/:horaireId/arrets', arretCtrl.createArret);        // ➕ Ajouter un arrêt à un horaire
router.get('/:horaireId/arrets', arretCtrl.getArretsByHoraire);  // 📋 Lister les arrêts d’un horaire

// Gestion d’un arrêt spécifique
router.get('/arrets/:id', arretCtrl.getArretById);       // 📋 Un arrêt spécifique
router.put('/arrets/:id', arretCtrl.updateArret);        // ✏️ Modifier
router.delete('/arrets/:id', arretCtrl.deleteArret);     // 🗑️ Supprimer

module.exports = router;
