const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Utilisateur = require('../models/Utilisateur');
const Client = require('../models/Client');
const path = require('path');
const fs = require('fs');

// Inscription Client
exports.signup = async (req, res) => {
  const { nom, prenom, email, motDePasse, adresse, languePreference, numeroDeTelephone } = req.body;
  const image = req.file?.filename;

  try {
    // 🔹 Vérification des champs obligatoires
    if (!nom || !prenom || !email || !motDePasse || !adresse || !numeroDeTelephone) {
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

    // 🔹 Hash du mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // 🔹 Création de l'utilisateur
    const utilisateur = await Utilisateur.create({
      nom,
      prenom,
      email,
      motDePasse,
      role: 'Client',
      numeroDeTelephone,
      image,
    });

    // 🔹 Création du client
    const client = await Client.create({
      utilisateur_id: utilisateur.id,
      adresse,
      languePreference: languePreference || 'fr',
    });

    // 🔹 Génération d'un token JWT
    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(201).json({ message: 'Client créé avec succès.', token, utilisateur, client });

  } catch (err) {
    console.error('Erreur lors de la création du client:', err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


exports.signin = async (req, res) => {
  const { email, motDePasse } = req.body;

  try {
    if (!email || !motDePasse) {
      console.log("❌ Champs manquants :", { email, motDePasse });
      return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
    }

    const utilisateur = await Utilisateur.findOne({ where: { email, role: 'Client' } });
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

// Récupération des informations du client connecté
exports.getMe = async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { utilisateur_id: req.user.id },
      include: [{ model: Utilisateur, as: 'Utilisateur' }],
    });

    if (!client) {
      return res.status(404).json({ message: "Client introuvable." });
    }

    res.status(200).json(client);
  } catch (err) {
    console.error('Erreur lors de la récupération des données client:', err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Mise à jour du profil client
exports.updateProfile = async (req, res) => {
  const { nom, prenom, email, adresse, languePreference, motDePasse, numeroDeTelephone } = req.body;
  const image = req.file?.filename;

  try {
    const client = await Client.findOne({
      where: { utilisateur_id: req.user.id },
      include: [{ model: Utilisateur, as: 'Utilisateur' }],
    });

    if (!client) {
      return res.status(404).json({ message: "Client introuvable." });
    }

    // 🔹 Vérifier si l'email est fourni et valide
    if (email) {
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "L'email est invalide." });
      }

      // 🔹 Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (email !== client.Utilisateur.email) {
        const existingUser = await Utilisateur.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }
      }
    }

    // 🔹 Vérification du mot de passe (optionnel)
    if (motDePasse && motDePasse.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    // 🔹 Vérification du numéro de téléphone (optionnel)
    if (numeroDeTelephone) {
      const phoneRegex = /^\+?\d{8,15}$/;
      if (!phoneRegex.test(numeroDeTelephone)) {
        return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
      }
    }

    // 🔹 Mise à jour des informations du client
    if (nom) client.Utilisateur.nom = nom;
    if (prenom) client.Utilisateur.prenom = prenom;
    if (email) client.Utilisateur.email = email;
    if (adresse) client.adresse = adresse;
    if (languePreference) client.languePreference = languePreference;
    if (numeroDeTelephone) client.Utilisateur.numeroDeTelephone = numeroDeTelephone;
    if (motDePasse) client.Utilisateur.motDePasse = await bcrypt.hash(motDePasse, 10);
    if (image) client.Utilisateur.image = image;

    await client.Utilisateur.save();
    await client.save();

    res.status(200).json({ message: "Profil client mis à jour avec succès.", client });

  } catch (err) {
    console.error('Erreur lors de la mise à jour du profil client:', err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

