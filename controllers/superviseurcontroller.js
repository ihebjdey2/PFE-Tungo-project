const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Utilisateur = require('../models/Utilisateur');
const Superviseur = require('../models/Superviseur');
const Itineraire = require('../models/Itineraire');
const Ville = require('../models/Ville');
const Reservation = require('../models/Reservation');
const Client = require('../models/Client');

const path = require('path');
const fs = require('fs');
const Station = require('../models/Station');
const Vehicule = require('../models/Vehicule');
const Chauffeur = require('../models/Chauffeur');
const ChauffeurPosition = require('../models/ChauffeurPosition');
const { Op } = require('sequelize');


//RECUPERER LA LISTE DES CHAUFFEURS POUR CHAQUE DESTINATION
exports.getChauffeursForSuperviseurDestinations = async (req, res) => {
  const { superviseurId } = req.params;

  try {
    const superviseur = await Superviseur.findByPk(superviseurId);
    if (!superviseur) return res.status(404).json({ message: "Superviseur introuvable" });

    const station = await Station.findByPk(superviseur.station_id, {
      include: [{ model: Ville, attributes: ['id', 'nom'] }]
    });
    if (!station) return res.status(404).json({ message: "Station introuvable" });

    const villeId = station.villeId;
    const villeNom = station.Ville?.nom || "Inconnue";
    const stationNom = station.nom;
    const destinationIds = superviseur.destinations;

    const result = [];

    for (const destinationId of destinationIds) {
      const itineraires = await Itineraire.findAll({
        where: {
          [Op.or]: [
            { ville_pointA_id: villeId, ville_pointB_id: destinationId },
            { ville_pointA_id: destinationId, ville_pointB_id: villeId }
          ]
        }
      });

      const itineraireIds = itineraires.map(it => it.id);
      if (itineraireIds.length === 0) {
        result.push({ destinationId, chauffeurs: [], disponibles: 0 });
        continue;
      }

      const vehicules = await Vehicule.findAll({
        where: { itineraire_id: itineraireIds },
        include: [
          {
            model: Chauffeur,
            include: [
              {
                model: Utilisateur,
                attributes: ['id', 'nom', 'prenom', 'email', 'numeroDeTelephone', 'image']
              }
            ]
          },
          {
            model: Itineraire,
            as: 'Itineraire',
            include: [
              { model: Ville, as: 'villePointA', attributes: ['id', 'nom'] },
              { model: Ville, as: 'villePointB', attributes: ['id', 'nom'] }
            ]
          }
        ]
      });

      const chauffeurs = vehicules.map(v => ({
        chauffeurId: v.Chauffeur?.utilisateur_id,
        nom: v.Chauffeur?.Utilisateur?.nom,
        prenom: v.Chauffeur?.Utilisateur?.prenom,
        email: v.Chauffeur?.Utilisateur?.email,
        telephone: v.Chauffeur?.Utilisateur?.numeroDeTelephone,
        image: v.Chauffeur?.Utilisateur?.image,
        vehicule: {
          id: v.id,
          marque: v.marque,
          modele: v.modele,
          itineraire: {
            pointA: v.Itineraire?.villePointA?.nom,
            pointB: v.Itineraire?.villePointB?.nom
          }
        }
      })).filter(ch => ch.chauffeurId);

      const disponiblesCount = await ChauffeurPosition.count({
        where: {
          point_depart: villeId,
          destination: destinationId
        }
      });

      result.push({ destinationId, chauffeurs, disponibles: disponiblesCount });
    }

    const villes = await Ville.findAll({
      where: { id: destinationIds },
      attributes: ['id', 'nom']
    });

    const idToNom = {};
    villes.forEach(v => {
      idToNom[v.id] = v.nom;
    });

    const resultAvecNoms = result.map(r => ({
      destinationId: r.destinationId,
      destinationNom: idToNom[r.destinationId] || "Inconnu",
      chauffeurs: r.chauffeurs,
      disponibles: r.disponibles
    }));

    res.status(200).json({
      superviseurId,
      villeId,
      villeNom,
      stationNom,
      result: resultAvecNoms
    });

  } catch (error) {
    console.error('Erreur dans getChauffeursForSuperviseurDestinations:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
// RECUPERER LA LISTE DES RESERVATION TYPE VEHICULE POUR CHAQUE DESTINATIONS
exports.getVehiculeReservationsForSuperviseur = async (req, res) => {
  const { superviseurId } = req.params;

  try {
    const superviseur = await Superviseur.findByPk(superviseurId);
    if (!superviseur) return res.status(404).json({ message: "Superviseur introuvable" });

    const station = await Station.findByPk(superviseur.station_id, {
      include: [{ model: Ville, attributes: ['id', 'nom'] }]
    });
    if (!station) return res.status(404).json({ message: "Station introuvable" });

    const villeDepartId = station.villeId;
    const destinationIds = superviseur.destinations;

    const result = [];

    for (const destinationId of destinationIds) {
      const itineraires = await Itineraire.findAll({
        where: {
          [Op.or]: [
            { ville_pointA_id: villeDepartId, ville_pointB_id: destinationId },
            { ville_pointA_id: destinationId, ville_pointB_id: villeDepartId }
          ]
        }
      });

      const itineraireIds = itineraires.map(i => i.id);
      if (itineraireIds.length === 0) {
        result.push({ destinationId, reservations: [] });
        continue;
      }

      const reservations = await Reservation.findAll({
        where: {
          type_reservation: 'vehicule',
          statut: 'en_attente',
          itineraire_id: { [Op.in]: itineraireIds },
          station_depart_id: superviseur.station_id
        },
        include: [
          {
            model: Station,
            as: 'StationArrivee',
            include: [{ model: Ville }]
          },
          {
            model: Itineraire,
            as: 'Itineraire',
            include: [
              { model: Ville, as: 'villePointA', attributes: ['id', 'nom'] },
              { model: Ville, as: 'villePointB', attributes: ['id', 'nom'] }
            ]
          },
          {
            model: Client,
            include: [{ model: Utilisateur, attributes: ['nom', 'prenom'] }]
          }
        ]
      });

      // Filtrer les réservations selon la ville de destination (StationArrivee.villeId)
      const filteredReservations = reservations.filter(r =>
        r.StationArrivee && destinationIds.includes(r.StationArrivee.villeId)
      );

      const mapped = filteredReservations.map(r => ({
        id: r.id,
        date_reservation: r.date_reservation,
        heure_depart: r.heure_depart,
        prix: r.prix,
        client: {
          nom: r.Client?.Utilisateur?.nom,
          prenom: r.Client?.Utilisateur?.prenom
        },
        itineraire: {
          id: r.itineraire_id,
          pointA: r.Itineraire?.villePointA?.nom,
          pointB: r.Itineraire?.villePointB?.nom
        },
        station_arrivee: r.StationArrivee?.Ville?.nom
      }));

      result.push({
        destinationId,
        reservations: mapped
      });
    }

    const villes = await Ville.findAll({
      where: { id: destinationIds },
      attributes: ['id', 'nom']
    });
    const idToNom = {};
    villes.forEach(v => { idToNom[v.id] = v.nom });

    const resultAvecNoms = result.map(r => ({
      destinationId: r.destinationId,
      destinationNom: idToNom[r.destinationId] || "Inconnu",
      reservations: r.reservations
    }));

    res.status(200).json({
      superviseurId,
      station_depart: station.nom,
      result: resultAvecNoms
    });

  } catch (error) {
    console.error("Erreur dans getVehiculeReservationsForSuperviseur:", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// RECUPERER LA LISTE DES VOITURES DU CHAUUFEUR A AFFECTER A LA  RESERVATION 
exports.getCompatibleVehiculesForChauffeurReservation = async (req, res) => {
  const { chauffeur_id, reservation_id } = req.params;

  try {
    // 🔍 Récupérer la réservation avec l'itinéraire
    const reservation = await Reservation.findByPk(reservation_id, {
      include: [{ model: Itineraire, as: 'Itineraire' }]
    });

    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    const itineraireReservation = reservation.Itineraire;

    // 🔍 Récupérer tous les véhicules du chauffeur qui ont le même itinéraire (dans un sens ou l'autre)
    const vehicules = await Vehicule.findAll({
      where: { chauffeur_id },
      include: [{
        model: Itineraire,
        as: 'Itineraire',
        where: {
          [Op.or]: [
            {
              ville_pointA_id: itineraireReservation.ville_pointA_id,
              ville_pointB_id: itineraireReservation.ville_pointB_id
            },
            {
              ville_pointA_id: itineraireReservation.ville_pointB_id,
              ville_pointB_id: itineraireReservation.ville_pointA_id
            }
          ]
        }
      }],
      attributes: ['id', 'marque', 'modele', 'numero_de_plaques', 'capacite']
    });

    if (vehicules.length === 0) {
      return res.status(404).json({ message: "Aucun véhicule compatible trouvé pour ce chauffeur." });
    }

    res.status(200).json({
      chauffeur_id,
      reservation_id,
      itineraire_id: itineraireReservation.id,
      vehicules
    });

  } catch (error) {
    console.error("Erreur dans getCompatibleVehiculesForChauffeurReservation:", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// AFFECTER LE CHAUFFEUR ET SON VOITURE 
exports.assignChauffeurToVehiculeReservation = async (req, res) => {
  const superviseur_id = req.user.id;
  const { reservation_id, chauffeur_id, vehicule_id } = req.body;

  try {
    const superviseur = await Superviseur.findByPk(superviseur_id);
    if (!superviseur) return res.status(404).json({ message: "Superviseur introuvable." });

    const reservation = await Reservation.findByPk(reservation_id, {
      include: [{ model: Itineraire, as: 'Itineraire' }]
    });
    if (!reservation || reservation.type_reservation !== 'vehicule' || reservation.statut !== 'en_attente') {
      return res.status(400).json({ message: "Réservation invalide ou déjà traitée." });
    }

    if (reservation.station_depart_id !== superviseur.station_id) {
      return res.status(403).json({ message: "Réservation non gérée par votre station." });
    }

    const stationArrivee = await Station.findByPk(reservation.station_arrivee_id);
    if (!stationArrivee || !superviseur.destinations.includes(stationArrivee.villeId)) {
      return res.status(403).json({ message: "Ville de destination non autorisée." });
    }

    // 🔍 Vérifier le véhicule choisi
    const vehicule = await Vehicule.findOne({
      where: { id: vehicule_id, chauffeur_id },
      include: [{ model: Itineraire, as: 'Itineraire' }]
    });

    if (!vehicule) return res.status(404).json({ message: "Véhicule introuvable pour ce chauffeur." });

    // Vérifier que l'itinéraire du véhicule correspond
    const matchItineraire =
      (vehicule.Itineraire.ville_pointA_id === reservation.Itineraire.ville_pointA_id &&
       vehicule.Itineraire.ville_pointB_id === reservation.Itineraire.ville_pointB_id) ||
      (vehicule.Itineraire.ville_pointA_id === reservation.Itineraire.ville_pointB_id &&
       vehicule.Itineraire.ville_pointB_id === reservation.Itineraire.ville_pointA_id);

    if (!matchItineraire) {
      return res.status(400).json({ message: "L’itinéraire du véhicule ne correspond pas à celui de la réservation." });
    }

    // ✅ Affecter
    reservation.chauffeur_id = chauffeur_id;
    reservation.vehicule_id = vehicule_id;
    reservation.nombre_places = vehicule.capacite;
    await reservation.save();

    res.status(200).json({
      message: "Chauffeur et véhicule affectés avec succès.",
      reservation
    });

  } catch (error) {
    console.error("❌ Erreur assignation chauffeur :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.getStationForSuperviseur = async (req, res) => {
  try {
    const { id } = req.params;

    const superviseur = await Superviseur.findByPk(id, {
      include: {
        model: Station,
        include: [{ model: Ville, attributes: ['id', 'nom'] }]
      }
    });

    if (!superviseur) {
      return res.status(404).json({ message: "Superviseur introuvable" });
    }

    const station = superviseur.Station;
    if (!station) {
      return res.status(404).json({ message: "Aucune station associée à ce superviseur" });
    }

    res.json({
      station: {
        id: station.id,
        nom: station.nom,
        villeId: station.Ville ? station.Ville.id : null,   // 🔥 ajout de l’ID
        villeNom: station.Ville ? station.Ville.nom : null, 
        type_station: station.type_station
      }
    });
  } catch (err) {
    console.error("Erreur getStationForSuperviseur:", err.message);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};


