const HoraireTransport = require('../models/HoraireTransport');
const Station = require('../models/Station');
const Compagnie = require('../models/Compagnie');
const ArretTransport = require('../models/ArretTransport');
const ItineraireBus = require('../models/ItineraireBus');
const ItineraireTrain = require('../models/ItineraireTrain');
const Ville = require('../models/Ville');
const { Op } = require('sequelize');

/**
 * ➕ Créer un nouvel horaire (bus ou train)
 */
exports.createHoraire = async (req, res) => {
  try {
    const {
      station_depart_id,
      station_arrivee_id,
      compagnie_id,
      type, // 'bus' ou 'train'
      jour_semaine,
      date_exception,
      heure_depart,
      heure_arrivee,
      
      tarif_reduit,
      tarif_premium,
      capacite,
      statut,
      ville_arrivee_id // ⚠️ On attend juste la ville d’arrivée du frontend
    } = req.body;

    // 1️⃣ Vérifier la station de départ et récupérer sa ville
    const stationDepart = await Station.findByPk(station_depart_id);
    if (!stationDepart) {
      return res.status(404).json({ message: "Station de départ introuvable." });
    }
    const ville_depart_id = stationDepart.villeId;

    // 2️⃣ Chercher l’itinéraire correspondant
    let itineraire = null;
    if (type === 'bus') {
      itineraire = await ItineraireBus.findOne({
        where: {
          [Op.or]: [
            { ville_pointA_id: ville_depart_id, ville_pointB_id: ville_arrivee_id },
            { ville_pointA_id: ville_arrivee_id, ville_pointB_id: ville_depart_id }
          ]
        }
      });
    } else if (type === 'train') {
      itineraire = await ItineraireTrain.findOne({
        where: {
          [Op.or]: [
            { ville_pointA_id: ville_depart_id, ville_pointB_id: ville_arrivee_id },
            { ville_pointA_id: ville_arrivee_id, ville_pointB_id: ville_depart_id }
          ]
        }
      });
    }

    if (!itineraire) {
      return res.status(404).json({ message: `Aucun itinéraire ${type} trouvé entre ces deux villes.` });
    }
    const prixAuto = type === 'bus' ? itineraire.tarif_bus : itineraire.tarif_train;

    // 3️⃣ Créer l’horaire avec itinéraire et prix auto si pas fourni
    const horaire = await HoraireTransport.create({
      station_depart_id,
      station_arrivee_id,
      compagnie_id: compagnie_id || null,
      ville_depart_id,
      ville_arrivee_id,
      itineraire_bus_id: type === 'bus' ? itineraire.id : null,
      itineraire_train_id: type === 'train' ? itineraire.id : null,
      type,
      jour_semaine,
      date_exception: date_exception || null,
      heure_depart,
      heure_arrivee,
      prix: prixAuto, // 🔥 Prix imposé par itinéraire
      tarif_reduit: tarif_reduit || null,
      tarif_premium: tarif_premium || null,
      capacite: capacite || null,
      statut: statut || 'actif'
    });

    res.status(201).json(horaire);
  } catch (err) {
    console.error("Erreur createHoraire:", err.message);
    res.status(500).json({ error: err.message });
  }
};


/**
 * 🔍 Récupérer l’itinéraire correspondant entre deux villes pour bus ou train
 */
