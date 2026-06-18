const ArretTransport = require('../models/ArretTransport');
const Station = require('../models/Station');
const HoraireTransport = require('../models/HoraireTransport');
const Ville = require('../models/Ville');
const ItineraireBus = require('../models/ItineraireBus');
const ItineraireTrain = require('../models/ItineraireTrain');
const { Op } = require('sequelize');

/**
 * ➕ Ajouter un arrêt à un horaire (par ville + station)
 */
exports.createArret = async (req, res) => {
  try {
    const { horaireId } = req.params; // l’ID de l’horaire
    const { ville_id, station_id, heure_passage, ordre } = req.body;

    // 1. Vérifier l’horaire
    const horaire = await HoraireTransport.findByPk(horaireId);
    if (!horaire) {
      return res.status(404).json({ message: "Horaire introuvable." });
    }

    // 2. Ville de départ = celle de l’horaire
    const villeDepartId = horaire.ville_depart_id;

    // 3. Chercher l’itinéraire correspondant
    let itineraire = null;
    if (horaire.type === 'bus') {
      itineraire = await ItineraireBus.findOne({
        where: {
          [Op.or]: [
            { ville_pointA_id: villeDepartId, ville_pointB_id: ville_id },
            { ville_pointA_id: ville_id, ville_pointB_id: villeDepartId }
          ]
        }
      });
    } else if (horaire.type === 'train') {
      itineraire = await ItineraireTrain.findOne({
        where: {
          [Op.or]: [
            { ville_pointA_id: villeDepartId, ville_pointB_id: ville_id },
            { ville_pointA_id: ville_id, ville_pointB_id: villeDepartId }
          ]
        }
      });
    }

    if (!itineraire) {
      return res.status(404).json({ message: "Aucun itinéraire trouvé pour cet arrêt." });
    }

    // 4. Déterminer prix auto
    const prixAuto = horaire.type === 'bus' ? itineraire.tarif_bus : itineraire.tarif_train;

    // 5. Créer l’arrêt avec l’itinéraire correspondant
    const arret = await ArretTransport.create({
      horaire_id: horaireId,
      ville_id,
      station_id,
      heure_passage,
      ordre: ordre || 1,
      prix: prixAuto,
      itineraire_bus_id: horaire.type === 'bus' ? itineraire.id : null,
      itineraire_train_id: horaire.type === 'train' ? itineraire.id : null
    });

    res.status(201).json(arret);
  } catch (err) {
    console.error("Erreur createArret:", err.message);
    res.status(500).json({ error: err.message });
  }
};


/**
 * 📋 Lister les arrêts d’un horaire
 */
exports.getArretsByHoraire = async (req, res) => {
  try {
    const arrets = await ArretTransport.findAll({
  where: { horaire_id: req.params.horaireId },
  include: [
    { model: Ville, as: 'Ville', attributes: ['id', 'nom'] },
    { model: Station, as: 'Station', attributes: ['id', 'nom'] }
  ],
  order: [['ordre', 'ASC']]
});

res.json({ arrets });

  } catch (err) {
    console.error("Erreur getArretsByHoraire:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📋 Récupérer un arrêt par ID
 */
exports.getArretById = async (req, res) => {
  try {
    const arret = await ArretTransport.findByPk(req.params.id, {
      include: [
        { model: Ville, as: 'Ville', attributes: ['id', 'nom'] },
        { model: Station, as: 'Station', attributes: ['id', 'nom'] }
      ]
    });

    if (!arret) {
      return res.status(404).json({ message: "Arrêt introuvable." });
    }

    res.json(arret);
  } catch (err) {
    console.error("Erreur getArretById:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✏️ Modifier un arrêt
 */
exports.updateArret = async (req, res) => {
  try {
    const [updated] = await ArretTransport.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated === 0) {
      return res.status(404).json({ message: "Arrêt introuvable." });
    }

    res.json({ message: "Arrêt mis à jour avec succès." });
  } catch (err) {
    console.error("Erreur updateArret:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🗑️ Supprimer un arrêt
 */
exports.deleteArret = async (req, res) => {
  try {
    const deleted = await ArretTransport.destroy({ where: { id: req.params.id } });

    if (deleted === 0) {
      return res.status(404).json({ message: "Arrêt introuvable." });
    }

    res.json({ message: "Arrêt supprimé avec succès." });
  } catch (err) {
    console.error("Erreur deleteArret:", err.message);
    res.status(500).json({ error: err.message });
  }
};
