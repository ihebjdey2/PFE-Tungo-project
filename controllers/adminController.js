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

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return res.status(400).json({ message: 'Veuillez fournir email et mot de passe' });
  }

  // 🔹 Cas 1 : Admin principal (environnement)
  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign(
      { id: 1, role: 'Administrateur' },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Connexion réussie (admin principal)',
      token,
      isAdmin: true
    });
  }

  try {
    // 🔹 Cas 2 : Autres administrateurs (BDD)
    const utilisateur = await Utilisateur.findOne({
      where: { email, role: 'Administrateur' }
    });

    if (!utilisateur) {
      return res.status(400).json({ message: 'Identifiants incorrects.' });
    }

    const isMatch = await bcrypt.compare(password, utilisateur.motDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      utilisateur,
      isAdmin: true
    });
  } catch (err) {
    console.error('Erreur lors de la connexion administrateur:', err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};
const ajouterAdministrateur = async (req, res) => {
  const { id, role } = req.user;
  const { nom, prenom, email, motDePasse, numeroDeTelephone } = req.body;
  const image = req.file?.filename;

  // 🔒 Autoriser uniquement l'administrateur principal
  if (role !== 'Administrateur' || id !== 1) {
    return res.status(403).json({ message: "Seul l'administrateur principal peut ajouter d'autres administrateurs." });
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
      role: 'Administrateur',
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


// 🔹 Récupérer toutes les stations
const getStations = async (req, res) => {
  try {
    const stations = await Station.findAll({
      include: [{ model: Ville, attributes: ['id', 'nom'] }],
      attributes: ['id', 'nom', 'villeId', 'destinations']
    });

    res.status(200).json({
      total: stations.length,
      stations: stations.map(station => ({
        id: station.id,
        nom: station.nom,
        villeId: station.villeId,
        villeNom: station.Ville?.nom,
        destinations: station.destinations
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
    if (role !== 'Administrateur') {
      return res.status(403).json({ message: "Accès non autorisé." });
    }

    if (id === 1) {
      // Administrateur principal depuis .env
      return res.status(200).json({
        id: 1,
        nom: "Admin",
        prenom: "Principal",
        email: adminEmail,
        role: "Administrateur"
      });
    }

    // Autres administrateurs dans la base de données
    const utilisateur = await Utilisateur.findOne({
      where: { id, role: 'Administrateur' },
      attributes: { exclude: ['motDePasse'] },
    });

    if (!utilisateur) {
      return res.status(404).json({ message: "Administrateur introuvable." });
    }

    res.status(200).json(utilisateur);
  } catch (error) {
    console.error("Erreur getMe:", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


const updateProfile = async (req, res) => {
  const { id, role } = req.user;
  const { prenom, nom, email, motDePasse, numeroDeTelephone } = req.body;
  const image = req.file?.filename;
  const adminPassword = process.env.ADMIN_PASSWORD;

  try {
    if (role !== 'Administrateur') {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // 🔹 Admin principal
    if (id === 1) {
      if (email) process.env.ADMIN_EMAIL = email;
      if (motDePasse) process.env.ADMIN_PASSWORD = motDePasse;

      return res.status(200).json({
        message: "Le profil de l'administrateur principal a été mis à jour (en mémoire uniquement)."
      });
    }

    // 🔹 Autres admins
    const utilisateur = await Utilisateur.findOne({ where: { id, role: 'Administrateur' } });
    if (!utilisateur) return res.status(404).json({ message: "Administrateur introuvable." });

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
  loginAdmin,
  ajouterAdministrateur,
  ajouterSuperviseur,
  getStations,
  getDestinationsForStation ,
  getDestinationsBySuperviseur,
  getMe,
  updateProfile,
  getAllVilles

  
};