exports.getItineraire = async (req, res) => {
  try {
    const { type, villeDepartId, villeArriveeId } = req.query;

    if (!type || !villeDepartId || !villeArriveeId) {
      return res.status(400).json({
        message: "Paramètres requis : type (bus/train), villeDepartId et villeArriveeId"
      });
    }

    let itineraire = null;

    if (type === 'bus') {
      itineraire = await ItineraireBus.findOne({
        where: {
          [Op.or]: [
            { ville_pointA_id: villeDepartId, ville_pointB_id: villeArriveeId },
            { ville_pointA_id: villeArriveeId, ville_pointB_id: villeDepartId }
          ]
        },
        attributes: ['id', 'ville_pointA_id', 'ville_pointB_id', 'distance', 'duree_estimee', 'tarif_bus']
      });
    } else if (type === 'train') {
      itineraire = await ItineraireTrain.findOne({
        where: {
          [Op.or]: [
            { ville_pointA_id: villeDepartId, ville_pointB_id: villeArriveeId },
            { ville_pointA_id: villeArriveeId, ville_pointB_id: villeDepartId }
          ]
        },
        attributes: ['id', 'ville_pointA_id', 'ville_pointB_id', 'distance', 'duree_estimee', 'tarif_train']
      });
    }

    if (!itineraire) {
      return res.status(404).json({ message: `Aucun itinéraire ${type} trouvé entre ces deux villes.` });
    }

    res.json(itineraire);
  } catch (err) {
    console.error("Erreur getItineraire:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
/**
 * 📋 Lister tous les horaires (optionnel)
 */
exports.getAllHoraires = async (req, res) => {
  try {
    const horaires = await HoraireTransport.findAll({
      include: [
        { model: Station, as: 'StationDepart', attributes: ['id', 'nom'] },
        { model: Station, as: 'StationArrivee', attributes: ['id', 'nom'] },
        { model: Compagnie, as: 'Compagnie', attributes: ['id', 'nom'] },
        { model: ItineraireBus, as: 'ItineraireBus' },
        { model: ItineraireTrain, as: 'ItineraireTrain' },
        { model: ArretTransport, as: 'Arrets' }
      ]
    });
    res.json(horaires);
  } catch (err) {
    console.error("Erreur getAllHoraires:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📋 Lister les horaires d’une station
 */
exports.getHorairesByStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const horaires = await HoraireTransport.findAll({
      where: { station_depart_id: stationId },
      include: [
        { model: Station, as: 'StationDepart', attributes: ['id', 'nom'] },
        { model: Station, as: 'StationArrivee', attributes: ['id', 'nom'] },
        { model: Compagnie, as: 'Compagnie', attributes: ['id', 'nom'] },
        { model: ItineraireBus, as: 'ItineraireBus' },
        { model: ItineraireTrain, as: 'ItineraireTrain' },
        { model: ArretTransport, as: 'Arrets' }
      ]
    });
    res.json(horaires);
  } catch (err) {
    console.error("Erreur getHorairesByStation:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📋 Récupérer un horaire par ID
 */
exports.getHoraireById = async (req, res) => {
  try {
    const horaire = await HoraireTransport.findByPk(req.params.id, {
      include: [
        { model: Station, as: 'StationDepart', attributes: ['id', 'nom'] },
        { model: Station, as: 'StationArrivee', attributes: ['id', 'nom'] },
        { model: Compagnie, as: 'Compagnie', attributes: ['id', 'nom'] },
        { model: ItineraireBus, as: 'ItineraireBus' },
        { model: ItineraireTrain, as: 'ItineraireTrain' },
        { model: ArretTransport, as: 'Arrets' }
      ]
    });

    if (!horaire) {
      return res.status(404).json({ message: "Horaire introuvable." });
    }

    res.json(horaire);
  } catch (err) {
    console.error("Erreur getHoraireById:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✏️ Modifier un horaire
 */
exports.updateHoraire = async (req, res) => {
  try {
    const [updated] = await HoraireTransport.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated === 0) {
      return res.status(404).json({ message: "Horaire introuvable." });
    }

    res.json({ message: "Horaire mis à jour avec succès." });
  } catch (err) {
    console.error("Erreur updateHoraire:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🗑️ Supprimer un horaire
 */
exports.deleteHoraire = async (req, res) => {
  try {
    const deleted = await HoraireTransport.destroy({ where: { id: req.params.id } });

    if (deleted === 0) {
      return res.status(404).json({ message: "Horaire introuvable." });
    }

    res.json({ message: "Horaire supprimé avec succès." });
  } catch (err) {
    console.error("Erreur deleteHoraire:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 🔄 Mettre à jour le statut (actif/suspendu/annule)
 */
exports.updateStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['actif', 'suspendu', 'annule'].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    const [updated] = await HoraireTransport.update(
      { statut },
      { where: { id: req.params.id } }
    );

    if (updated === 0) {
      return res.status(404).json({ message: "Horaire introuvable." });
    }

    res.json({ message: `Statut mis à jour : ${statut}` });
  } catch (err) {
    console.error("Erreur updateStatut:", err.message);
    res.status(500).json({ error: err.message });
  }
};
exports.getStationsByVilleAndType = async (req, res) => {
  try {
    const { villeId } = req.params;
    const { type } = req.query; // ex: ?type=bus ou ?type=train

    // Vérifier si la ville existe
    const ville = await Ville.findByPk(villeId, { attributes: ['id', 'nom'] });
    if (!ville) {
      return res.status(404).json({ message: "Ville introuvable." });
    }

    // Construire la condition de recherche
    const whereCondition = { villeId };
    if (type) {
      whereCondition.type_station = type; // ⚠️ le champ est bien `type_station`
    }

    // Récupérer les stations correspondantes
    const stations = await Station.findAll({
      where: whereCondition,
      attributes: ['id', 'nom', 'type_station']
    });

    // Réponse structurée
    res.status(200).json({
      ville: {
        id: ville.id,
        nom: ville.nom
      },
      stations: stations.map(s => ({
        id: s.id,
        nom: s.nom,
        type: s.type_station
      }))
    });
  } catch (error) {
    console.error("Erreur getStationsByVilleAndType:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};
