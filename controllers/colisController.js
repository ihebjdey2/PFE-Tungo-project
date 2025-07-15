const Colis = require('../models/Colis');
const Chauffeur = require('../models/Chauffeur');
const Ville = require('../models/Ville');
const { Op } = require('sequelize');
const Itineraire = require('../models/Itineraire');
const Station = require('../models/Station');
const Superviseur = require('../models/Superviseur');
const ChauffeurPosition = require('../models/ChauffeurPosition'); 

// 📦 Créer un colis (POST /colis)
exports.creerColis = async (req, res) => {
  try {
    const client_id = req.user.id;
    const {
      ville_depart_id,
      ville_destination_id,
      description,
      poids,
      prix,
      nom_destinataire,
      numero_destinataire
    } = req.body;

    // Vérifier que les villes sont valides
    const villeDepart = await Ville.findByPk(ville_depart_id);
    const villeDestination = await Ville.findByPk(ville_destination_id);
    if (!villeDepart || !villeDestination) {
      return res.status(400).json({ message: "Villes invalides." });
    }

    // Chercher un itinéraire valide
    const itineraire = await Itineraire.findOne({
      where: {
        [Op.or]: [
          { ville_pointA_id: ville_depart_id, ville_pointB_id: ville_destination_id },
          { ville_pointA_id: ville_destination_id, ville_pointB_id: ville_depart_id }
        ]
      }
    });
    if (!itineraire) {
      return res.status(404).json({ message: "Aucun itinéraire disponible." });
    }

    // Chercher les stations
    const stationDepart = await Station.findOne({
      where: {
        villeId: ville_depart_id,
        destinations: { [Op.contains]: [ville_destination_id] }
      }
    });

    const stationArrivee = await Station.findOne({
      where: {
        villeId: ville_destination_id,
        destinations: { [Op.contains]: [ville_depart_id] }
      }
    });

    if (!stationDepart || !stationArrivee) {
      return res.status(404).json({ message: "Stations non trouvées pour cet itinéraire." });
    }

    // Créer le colis
    const colis = await Colis.create({
      client_id,
      station_depart_id: stationDepart.id,
      station_arrivee_id: stationArrivee.id,
      description,
      poids,
      prix,
      nom_destinataire,
      numero_destinataire,
      statut: 'en_attente',
      date_envoi: new Date()
    });

    res.status(201).json({ message: "Colis créé avec succès", colis });

  } catch (error) {
    console.error("Erreur création colis :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// 📋 Liste des colis d’un client connecté
exports.colisParClient = async (req, res) => {
  try {
    const client_id = req.user.id;
    const colis = await Colis.findAll({ where: { client_id } });
    res.status(200).json(colis);
  } catch (error) {
    console.error('Erreur récupération colis client :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des colis' });
  }
};

// 🚚 Liste des colis d’un chauffeur connecté
exports.colisParChauffeur = async (req, res) => {
  try {
    const chauffeur_id = req.user.id;

    const colis = await Colis.findAll({
      where: {
        chauffeur_id,
        statut: 'pris_en_charge'
      }
    });

    res.status(200).json(colis);
  } catch (error) {
    console.error('Erreur récupération colis chauffeur :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des colis' });
  }
};

// 🚚 Liste des colis EN LIVRAISON du chauffeur connecté
exports.colisEnLivraisonParChauffeur = async (req, res) => {
  try {
    const chauffeur_id = req.user.id;

    const colis = await Colis.findAll({
      where: {
        chauffeur_id,
        statut: 'en_livraison'
      }
    });

    res.status(200).json(colis);
  } catch (error) {
    console.error('Erreur récupération colis en livraison :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des colis en livraison' });
  }
};

