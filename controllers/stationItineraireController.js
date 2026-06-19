require('dotenv').config();
const { Op } = require('sequelize');
const Station = require('../models/Station');
const Ville = require('../models/Ville');
const Itineraire = require('../models/Itineraire');
const ItineraireBus = require('../models/ItineraireBus');
const ItineraireTrain = require('../models/ItineraireTrain');




/* =============================
   VILLES
============================= */

// ➕ Ajouter une ville
exports.ajouterVille = async (req, res) => {
  try {
    const { nom } = req.body;

    if (!nom || nom.trim() === "") {
      return res.status(400).json({ message: "Le nom de la ville est obligatoire." });
    }

    // Vérifier si une ville avec le même nom existe déjà
    const villeExistante = await Ville.findOne({ where: { nom } });
    if (villeExistante) {
      return res.status(400).json({ message: "Une ville avec ce nom existe déjà." });
    }

    const nouvelleVille = await Ville.create({ nom: nom.trim() });

    res.status(201).json({ message: "Ville ajoutée avec succès.", ville: nouvelleVille });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la ville :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 📋 Obtenir toutes les villes
exports.getVilles = async (req, res) => {
  try {
    const villes = await Ville.findAll({ order: [['nom', 'ASC']] });
    res.status(200).json(villes);
  } catch (error) {
    console.error("Erreur lors de la récupération des villes :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ✏️ Modifier une ville
exports.modifierVille = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    const ville = await Ville.findByPk(id);
    if (!ville) {
      return res.status(404).json({ message: "Ville introuvable." });
    }

    if (!nom || nom.trim() === "") {
      return res.status(400).json({ message: "Le nom de la ville est obligatoire." });
    }

    // Vérifier si une autre ville avec le même nom existe déjà
    const villeExistante = await Ville.findOne({ where: { nom, id: { [Op.ne]: id } } });
    if (villeExistante) {
      return res.status(400).json({ message: "Une autre ville avec ce nom existe déjà." });
    }

    await ville.update({ nom: nom.trim() });

    res.status(200).json({ message: "Ville mise à jour avec succès.", ville });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la ville :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ❌ Supprimer une ville
exports.supprimerVille = async (req, res) => {
  try {
    const { id } = req.params;

    const ville = await Ville.findByPk(id);
    if (!ville) {
      return res.status(404).json({ message: "Ville introuvable." });
    }

    await ville.destroy();
    res.status(200).json({ message: "Ville supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la ville :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


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




// ➕ Ajouter un itinéraire Bus
exports.ajouterItineraireBus = async (req, res) => {
  const { ville_pointA_id, ville_pointB_id, distance, duree_estimee, tarif_bus } = req.body;

  try {
    if (ville_pointA_id === ville_pointB_id) {
      return res.status(400).json({ message: "Les deux villes doivent être différentes." });
    }

    // Vérifier que les villes existent
    const [villeA, villeB] = await Promise.all([
      Ville.findByPk(ville_pointA_id),
      Ville.findByPk(ville_pointB_id)
    ]);
    if (!villeA || !villeB) {
      return res.status(404).json({ message: "Ville de départ ou d'arrivée introuvable." });
    }

    // Vérifier doublon
    const existe = await ItineraireBus.findOne({ where: { ville_pointA_id, ville_pointB_id } });
    if (existe) {
      return res.status(400).json({ message: "Un itinéraire Bus entre ces villes existe déjà." });
    }

    // Créer
    const nouvelItineraire = await ItineraireBus.create({
      ville_pointA_id,
      ville_pointB_id,
      distance,
      duree_estimee,
      tarif_bus
    });

    res.status(201).json({ message: "Itinéraire Bus ajouté avec succès.", itineraire: nouvelItineraire });
  } catch (error) {
    console.error("Erreur ajout itinéraire Bus:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 📋 Obtenir tous les itinéraires Bus
exports.getItinerairesBus = async (req, res) => {
  try {
    const itineraires = await ItineraireBus.findAll({
      include: [
        { model: Ville, as: 'VilleDepartBus', attributes: ['id', 'nom'] },
        { model: Ville, as: 'VilleArriveeBus', attributes: ['id', 'nom'] }
      ]
    });
    res.status(200).json(itineraires);
  } catch (error) {
    console.error("Erreur récupération itinéraires Bus:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// ✏️ Modifier un itinéraire Bus
exports.modifierItineraireBus = async (req, res) => {
  const { id } = req.params;
  const { distance, duree_estimee, tarif_bus } = req.body;

  try {
    const itineraire = await ItineraireBus.findByPk(id);
    if (!itineraire) return res.status(404).json({ message: "Itinéraire Bus non trouvé." });

    await itineraire.update({ distance, duree_estimee, tarif_bus });
    res.status(200).json({ message: "Itinéraire Bus mis à jour avec succès.", itineraire });
  } catch (error) {
    console.error("Erreur modification itinéraire Bus:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ❌ Supprimer un itinéraire Bus
exports.supprimerItineraireBus = async (req, res) => {
  const { id } = req.params;

  try {
    const itineraire = await ItineraireBus.findByPk(id);
    if (!itineraire) return res.status(404).json({ message: "Itinéraire Bus non trouvé." });

    await itineraire.destroy();
    res.status(200).json({ message: "Itinéraire Bus supprimé avec succès." });
  } catch (error) {
    console.error("Erreur suppression itinéraire Bus:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// ➕ Ajouter un itinéraire Train
exports.ajouterItineraireTrain = async (req, res) => {
  const { ville_pointA_id, ville_pointB_id, distance, duree_estimee, tarif_train } = req.body;

  try {
    if (ville_pointA_id === ville_pointB_id) {
      return res.status(400).json({ message: "Les deux villes doivent être différentes." });
    }

    // Vérifier que les villes existent
    const [villeA, villeB] = await Promise.all([
      Ville.findByPk(ville_pointA_id),
      Ville.findByPk(ville_pointB_id)
    ]);
    if (!villeA || !villeB) {
      return res.status(404).json({ message: "Ville de départ ou d'arrivée introuvable." });
    }

    // Vérifier doublon
    const existe = await ItineraireTrain.findOne({ where: { ville_pointA_id, ville_pointB_id } });
    if (existe) {
      return res.status(400).json({ message: "Un itinéraire Train entre ces villes existe déjà." });
    }

    // Créer
    const nouvelItineraire = await ItineraireTrain.create({
      ville_pointA_id,
      ville_pointB_id,
      distance,
      duree_estimee,
      tarif_train
    });

    res.status(201).json({ message: "Itinéraire Train ajouté avec succès.", itineraire: nouvelItineraire });
  } catch (error) {
    console.error("Erreur ajout itinéraire Train:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 📋 Obtenir tous les itinéraires Train
exports.getItinerairesTrain = async (req, res) => {
  try {
    const itineraires = await ItineraireTrain.findAll({
      include: [
        { model: Ville, as: 'VilleDepartTrain', attributes: ['id', 'nom'] },
        { model: Ville, as: 'VilleArriveeTrain', attributes: ['id', 'nom'] }
      ]
    });
    res.status(200).json(itineraires);
  } catch (error) {
    console.error("Erreur récupération itinéraires Train:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// ✏️ Modifier un itinéraire Train
exports.modifierItineraireTrain = async (req, res) => {
  const { id } = req.params;
  const { distance, duree_estimee, tarif_train } = req.body;

  try {
    const itineraire = await ItineraireTrain.findByPk(id);
    if (!itineraire) return res.status(404).json({ message: "Itinéraire Train non trouvé." });

    await itineraire.update({ distance, duree_estimee, tarif_train });
    res.status(200).json({ message: "Itinéraire Train mis à jour avec succès.", itineraire });
  } catch (error) {
    console.error("Erreur modification itinéraire Train:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ❌ Supprimer un itinéraire Train
exports.supprimerItineraireTrain = async (req, res) => {
  const { id } = req.params;

  try {
    const itineraire = await ItineraireTrain.findByPk(id);
    if (!itineraire) return res.status(404).json({ message: "Itinéraire Train non trouvé." });

    await itineraire.destroy();
    res.status(200).json({ message: "Itinéraire Train supprimé avec succès." });
  } catch (error) {
    console.error("Erreur suppression itinéraire Train:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

/* =============================
   STATIONS
============================= */

// ➕ Ajouter une station
exports.ajouterStation = async (req, res) => {
  try {
    let { nom, villeId, type_station, destinations, latitude, longitude, adresse, telephone } = req.body;

    // Vérification du type_station
    if (!['louage', 'bus', 'train'].includes(type_station)) {
      return res.status(400).json({ message: "Type de station invalide. Doit être 'louage', 'bus' ou 'train'." });
    }

    // Vérifier que la ville existe
    const villeExiste = await Ville.findByPk(villeId);
    if (!villeExiste) {
      return res.status(404).json({ message: "Ville introuvable." });
    }

    // Vérifier qu’une station avec ce nom et ce type n’existe pas déjà dans cette ville
    const stationNomExistante = await Station.findOne({ where: { villeId, nom, type_station } });
    if (stationNomExistante) {
      return res.status(400).json({ message: "Une station avec ce nom et ce type existe déjà dans cette ville." });
    }

    // Vérification des destinations
    if (!destinations || destinations.length === 0) {
      return res.status(400).json({ message: "Une station doit avoir au moins une destination." });
    }

    // Nettoyage des doublons
    destinations = [...new Set(destinations.map(Number))];

    // Vérifier que toutes les destinations existent
    const villesDestinations = await Ville.findAll({ where: { id: destinations } });
    if (villesDestinations.length !== destinations.length) {
      return res.status(400).json({ message: "Une ou plusieurs destinations sont invalides." });
    }

    if (destinations.includes(Number(villeId))) {
      return res.status(400).json({ message: "Une station ne peut pas avoir sa propre ville comme destination." });
    }

    // Vérification doublons avec autres stations du même type dans la même ville
    const stationsExistantes = await Station.findAll({ where: { villeId, type_station } });
    for (const station of stationsExistantes) {
      const intersection = destinations.filter(dest => station.destinations.includes(dest));
      if (intersection.length > 0) {
        return res.status(400).json({
          message: `Les destinations ${intersection.join(", ")} sont déjà attribuées à une autre station de type ${type_station} dans cette ville.`
        });
      }
    }

    // Création de la station
    const station = await Station.create({
      nom, villeId, type_station, destinations, latitude, longitude, adresse, telephone
    });

    res.status(201).json({ message: "Station ajoutée avec succès.", station });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la station :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ✏️ Modifier une station
exports.modifierStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    let { nom, destinations, latitude, longitude, adresse, telephone } = req.body;

    const station = await Station.findByPk(stationId);
    if (!station) {
      return res.status(404).json({ message: "Station introuvable." });
    }

    // Nettoyage des doublons
    destinations = [...new Set(destinations.map(Number))];

    // Vérifier qu’une autre station avec ce nom et ce type n’existe pas déjà
    const stationNomExistante = await Station.findOne({
      where: { villeId: station.villeId, type_station: station.type_station, nom, id: { [Op.ne]: stationId } }
    });
    if (stationNomExistante) {
      return res.status(400).json({ message: "Une autre station avec ce nom et ce type existe déjà dans cette ville." });
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

    // Vérification doublons avec autres stations du même type
    const autresStations = await Station.findAll({
      where: { villeId: station.villeId, type_station: station.type_station, id: { [Op.ne]: stationId } }
    });

    for (const autreStation of autresStations) {
      const intersection = destinations.filter(dest => autreStation.destinations.includes(dest));
      if (intersection.length > 0) {
        return res.status(400).json({
          message: `Les destinations ${intersection.join(", ")} sont déjà attribuées à une autre station de type ${station.type_station} dans cette ville.`
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

// ❌ Supprimer une station
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

// 📋 Obtenir toutes les stations
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