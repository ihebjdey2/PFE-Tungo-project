const Chauffeur = require('../models/Chauffeur');
const Vehicule = require('../models/Vehicule');
const Itineraire = require('../models/Itineraire');
const ChauffeurPosition = require('../models/ChauffeurPosition');
const Ville = require('../models/Ville');
const Station = require('../models/Station');
const { Op } = require('sequelize');
const sequelize = require('../config/database')


// Récupérer les véhicules disponibles pour le chauffeur
exports.getVehiculesDisponibles = async (req, res) => {
  try {
    const chauffeur_id = req.user.id; 

    const chauffeur = await Chauffeur.findOne({ where: { utilisateur_id: chauffeur_id } });

    if (!chauffeur) {
      return res.status(404).json({ message: 'Chauffeur introuvable.' });
    }

    const vehicules = await Vehicule.findAll({
      where: { chauffeur_id, statut: 'disponible' },
    });

    if (vehicules.length === 0) {
      return res.status(404).json({ message: 'Aucun véhicule disponible.' });
    }

    res.status(200).json({ vehicules });
  } catch (error) {
    console.error("Erreur :", error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Choisir un véhicule
exports.choisirVehicule = async (req, res) => {
  const chauffeur_id = req.user.id;
  const { vehicule_id } = req.body;

  try {
    const chauffeur = await Chauffeur.findOne({ where: { utilisateur_id: chauffeur_id } });

    if (!chauffeur) {
      return res.status(404).json({ message: 'Chauffeur introuvable.' });
    }

    const vehicule = await Vehicule.findOne({ where: { id: vehicule_id, chauffeur_id, statut: 'disponible' } });

    if (!vehicule) {
      return res.status(400).json({ message: 'Véhicule non valide ou non disponible.' });
    }

    await ChauffeurPosition.upsert({
      chauffeur_id,
      vehicule_id,
      point_depart: null,
      destination: null,
      derniere_mise_a_jour: new Date(),
    });

    await Vehicule.update({ statut: 'en_trajet' }, { where: { id: vehicule.id } });

    res.status(200).json({ message: 'Véhicule sélectionné avec succès.', vehicule });

  } catch (err) {
    console.error("Erreur :", err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Récupérer l'itinéraire du véhicule sélectionné
exports.getItineraire = async (req, res) => {
  const chauffeurId = req.user.id; // ID du chauffeur connecté
  const { vehicule_id } = req.query; // Récupérer vehicule_id depuis la requête

  // Vérifier si vehicule_id est fourni
  if (!vehicule_id) {
    return res.status(400).json({ message: "Le paramètre 'vehicule_id' est requis." });
  }

  try {
    // Chercher l'itinéraire pour le véhicule donné
    const position = await ChauffeurPosition.findOne({
      where: { chauffeur_id: chauffeurId, vehicule_id },
      include: [
        {
          model: Vehicule,
          as: 'Vehicule',
          include: [
            {
              model: Itineraire,
              as: 'Itineraire',
              include: [
                { model: Ville, as: 'villePointA' },
                { model: Ville, as: 'villePointB' },
              ],
            },
          ],
        },
      ],
    });

    // Si aucune position ou itinéraire trouvé
    if (!position || !position.Vehicule || !position.Vehicule.Itineraire) {
      return res.status(404).json({ message: "Aucun itinéraire trouvé pour ce véhicule." });
    }

    // Extraire les données de l'itinéraire
    const itineraire = position.Vehicule.Itineraire;
    const response = {
      id: itineraire.id,
      ville_1: {
        id: itineraire.villePointA.id,
        nom: itineraire.villePointA.nom,
      },
      ville_2: {
        id: itineraire.villePointB.id,
        nom: itineraire.villePointB.nom,
      },
      distance: itineraire.distance,
      duree_estimee: itineraire.duree_estimee,
      tarif_base: itineraire.tarif_base,
    };

    // Retourner la réponse
    return res.status(200).json({ itineraire: response });
  } catch (err) {
    console.error("Erreur lors de la récupération de l'itinéraire :", err.message);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// Choisir un itinéraire en définissant le point de départ et la destination
exports.choisirItineraire = async (req, res) => {
  const chauffeur_id = req.user.id;
  const { point_depart_id } = req.body;

  try {
    const position = await ChauffeurPosition.findOne({
      where: { chauffeur_id },
      include: [
        { model: Vehicule, as: 'Vehicule', include: [{ model: Itineraire, as: 'Itineraire' }] },
      ],
    });

    if (!position || !position.Vehicule) {
      return res.status(404).json({ message: 'Aucun véhicule sélectionné.' });
    }

    const itineraire = position.Vehicule.Itineraire;
    if (!itineraire) {
      return res.status(404).json({ message: "Itinéraire introuvable." });
    }

    // Vérification des villes de départ et d'arrivée
    if (![itineraire.ville_pointA_id, itineraire.ville_pointB_id].includes(point_depart_id)) {
      return res.status(400).json({ message: 'Point de départ invalide.' });
    }

    const destination_id = point_depart_id === itineraire.ville_pointA_id ? itineraire.ville_pointB_id : itineraire.ville_pointA_id;

    // Récupérer les noms des villes à partir des ID
    const departVille = await Ville.findByPk(point_depart_id);
    const destinationVille = await Ville.findByPk(destination_id);

    await ChauffeurPosition.upsert({
      chauffeur_id,
      vehicule_id: position.vehicule_id,
      point_depart: point_depart_id,
      destination: destination_id,
      derniere_mise_a_jour: new Date(),
    });

    res.status(200).json({
      message: 'Itinéraire mis à jour avec succès.',
      itineraire: {
        point_depart: {
          id: departVille.id,
          nom: departVille.nom
        },
        destination: {
          id: destinationVille.id,
          nom: destinationVille.nom
        },
      },
    });
  } catch (err) {
    console.error("Erreur :", err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


exports.getStationsPourTrajet = async (req, res) => {
  try {
      const { ville_depart_id, ville_destination_id } = req.query;

      // Vérifier l'existence des villes
      const villeDepart = await Ville.findByPk(ville_depart_id);
      const villeDestination = await Ville.findByPk(ville_destination_id);

      if (!villeDepart || !villeDestination) {
          return res.status(400).json({ message: "Le point de départ ou la destination est invalide." });
      }

      // Trouver la station fixe de départ correspondant à la ville de départ et destination
      const stationDepart = await Station.findOne({
          where: {
              villeId: ville_depart_id,
              destinations: { [Op.contains]: [ville_destination_id] }
          }
      });

      if (!stationDepart) {
          return res.status(404).json({ message: "Aucune station de départ disponible pour cet itinéraire." });
      }

      // Trouver la station d’arrivée correspondant à la ville de destination qui dessert la ville de départ
      const stationArrivee = await Station.findOne({
          where: {
              villeId: ville_destination_id,
              destinations: { [Op.contains]: [ville_depart_id] }
          }
      });

      if (!stationArrivee) {
          return res.status(404).json({ message: "Aucune station d’arrivée ne dessert la ville de départ." });
      }

      res.status(200).json({
          station_depart: {
              id: stationDepart.id,
              nom: stationDepart.nom,
              adresse: stationDepart.adresse,
              telephone: stationDepart.telephone
          },
          station_arrivee: {
              id: stationArrivee.id,
              nom: stationArrivee.nom,
              adresse: stationArrivee.adresse,
              telephone: stationArrivee.telephone
          }
      });

  } catch (error) {
      console.error("Erreur lors de la récupération des stations :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// Initialiser la position du chauffeur
// Initialiser les coordonnées GPS du chauffeur (latitude / longitude uniquement)
exports.initPosition = async (req, res) => {
  try {
    const chauffeur_id = req.user.id;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude et longitude sont obligatoires.' });
    }

    // Vérifier que le chauffeur a déjà une ligne active dans chauffeur_positions
    const positionExistante = await ChauffeurPosition.findOne({ where: { chauffeur_id } });

    if (!positionExistante) {
      return res.status(404).json({ message: 'Aucune position trouvée. Sélectionnez d’abord un véhicule et un itinéraire.' });
    }

    // Mettre à jour uniquement la position GPS
    positionExistante.latitude = latitude;
    positionExistante.longitude = longitude;
    positionExistante.derniere_mise_a_jour = new Date();
    await positionExistante.save();

    res.status(200).json({ message: 'Position GPS initialisée avec succès.' });

  } catch (err) {
    console.error('Erreur lors de l’initialisation GPS :', err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};



exports.mettreAJourPosition = async (req, res) => {
  try {
    const chauffeur_id = req.user.id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude et longitude sont obligatoires.' });
    }

    const positionExistante = await ChauffeurPosition.findOne({ where: { chauffeur_id } });

    if (!positionExistante) {
      return res.status(404).json({ error: 'Position non initialisée pour ce chauffeur.' });
    }

    // ✅ Modifier uniquement latitude/longitude
    positionExistante.latitude = latitude;
    positionExistante.longitude = longitude;
    positionExistante.derniere_mise_a_jour = new Date();
    await positionExistante.save();

    res.status(200).json({ message: 'Position mise à jour avec succès.' });

  } catch (error) {
    console.error('Erreur mise à jour position chauffeur :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la position.' });
  }
};







