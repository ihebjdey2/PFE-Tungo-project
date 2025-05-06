const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Utilisateur = require('../models/Utilisateur');
const Superviseur = require('../models/Superviseur');
const Itineraire = require('../models/Itineraire');
const Ville = require('../models/Ville');
const path = require('path');
const fs = require('fs');
const Station = require('../models/Station');
const Vehicule = require('../models/Vehicule');
const Chauffeur = require('../models/Chauffeur');
const ChauffeurPosition = require('../models/ChauffeurPosition');
const { Op } = require('sequelize');

exports.signin = async (req, res) => {
  const { email, motDePasse } = req.body;

  try {
    if (!email || !motDePasse) {
      console.log("❌ Champs manquants :", { email, motDePasse });
      return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
    }

    const utilisateur = await Utilisateur.findOne({ where: { email, role: 'Superviseur' } });
    if (!utilisateur) return res.status(400).json({ message: 'Identifiants incorrects.' });

    const isMatch = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!isMatch) return res.status(400).json({ message: 'Identifiants incorrects.' });

    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Connexion réussie.', token, utilisateur });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

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
