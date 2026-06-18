const ClientRecherche = require('../models/ClientRecherche');
const ChauffeurPosition = require('../models/ChauffeurPosition');
const Utilisateur = require('../models/Utilisateur');
const Chauffeur = require('../models/Chauffeur');
const Vehicule = require('../models/Vehicule');
const Ville = require('../models/Ville');
const Station = require('../models/Station');
const { Op } = require('sequelize');
const sequelize = require('../config/database')

exports.createRecherche = async (req, res) => {
  const { point_depart_id, destination_id } = req.body;  
  const client_id = req.user.id;

  try {
    // Vérification de l'existence des villes
    const depart = await Ville.findByPk(point_depart_id);
    const destination = await Ville.findByPk(destination_id);

    if (!depart || !destination) {
      return res.status(400).json({ message: 'Le point de départ ou la destination est invalide.' });
    }

    if (point_depart_id === destination_id) {
      return res.status(400).json({ message: 'Le point de départ et la destination doivent être différents.' });
    }

    // Vérification d'une recherche existante
    const existingRecherche = await ClientRecherche.findOne({ where: { client_id } });

    if (existingRecherche) {
      // Mise à jour de la recherche existante
      await existingRecherche.update({
        point_depart: point_depart_id,
        destination: destination_id,
        heure_recherche: new Date()
      });

      return res.status(200).json({
        message: 'Recherche mise à jour avec succès.',
        recherche: {
          client_id,
          point_depart_id,
          point_depart: depart.nom,
          destination_id,
          destination: destination.nom
        }
      });
    }

    // Création d'une nouvelle recherche si elle n'existe pas encore
    const recherche = await ClientRecherche.create({
      client_id,
      point_depart: point_depart_id,
      destination: destination_id,
    });

    res.status(201).json({
      message: 'Recherche créée avec succès.',
      recherche: {
        client_id,
        point_depart_id,
        point_depart: depart.nom,
        destination_id,
        destination: destination.nom
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la recherche :', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};



exports.getChauffeursDisponibles = async (req, res) => {
  const { point_depart_id, destination_id, limit = 10, offset = 0 } = req.query;

  try {
    const depart = await Ville.findByPk(point_depart_id);
    const destination = await Ville.findByPk(destination_id);

    if (!depart || !destination) {
      return res.status(400).json({ message: 'Le point de départ ou la destination est invalide.' });
    }

    if (point_depart_id === destination_id) {
      return res.status(400).json({ message: 'Le point de départ et la destination doivent être différents.' });
    }

    const chauffeurs = await ChauffeurPosition.findAll({
      where: { point_depart: point_depart_id, destination: destination_id, priorite: 1 },
      include: [
        {
          model: Chauffeur,
          include: [{ model: Utilisateur, attributes: ['nom', 'prenom', 'image'] }],
        },
        { model: Vehicule, as: 'Vehicule', attributes: ['marque', 'modele', 'numero_de_plaques', 'capacite'] },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    if (chauffeurs.length === 0) {
      return res.status(404).json({ message: 'Aucun chauffeur disponible pour cet itinéraire.' });
    }

    const host = req.get('host');       // ex: localhost:3000
    const protocol = req.protocol;      // http ou https

    const resultat = chauffeurs.map((position) => {
      const filename = position.Chauffeur.Utilisateur.image;
      const imageUrl = filename ? `${protocol}://${host}/uploads/${filename}` : null;

      return {
        chauffeur_id: position.chauffeur_id,
        nom: position.Chauffeur.Utilisateur.nom,
        prenom: position.Chauffeur.Utilisateur.prenom,
        image: imageUrl,
        ville_depart: depart.nom,
        ville_destination: destination.nom,
        vehicule: {
          marque: position.Vehicule.marque,
          modele: position.Vehicule.modele,
          numero_de_plaques: position.Vehicule.numero_de_plaques,
          capacite: position.Vehicule.capacite,
        },
        priorite: position.priorite,
      };
    });

    res.status(200).json({
      total: chauffeurs.length,
      data: resultat,
    });

  } catch (error) {
    console.error('Erreur lors de la recherche des chauffeurs disponibles :', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


exports.cancelRecherche = async (req, res) => {
  const client_id = req.user.id;

  try {
    const recherche = await ClientRecherche.findOne({ where: { client_id } });

    if (!recherche) {
      return res.status(404).json({ message: "Aucune recherche active trouvée." });
    }

    await recherche.destroy();
    res.status(200).json({ message: "Recherche annulée avec succès." });

  } catch (error) {
    console.error("Erreur lors de l'annulation de la recherche :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};



exports.getAllVilles = async (req, res) => {
  try {
    const villes = await Ville.findAll({
      attributes: ['id', 'nom'],  // Retourne l'ID et le nom des villes
    });

    res.status(200).json(villes);
  } catch (error) {
    console.error('Erreur lors de la récupération des villes :', error.message);
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

      // Trouver la station d'arrivée correspondant à la ville de destination qui dessert la ville de départ
      const stationArrivee = await Station.findOne({
          where: {
              villeId: ville_destination_id,
              destinations: { [Op.contains]: [ville_depart_id] }
          }
      });

      if (!stationArrivee) {
          return res.status(404).json({ message: "Aucune station d'arrivée ne dessert la ville de départ." });
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