// ⏳ Liste des colis en attente d’affectation (GET /colis/attente)
exports.colisEnAttente = async (req, res) => {
  try {
    const superviseurId = req.user.id;
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
      const colis = await Colis.findAll({
        where: {
          statut: 'en_attente',
          station_depart_id: station.id
        },
        include: [
          {
            model: Station,
            as: 'StationArrivee',
            where: { villeId: destinationId },
            include: [{ model: Ville, attributes: ['id', 'nom'] }]
          }
        ]
      });

      const mapped = colis.map(c => ({
        id: c.id,
        description: c.description,
        poids: c.poids,
        date_envoi: c.date_envoi,
        station_arrivee: c.StationArrivee?.Ville?.nom,
        station_depart_id: c.station_depart_id
      }));

      result.push({
        destinationId,
        colis: mapped
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
      destinationNom: idToNom[r.destinationId] || "Inconnue",
      colis: r.colis
    }));

    res.status(200).json({
      superviseurId,
      station_depart: station.nom,
      villeNom: station.Ville?.nom || "Inconnue",
      result: resultAvecNoms
    });

  } catch (error) {
    console.error("Erreur dans colisEnAttente :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// 🔁 Affecter un chauffeur (PUT /colis/:id/affecter)
exports.affecterChauffeur = async (req, res) => {
  try {
    const { id } = req.params;
    const { chauffeur_id } = req.body;

    const colis = await Colis.findByPk(id);
    if (!colis) return res.status(404).json({ error: 'Colis non trouvé' });

    colis.chauffeur_id = chauffeur_id;
    colis.statut = 'pris_en_charge';
    await colis.save();

    res.status(200).json({ message: 'Chauffeur affecté avec succès', colis });
  } catch (error) {
    console.error('Erreur affectation chauffeur :', error);
    res.status(500).json({ error: 'Erreur lors de l\'affectation du chauffeur' });
  }
};

// 🧾 Mise à jour du statut (PUT /colis/:id/statut)
exports.mettreAJourStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const colis = await Colis.findByPk(id);
    if (!colis) return res.status(404).json({ error: 'Colis non trouvé' });

    colis.statut = statut;

    if (statut === 'livré') {
      colis.date_livraison = new Date();
    }

    await colis.save();
    res.status(200).json({ message: 'Statut mis à jour', colis });
  } catch (error) {
    console.error('Erreur mise à jour statut :', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
};

// ✅ Marquer comme livré (PUT /colis/:id/marquer-livre)
exports.marquerLivre = async (req, res) => {
  try {
    const { id } = req.params;
    const { code_retrait } = req.body;

    const colis = await Colis.findByPk(id);
    if (!colis) return res.status(404).json({ error: 'Colis non trouvé' });

    if (colis.code_retrait !== code_retrait) {
      return res.status(403).json({ error: 'Code de retrait incorrect' });
    }

    colis.statut = 'livré';
    colis.date_livraison = new Date();
    await colis.save();

    res.status(200).json({ message: 'Colis marqué comme livré', colis });
  } catch (error) {
    console.error('Erreur lors de la livraison du colis :', error);
    res.status(500).json({ error: 'Erreur lors de la livraison du colis' });
  }
};

// 🏢 Déposer à la station (PUT /colis/:id/deposer-station)
exports.deposerAStation = async (req, res) => {
  try {
    const { id } = req.params;

    const colis = await Colis.findByPk(id);
    if (!colis) return res.status(404).json({ error: 'Colis non trouvé' });

    colis.statut = 'déposé_station';
    await colis.save();

    res.status(200).json({ message: 'Colis déposé à la station', colis });
  } catch (error) {
    console.error('Erreur dépôt station :', error);
    res.status(500).json({ error: 'Erreur lors du dépôt à la station' });
  }
};

// 🎯 Suivi d’un colis via code de retrait (POST /colis/suivre)
exports.suivreColisParCode = async (req, res) => {
  try {
    const { code_retrait } = req.body;

    const colis = await Colis.findOne({
      where: { code_retrait },
      include: [
        { model: Station, as: 'StationDepart' },
        { model: Station, as: 'StationArrivee' },
        { model: Chauffeur }
      ]
    });

    if (!colis) return res.status(404).json({ error: 'Colis non trouvé' });

    // Récupérer la dernière position enregistrée du chauffeur
    let position = null;
    if (colis.chauffeur_id && colis.statut === 'en_livraison') {
      position = await ChauffeurPosition.findOne({
        where: { chauffeur_id: colis.chauffeur_id },
        order: [['derniere_mise_a_jour', 'DESC']]
      });
    }

    res.status(200).json({
      description: colis.description,
      statut: colis.statut,
      date_envoi: colis.date_envoi,
      date_livraison: colis.date_livraison,
      station_depart: {
        nom: colis.StationDepart?.nom,
        latitude: colis.StationDepart?.latitude,
        longitude: colis.StationDepart?.longitude,
      },
      station_arrivee: {
        nom: colis.StationArrivee?.nom,
        latitude: colis.StationArrivee?.latitude,
        longitude: colis.StationArrivee?.longitude,
      },
      position_chauffeur: position
        ? {
            latitude: position.latitude,
            longitude: position.longitude,
            updatedAt: position.derniere_mise_a_jour
          }
        : null,
      message:
        colis.statut === 'déposé_station'
          ? 'Colis disponible à la station'
          : colis.statut === 'livré'
          ? 'Colis livré'
          : `Statut actuel : ${colis.statut}`
    });
  } catch (error) {
    console.error('Erreur suivi colis destinataire :', error);
    res.status(500).json({ error: 'Erreur lors du suivi du colis' });
  }
};



 // ✅ Liste des colis livrés (statut = "livré") pour un chauffeur
exports.colisLivres = async (req, res) => {
  try {
    const chauffeur_id = req.user.id;

    const colis = await Colis.findAll({
      where: {
        chauffeur_id,
        statut: ['livré', 'déposé_station'] // ⬅️ on filtre les deux statuts
      },
      order: [['date_livraison', 'DESC']]
    });

    res.status(200).json(colis);
  } catch (error) {
    console.error('Erreur récupération historique colis :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l’historique' });
  }
};
// 📄 Détails d’un colis appartenant au client connecté
exports.getColisByIdForClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.user.id;

    const colis = await Colis.findOne({
      where: {
        id,
        client_id
      },
      include: [
        { model: Station, as: 'StationDepart' },
        { model: Station, as: 'StationArrivee' },
        { model: Chauffeur, include: ['Utilisateur'] },
      ]
    });

    if (!colis) {
      return res.status(404).json({ error: 'Colis non trouvé ou accès interdit' });
    }

    res.status(200).json(colis);
  } catch (error) {
    console.error('Erreur getColisByIdForClient:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
