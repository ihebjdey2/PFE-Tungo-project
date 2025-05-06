require('dotenv').config();
const { Op } = require('sequelize');
const Station = require('../models/Station');
const Ville = require('../models/Ville');
const Itineraire = require('../models/Itineraire');


/* =============================
   SECTION 1 : ITINÉRAIRES
============================= */

// Ajouter un itinéraire
exports.ajouterItineraire = async (req, res) => {
  const { ville_pointA_id, ville_pointB_id, distance, duree_estimee, tarif_base } = req.body;

  try {
    const [villeA, villeB] = await Promise.all([
      Ville.findByPk(ville_pointA_id),
      Ville.findByPk(ville_pointB_id)
    ]);

    if (!villeA || !villeB) {
      return res.status(400).json({ message: "Une ou les deux villes spécifiées n'existent pas." });
    }

    const itineraireExiste = await Itineraire.findOne({
      where: { ville_pointA_id, ville_pointB_id },
    });

    if (itineraireExiste) {
      return res.status(400).json({ message: 'Un itinéraire entre ces deux villes existe déjà.' });
    }

    const nouvelItineraire = await Itineraire.create({
      ville_pointA_id,
      ville_pointB_id,
      distance,
      duree_estimee,
      tarif_base
    });

    res.status(201).json({
      message: 'Itinéraire ajouté avec succès.',
      itineraire: nouvelItineraire,
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'itinéraire:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Obtenir la liste des itinéraires
exports.getItineraires = async (req, res) => {
  try {
    const itineraires = await Itineraire.findAll({
      include: [
        { model: Ville, as: 'villePointA', attributes: ['nom'] },
        { model: Ville, as: 'villePointB', attributes: ['nom'] }
      ]
    });

    res.status(200).json(itineraires);
  } catch (error) {
    console.error('Erreur lors de la récupération des itinéraires:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Mettre à jour un itinéraire
exports.updateItineraire = async (req, res) => {
  const { id } = req.params;
  const { ville_pointA_id, ville_pointB_id, distance, duree_estimee, tarif_base } = req.body;

  try {
    const itineraire = await Itineraire.findByPk(id);
    if (!itineraire) {
      return res.status(404).json({ message: "Itinéraire non trouvé." });
    }

    await itineraire.update({
      ville_pointA_id,
      ville_pointB_id,
      distance,
      duree_estimee,
      tarif_base
    });

    res.status(200).json({ message: 'Itinéraire mis à jour avec succès.', itineraire });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'itinéraire:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Supprimer un itinéraire
exports.deleteItineraire = async (req, res) => {
  const { id } = req.params;

  try {
    const itineraire = await Itineraire.findByPk(id);
    if (!itineraire) {
      return res.status(404).json({ message: "Itinéraire non trouvé." });
    }

    await itineraire.destroy();
    res.status(200).json({ message: 'Itinéraire supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'itinéraire:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


/* =============================
   SECTION 2 : STATIONS
============================= */

// Ajouter une station
exports.ajouterStation = async (req, res) => {
  try {
    let { nom, villeId, destinations, latitude, longitude, adresse, telephone } = req.body;

    // Nettoyage des doublons
    destinations = [...new Set(destinations.map(Number))];

    const villeExiste = await Ville.findByPk(villeId);
    if (!villeExiste) {
      return res.status(404).json({ message: "Ville introuvable." });
    }

    const stationNomExistante = await Station.findOne({ where: { villeId, nom } });
    if (stationNomExistante) {
      return res.status(400).json({ message: "Une station avec ce nom existe déjà dans cette ville." });
    }

    if (!destinations || destinations.length === 0) {
      return res.status(400).json({ message: "Une station doit avoir au moins une destination." });
    }

    const villesDestinations = await Ville.findAll({ where: { id: destinations } });
    if (villesDestinations.length !== destinations.length) {
      return res.status(400).json({ message: "Une ou plusieurs destinations sont invalides." });
    }

    if (destinations.includes(Number(villeId))) {
      return res.status(400).json({ message: "Une station ne peut pas avoir sa propre ville comme destination." });
    }

    const stationsExistantes = await Station.findAll({ where: { villeId } });

    for (const station of stationsExistantes) {
      const intersection = destinations.filter(dest => station.destinations.includes(dest));
      if (intersection.length > 0) {
        return res.status(400).json({
          message: `Les destinations ${intersection.join(", ")} sont déjà attribuées à une autre station de cette ville.`
        });
      }
    }

    const station = await Station.create({
      nom, villeId, destinations, latitude, longitude, adresse, telephone
    });

    res.status(201).json({ message: "Station ajoutée avec succès.", station });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la station :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Modifier une station
exports.modifierStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    let { nom, destinations, latitude, longitude, adresse, telephone } = req.body;

    destinations = [...new Set(destinations.map(Number))];

    const station = await Station.findByPk(stationId);
    if (!station) {
      return res.status(404).json({ message: "Station introuvable." });
    }

    const stationNomExistante = await Station.findOne({
      where: { villeId: station.villeId, nom, id: { [Op.ne]: stationId } }
    });
    if (stationNomExistante) {
      return res.status(400).json({ message: "Une autre station avec ce nom existe déjà dans cette ville." });
    }

    if (!destinations || destinations.length === 0) {
      return res.status(400).json({ message: "Une station doit avoir au moins une destination." });
    }

    const villesDestinations = await Ville.findAll({ where: { id: destinations } });
    if (villesDestinations.length !== destinations.length) {
      return res.status(400).json({ message: "Une ou plusieurs destinations sont invalides." });
    }

    if (destinations.includes(station.villeId)) {
      return res.status(400).json({ message: "Une station ne peut pas avoir sa propre ville comme destination." });
    }

    const autresStations = await Station.findAll({
      where: { villeId: station.villeId, id: { [Op.ne]: stationId } }
    });

    for (const autreStation of autresStations) {
      const intersection = destinations.filter(dest => autreStation.destinations.includes(dest));
      if (intersection.length > 0) {
        return res.status(400).json({
          message: `Les destinations ${intersection.join(", ")} sont déjà attribuées à une autre station de cette ville.`
        });
      }
    }

    await station.update({ nom, destinations, latitude, longitude, adresse, telephone });

    res.status(200).json({ message: "Station mise à jour avec succès.", station });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la station :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Supprimer une station
exports.supprimerStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const station = await Station.findByPk(stationId);
    if (!station) {
      return res.status(404).json({ message: "Station introuvable." });
    }

    await station.destroy();
    res.status(200).json({ message: "Station supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la station :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Obtenir toutes les stations
exports.getStations = async (req, res) => {
  try {
    const stations = await Station.findAll();

    const stationsAvecNoms = await Promise.all(stations.map(async (station) => {
      const villesDestinations = await Ville.findAll({ where: { id: station.destinations } });
      return {
        ...station.toJSON(),
        destinations_noms: villesDestinations.map(v => v.nom)
      };
    }));

    res.status(200).json(stationsAvecNoms);
  } catch (error) {
    console.error("Erreur lors de la récupération des stations :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};
