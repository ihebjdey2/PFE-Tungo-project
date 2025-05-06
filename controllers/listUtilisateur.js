require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Utilisateur = require('../models/Utilisateur');
const Administrateur = require('../models/Administrateur');
const Superviseur = require('../models/Superviseur');
const Station = require('../models/Station');
const Ville = require('../models/Ville');
const Client = require('../models/Client');
const Chauffeur = require('../models/Chauffeur');



// 🔹 Get all superviseurs
const getAllSuperviseurs = async (req, res) => {
  try {
    const superviseurs = await Superviseur.findAll({
      include: [
        {
          model: Utilisateur,
          attributes: ['id', 'nom', 'prenom', 'email', 'numeroDeTelephone', 'image', 'dateInscription'],
        },
        {
          model: Station,
          attributes: ['id', 'nom'],
          include: {
            model: Ville,
            attributes: ['id', 'nom']
          }
        }
      ],
      attributes: ['station_id', 'destinations']
    });

    const formattedSuperviseurs = superviseurs.map(superviseur => ({
      id: superviseur.Utilisateur.id,
      nom: superviseur.Utilisateur.nom,
      prenom: superviseur.Utilisateur.prenom,
      email: superviseur.Utilisateur.email,
      numeroDeTelephone: superviseur.Utilisateur.numeroDeTelephone,
      image: superviseur.Utilisateur.image,
      dateInscription: superviseur.Utilisateur.dateInscription,
      station: {
        id: superviseur.Station.id,
        nom: superviseur.Station.nom,
        ville: superviseur.Station.Ville ? superviseur.Station.Ville.nom : null
      },
      destinations: superviseur.destinations
    }));

    res.status(200).json({
      total: superviseurs.length,
      superviseurs: formattedSuperviseurs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des superviseurs:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

module.exports = { getAllSuperviseurs };




// 🔹 Get all clients
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      include: [{
        model: Utilisateur,
        attributes: ['id', 'nom', 'prenom', 'email', 'numeroDeTelephone', 'image', 'dateInscription'],
      }],
      attributes: ['adresse', 'languePreference']
    });

    const formattedClients = clients.map(client => ({
      id: client.Utilisateur.id,
      nom: client.Utilisateur.nom,
      prenom: client.Utilisateur.prenom,
      email: client.Utilisateur.email,
      numeroDeTelephone: client.Utilisateur.numeroDeTelephone,
      image: client.Utilisateur.image,
      dateInscription: client.Utilisateur.dateInscription,
      adresse: client.adresse,
      languePreference: client.languePreference
    }));

    res.status(200).json({
      total: clients.length,
      clients: formattedClients
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};




// 🔹 Get all chauffeurs
const getAllChauffeurs = async (req, res) => {
  try {
    const chauffeurs = await Chauffeur.findAll({
      include: [{
        model: Utilisateur,
        attributes: ['id', 'nom', 'prenom', 'email', 'numeroDeTelephone', 'image', 'dateInscription'],
      }],
      attributes: ['numeroCarteIdentite', 'numeroDeLicence', 'numeroPermis', 'dateExpirationPermis', 'disponible', 'note']
    });

    const formattedChauffeurs = chauffeurs.map(chauffeur => ({
      id: chauffeur.Utilisateur.id,
      nom: chauffeur.Utilisateur.nom,
      prenom: chauffeur.Utilisateur.prenom,
      email: chauffeur.Utilisateur.email,
      numeroDeTelephone: chauffeur.Utilisateur.numeroDeTelephone,
      image: chauffeur.Utilisateur.image,
      dateInscription: chauffeur.Utilisateur.dateInscription,
      numeroCarteIdentite: chauffeur.numeroCarteIdentite,
      numeroDeLicence: chauffeur.numeroDeLicence,
      numeroPermis: chauffeur.numeroPermis,
      dateExpirationPermis: chauffeur.dateExpirationPermis,
      disponible: chauffeur.disponible,
      note: chauffeur.note
    }));

    res.status(200).json({
      total: chauffeurs.length,
      chauffeurs: formattedChauffeurs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des chauffeurs:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


module.exports = {
    
    getAllSuperviseurs,
    getAllClients,
    getAllChauffeurs // Ajoute cette ligne
  };
  