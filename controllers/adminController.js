require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const Utilisateur = require('../models/Utilisateur');
const Administrateur = require('../models/Administrateur');
const Superviseur = require('../models/Superviseur');
const Station = require('../models/Station');
const Ville = require('../models/Ville');
const Compagnie = require('../models/Compagnie');

const permissions = require('../config/permissions');



const ajouterAdministrateur = async (req, res) => {
  const { id, role } = req.user;
  const { nom, prenom, email, motDePasse, numeroDeTelephone } = req.body;
  const image = req.file?.filename;

  // 🔒 Autoriser uniquement le SuperAdmin
  if (role !== 'SuperAdmin' || id !== 1) {
    return res.status(403).json({ message: "Seul le SuperAdmin peut ajouter d'autres administrateurs." });
  }

  try {
    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
    }

    const existingUser = await Utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const utilisateur = await Utilisateur.create({
      nom,
      prenom,
      email,
      motDePasse, 
      role: 'Administrateur', // ✅ Administrateur classique
      numeroDeTelephone,
      image
    });

    await Administrateur.create({ utilisateur_id: utilisateur.id });

    res.status(201).json({ message: 'Administrateur ajouté avec succès.', utilisateur });
  } catch (error) {
    console.error("Erreur lors de la création de l'administrateur :", error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};



const ajouterSuperviseur = async (req, res) => {
  const { nom, prenom, email, motDePasse, numeroDeTelephone, station_id, destinations } = req.body;
  const image = req.file?.filename;

  try {
    // 🔹 Vérification des champs obligatoires
    if (!nom || !prenom || !email || !motDePasse || !numeroDeTelephone || !station_id || !destinations || destinations.length === 0) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
    }

    // 🔹 Vérification du format de l'email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "L'email est invalide." });
    }

    // 🔹 Vérification si l'email est déjà utilisé
    const existingUser = await Utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // 🔹 Vérification du mot de passe (min 6 caractères)
    if (motDePasse.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    // 🔹 Vérification du numéro de téléphone
    const phoneRegex = /^\+?\d{8,15}$/;
    if (!phoneRegex.test(numeroDeTelephone)) {
      return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
    }

    // 🔹 Vérification de la station
    const station = await Station.findByPk(parseInt(station_id));
    if (!station) {
      return res.status(400).json({ message: 'Station introuvable.' });
    }

    // 🔹 Conversion des destinations en array d'entiers
    let destinationIds = [];
    if (typeof destinations === 'string') {
      destinationIds = [parseInt(destinations)];
    } else if (Array.isArray(destinations)) {
      destinationIds = destinations.map(d => parseInt(d));
    }

    // 🔹 Vérification des conflits avec d'autres superviseurs
    const superviseursExistants = await Superviseur.findAll({ where: { station_id }, attributes: ['destinations'] });
    const destinationsDejaPrises = superviseursExistants.flatMap(s => s.destinations || []);
    const conflitDestinations = destinationIds.filter(dest => destinationsDejaPrises.includes(dest));
    if (conflitDestinations.length > 0) {
      return res.status(400).json({ message: `Ces destinations sont déjà affectées : ${conflitDestinations.join(', ')}` });
    }

    // 🔹 Vérifier que les destinations sont valides pour cette station
    const invalidDestinations = destinationIds.filter(dest => !station.destinations.includes(dest));
    if (invalidDestinations.length > 0) {
      return res.status(400).json({ message: `Ces destinations ne sont pas autorisées pour cette station : ${invalidDestinations.join(', ')}` });
    }

    // 🔹 Hash du mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // 🔹 Création de l'utilisateur
    const utilisateur = await Utilisateur.create({
      nom,
      prenom,
      email,
      motDePasse,
      role: 'Superviseur',
      numeroDeTelephone,
      image
    });

    // 🔹 Création du superviseur
    const superviseur = await Superviseur.create({
      utilisateur_id: utilisateur.id,
      station_id: parseInt(station_id),
      destinations: destinationIds
    });

    // 🔹 Génération du token JWT
    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(201).json({ message: 'Superviseur créé avec succès.', token, utilisateur, superviseur });

  } catch (error) {
    console.error('Erreur lors de la création du superviseur:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


// 🔹 Récupérer toutes les stations (avec compagnies)
const getStations = async (req, res) => {
  try {
    const stations = await Station.findAll({
      include: [
        { model: Ville, attributes: ['id', 'nom'] },
        {
          model: Compagnie,
          as: 'Compagnies',
          attributes: ['id', 'nom', 'type', 'telephone', 'email'], // tu peux réduire si besoin
          through: { attributes: [] } // pour ne pas renvoyer la table pivot
        }
      ],
      attributes: ['id', 'nom', 'villeId', 'destinations', 'type_station', 'adresse', 'telephone']
    });

    res.status(200).json({
      total: stations.length,
      stations: stations.map(station => ({
        id: station.id,
        nom: station.nom,
        type_station: station.type_station,
        villeId: station.villeId,
        villeNom: station.Ville?.nom,
        adresse: station.adresse,
        telephone: station.telephone,
        destinations: station.destinations,
        compagnies: station.Compagnies?.map(c => ({
          id: c.id,
          nom: c.nom,
          type: c.type,
          telephone: c.telephone,
          email: c.email
        })) || []
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stations:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

const getDestinationsForStation = async (req, res) => {
  const { stationId } = req.params;

  try {
    const station = await Station.findByPk(stationId);
    if (!station) {
      return res.status(404).json({ message: "Station introuvable." });
    }

    // 🔥 Étape 1 : Charger toutes les destinations déjà utilisées pour cette station
    const superviseurs = await Superviseur.findAll({
      where: { station_id: stationId },
      attributes: ['destinations']
    });

    let destinationsDejaPrises = [];
    superviseurs.forEach(superviseur => {
      if (Array.isArray(superviseur.destinations)) {
        destinationsDejaPrises.push(...superviseur.destinations);
      }
    });

    // 🔥 Étape 2 : Calculer les destinations disponibles
    const destinationsDisponibles = station.destinations.filter(dest => !destinationsDejaPrises.includes(dest));

    // 🔥 Étape 3 : Charger uniquement les villes correspondant aux destinations disponibles
    const villesDisponibles = await Ville.findAll({
      where: { id: destinationsDisponibles },
      attributes: ['id', 'nom']
    });

    res.status(200).json({ destinations: villesDisponibles });
  } catch (error) {
    console.error('Erreur lors de la récupération des destinations:', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

const getDestinationsBySuperviseur = async (req, res) => {
  const { superviseurId } = req.params;

  try {
    const superviseur = await Superviseur.findByPk(superviseurId);
    if (!superviseur) {
      return res.status(404).json({ message: "Superviseur introuvable." });
    }

    const villes = await Ville.findAll({
      where: { id: superviseur.destinations },
      attributes: ['id', 'nom']
    });

    res.status(200).json({
      superviseurId: superviseurId,
      stationId: superviseur.station_id,
      destinations: villes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des destinations du superviseur:', error.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getMe = async (req, res) => {
  const { id, role } = req.user;
  const adminEmail = process.env.ADMIN_EMAIL;

  try {
    // ✅ Vérifier si l'utilisateur est le SuperAdmin (ID 1 et rôle SuperAdmin)
    if (id === 1 && role === 'SuperAdmin') {
      return res.status(200).json({
        id: 1,
        nom: "Super",
        prenom: "Admin",
        email: adminEmail,
        role: "SuperAdmin"
      });
    }

    // ✅ Vérifier si l'utilisateur est un Administrateur dans la base de données
    if (role === 'Administrateur') {
      const utilisateur = await Utilisateur.findOne({
        where: { id, role: 'Administrateur' },
        attributes: { exclude: ['motDePasse'] },
      });

      if (!utilisateur) {
        return res.status(404).json({ message: "Administrateur introuvable." });
      }

      return res.status(200).json(utilisateur);
    }

    // 🚫 Si l'utilisateur n'est ni SuperAdmin ni Administrateur
    return res.status(403).json({ message: "Accès non autorisé." });

  } catch (error) {
    console.error("Erreur lors de la récupération du profil (getMe) :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};



const updateProfile = async (req, res) => {
  const { id, role } = req.user;
  const { prenom, nom, email, motDePasse, numeroDeTelephone } = req.body;
  const image = req.file?.filename;

  try {
    // 🚫 Limiter l'accès uniquement aux administrateurs normaux (pas SuperAdmin)
    if (role !== 'Administrateur' || id === 1) {
      return res.status(403).json({ message: "Seuls les administrateurs normaux peuvent mettre à jour leur profil." });
    }

    // 🔍 Vérifier l'existence de l'administrateur dans la base de données
    const utilisateur = await Utilisateur.findOne({ where: { id, role: 'Administrateur' } });
    if (!utilisateur) return res.status(404).json({ message: "Administrateur introuvable." });

    // 📝 Mettre à jour les champs modifiés
    if (prenom) utilisateur.prenom = prenom;
    if (nom) utilisateur.nom = nom;
    if (email) utilisateur.email = email;
    if (numeroDeTelephone) utilisateur.numeroDeTelephone = numeroDeTelephone;
    if (motDePasse) utilisateur.motDePasse = await bcrypt.hash(motDePasse, 10);
    if (image) {
      const fs = require('fs');
      const path = require('path');
      if (utilisateur.image) {
        const oldImagePath = path.join(__dirname, '../uploads', utilisateur.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      utilisateur.image = image;
    }

    // 💾 Sauvegarder les modifications
    await utilisateur.save();
    res.status(200).json({ message: "Profil administrateur mis à jour avec succès.", utilisateur });

  } catch (error) {
    console.error("Erreur updateProfile:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};



const getAllVilles = async (req, res) => {
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


module.exports = {
  ajouterAdministrateur,
  ajouterSuperviseur,
  getStations,
  getDestinationsForStation ,
  getDestinationsBySuperviseur,
  getMe,
  updateProfile,
  getAllVilles

  
};
