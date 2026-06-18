const ReservationTransport = require('../models/ReservationTransport');
const ArretTransport = require('../models/ArretTransport');
const HoraireTransport = require('../models/HoraireTransport');
const Station = require('../models/Station');
const Client = require('../models/Client');
const Utilisateur = require('../models/Utilisateur');
const sequelize = require('../config/database'); // ✅ ajouter ça

const { Op } = require('sequelize');

/**
 * ➕ Client crée une réservation bus/train
 */
exports.createReservationTransport = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { horaire_id, depart_id, arrivee_id, nombre_places, date_voyage } = req.body;

    // Vérifier client
    const client = await Client.findOne({ where: { utilisateur_id: req.user.id } });
    if (!client) {
      return res.status(404).json({ message: "Client introuvable." });
    }

    // Vérifier horaire
    const horaire = await HoraireTransport.findByPk(horaire_id, { transaction });
    if (!horaire) {
      return res.status(404).json({ message: "Horaire introuvable." });
    }

    // Vérifier capacité
    if (horaire.capacite < nombre_places) {
      return res.status(400).json({ message: `Capacité insuffisante. Places restantes : ${horaire.capacite}.` });
    }

    // Vérifier départ
    let depart = null;
    if (horaire.station_depart_id === depart_id) {
      depart = { type: 'station', data: await Station.findByPk(depart_id) };
    } else {
      depart = { type: 'arret', data: await ArretTransport.findOne({ where: { horaire_id, station_id: depart_id } }) };
    }

    // Vérifier arrivée
    let arrivee = null;
    if (horaire.station_arrivee_id === arrivee_id) {
      arrivee = { type: 'station', data: await Station.findByPk(arrivee_id) };
    } else {
      arrivee = { type: 'arret', data: await ArretTransport.findOne({ where: { horaire_id, station_id: arrivee_id } }) };
    }

    if (!depart.data || !arrivee.data) {
      return res.status(404).json({ message: "Point de départ ou d’arrivée introuvable pour cet horaire." });
    }

    // Vérifier ordre des arrêts (si ce sont des arrêts)
    if (depart.type === 'arret' && arrivee.type === 'arret') {
      if (depart.data.ordre >= arrivee.data.ordre) {
        return res.status(400).json({ message: "L’arrêt de départ doit précéder l’arrêt d’arrivée." });
      }
    }

    // Calcul prix
    let prix = horaire.prix * nombre_places; // par défaut = prix horaire
    if (arrivee.type === 'arret' && arrivee.data.prix) {
      prix = arrivee.data.prix * nombre_places; // si tarif défini par arrêt
    }

    // Créer réservation
    const reservation = await ReservationTransport.create({
      client_id: client.utilisateur_id,
      horaire_id,
      station_depart_id: depart_id,
      station_arrivee_id: arrivee_id,
      nombre_places,
      prix,
      date_voyage,
      statut: 'en_attente',
      type_transport: horaire.type
    }, { transaction });

    // Décrémenter capacité
    horaire.capacite -= nombre_places;
    await horaire.save({ transaction });

    await transaction.commit();

    res.status(201).json({ message: "Réservation créée avec succès.", reservation });

  } catch (err) {
    await transaction.rollback();
    console.error("Erreur createReservationTransport:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ❌ Client annule sa réservation
 */
exports.cancelReservationTransport = async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.user.id;

    const reservation = await ReservationTransport.findOne({
      where: { id, client_id }
    });

    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    if (!['en_attente', 'confirmée'].includes(reservation.statut)) {
      return res.status(400).json({ message: "Impossible d’annuler cette réservation." });
    }

    // Restaurer capacité
    const horaire = await HoraireTransport.findByPk(reservation.horaire_id);
    if (horaire) {
      horaire.capacite += reservation.nombre_places;
      await horaire.save();
    }

    reservation.statut = 'annulée';
    await reservation.save();

    res.json({ message: "Réservation annulée avec succès.", reservation });
  } catch (err) {
    console.error("Erreur cancelReservationTransport:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📋 Récupérer les réservations du client
 */
exports.getReservationsByClient = async (req, res) => {
  try {
    const client_id = req.user.id;

    const reservations = await ReservationTransport.findAll({
      where: { client_id },
      include: [
        { model: HoraireTransport, as: 'Horaire' },
        { model: Station, as: 'StationDepartTransport' },
        { model: Station, as: 'StationArriveeTransport' }
      ],
      order: [['heure_reservation', 'DESC']]
    });

    res.json(reservations);
  } catch (err) {
    console.error("Erreur getReservationsByClient:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📋 Historique client
 */
exports.getReservationHistoryTransport = async (req, res) => {
  try {
    const client_id = req.user.id;

    const reservations = await ReservationTransport.findAll({
      where: {
        client_id,
        statut: { [Op.in]: ['terminée', 'annulée'] }
      },
      include: [
        { model: HoraireTransport, as: 'Horaire' },
        { model: Station, as: 'StationDepartTransport' },
        { model: Station, as: 'StationArriveeTransport' }
      ],
      order: [['heure_reservation', 'DESC']]
    });

    res.json(reservations);
  } catch (err) {
    console.error("Erreur getReservationHistoryTransport:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * 📋 Superviseur : lister toutes les réservations de sa station
 */
exports.getReservationsForSuperviseur = async (req, res) => {
  try {
    const superviseurStationId = req.user.station_id;

    const reservations = await ReservationTransport.findAll({
      include: [
        {
          model: HoraireTransport,
          as: 'Horaire',
          where: { station_depart_id: superviseurStationId },
          include: [
            { model: Station, as: 'StationDepart' },
            { model: Station, as: 'StationArrivee' }
          ]
        },
        { model: Client, include: [{ model: Utilisateur, attributes: ['nom', 'prenom'] }] },
        { model: Station, as: 'StationDepartTransport' },
        { model: Station, as: 'StationArriveeTransport' }
      ]
    });

    res.json(reservations);
  } catch (err) {
    console.error("Erreur getReservationsForSuperviseur:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ✅ Superviseur confirme une réservation
 */
exports.confirmReservationTransport = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await ReservationTransport.findByPk(id);
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable." });

    reservation.statut = 'confirmée';
    await reservation.save();

    res.json({ message: "Réservation confirmée.", reservation });
  } catch (err) {
    console.error("Erreur confirmReservationTransport:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ❌ Superviseur annule une réservation
 */
exports.cancelBySuperviseur = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await ReservationTransport.findByPk(id);
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable." });

    reservation.statut = 'annulée';
    await reservation.save();

    res.json({ message: "Réservation annulée par superviseur.", reservation });
  } catch (err) {
    console.error("Erreur cancelBySuperviseur:", err.message);
    res.status(500).json({ error: err.message });
  }
};
