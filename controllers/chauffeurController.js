const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Utilisateur = require('../models/Utilisateur');
const Chauffeur = require('../models/Chauffeur');
const Vehicule = require('../models/Vehicule');
const Ville = require('../models/Ville');
const { Op } = require('sequelize');
const ChauffeurPosition = require('../models/ChauffeurPosition');
const Itineraire = require('../models/Itineraire');
const path = require('path');
const fs = require('fs');


// Inscription Chauffeur
exports.signup = async (req, res) => {
  const {
    nom, prenom, email, motDePasse, numeroCarteIdentite, numeroDeLicence, numeroPermis,
    dateExpirationPermis, numeroDeTelephone
  } = req.body;
  const image = req.file?.filename;
  const vehicules = req.body.vehicules ? JSON.parse(req.body.vehicules) : []; // Analyse des véhicules

  try {
    if (!nom || !prenom || !email || !motDePasse || !numeroCarteIdentite || 
        !numeroDeLicence || !numeroPermis || !dateExpirationPermis) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis.' });
    }

    // Vérification des doublons (email, carte d'identité et licence)
    const [existingUser, existingCarteIdentite, existingLicence] = await Promise.all([
      Utilisateur.findOne({ where: { email } }),
      Chauffeur.findOne({ where: { numeroCarteIdentite } }),
      Chauffeur.findOne({ where: { numeroDeLicence } })
    ]);

    if (existingUser) return res.status(400).json({ message: "L'email est déjà utilisé." });
    if (existingCarteIdentite) return res.status(400).json({ message: "Le numéro de carte d'identité est déjà utilisé." });
    if (existingLicence) return res.status(400).json({ message: "Le numéro de licence est déjà utilisé." });

    // Création de l'utilisateur
    const utilisateur = await Utilisateur.create({
      nom,
      prenom,
      email,
      motDePasse,
      role: 'Chauffeur',
      numeroDeTelephone,
      image,
    });

    // Création du chauffeur
    const chauffeur = await Chauffeur.create({
      utilisateur_id: utilisateur.id,
      numeroCarteIdentite,
      numeroDeLicence,
      numeroPermis,
      dateExpirationPermis,
    });

    // Ajout des véhicules avec leurs itinéraires respectifs
    if (vehicules && Array.isArray(vehicules)) {
      for (const vehicule of vehicules) {
      
        if (!vehicule.numero_de_plaques || !vehicule.marque || !vehicule.modele || 
            !vehicule.ville_pointA_id || !vehicule.ville_pointB_id) {
          return res.status(400).json({ message: "Chaque véhicule doit contenir 'numero_de_plaques', 'marque', 'modele', 'ville_pointA_id' et 'ville_pointB_id'." });
        }

        // Vérification de l'existence des villes sélectionnées
        const villeA = await Ville.findByPk(vehicule.ville_pointA_id);
        const villeB = await Ville.findByPk(vehicule.ville_pointB_id);

        if (!villeA || !villeB) {
          return res.status(400).json({ message: `Les villes spécifiées pour le véhicule ${vehicule.numero_de_plaques} n'existent pas.` });
        }

        // Vérification de l'existence de l'itinéraire dans les deux sens
        const itineraire = await Itineraire.findOne({
          where: {
            [Op.or]: [
              { ville_pointA_id: vehicule.ville_pointA_id, ville_pointB_id: vehicule.ville_pointB_id },
              { ville_pointA_id: vehicule.ville_pointB_id, ville_pointB_id: vehicule.ville_pointA_id }
            ]
          }
        });

        if (!itineraire) {
          return res.status(400).json({ message: `Aucun itinéraire trouvé pour les villes spécifiées du véhicule ${vehicule.numero_de_plaques}.` });
        }

        // Ajout du véhicule avec itinéraire trouvé
        await Vehicule.create({
          chauffeur_id: chauffeur.utilisateur_id,
          marque: vehicule.marque,
          modele: vehicule.modele,
          annee: vehicule.annee,
          numero_de_plaques: vehicule.numero_de_plaques,
          capacite: vehicule.capacite || 4,
          statut: 'disponible',
          itineraire_id: itineraire.id,
        });
      }
    }

    // Génération du token JWT
    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(201).json({ message: 'Chauffeur inscrit avec succès.', token, utilisateur, chauffeur });
  } catch (err) {
    console.error("Erreur lors de l'inscription du chauffeur :", err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


// Connexion Chauffeur
exports.signin = async (req, res) => {
  const { email, motDePasse } = req.body;

  try {
    if (!email || !motDePasse) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
    }

    const utilisateur = await Utilisateur.findOne({ where: { email, role: 'Chauffeur' } });
    if (!utilisateur) return res.status(400).json({ message: 'Identifiants incorrects.' });

    const isMatch = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!isMatch) return res.status(400).json({ message: 'Identifiants incorrects.' });

    const token = jwt.sign({ id: utilisateur.id, role: utilisateur.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ message: 'Connexion réussie.', token, utilisateur });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};
// Récupération du profil du chauffeur connecté
exports.getMe = async (req, res) => {
  try {
    const chauffeur = await Chauffeur.findOne({
      where: { utilisateur_id: req.user.id },
      include: [
        { model: Vehicule, as: 'Vehicules' },
        { model: Utilisateur, as: 'Utilisateur' }
      ],
    });

    if (!chauffeur) {
      return res.status(404).json({ message: 'Chauffeur introuvable.' });
    }

    res.status(200).json(chauffeur);
  } catch (err) {
    console.error("Erreur lors de la récupération des données chauffeur :", err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Mise à jour de la disponibilité
exports.updateDisponibilite = async (req, res) => {
  const { disponible } = req.body;

  try {
    const chauffeur = await Chauffeur.findOne({ where: { utilisateur_id: req.user.id } });

    if (!chauffeur) {
      return res.status(404).json({ message: 'Chauffeur introuvable.' });
    }

    chauffeur.disponible = disponible;
    await chauffeur.save();

    if (!disponible) {
      const deleted = await ChauffeurPosition.destroy({ where: { chauffeur_id: req.user.id } });
      console.log(`Toutes les entrées supprimées dans chauffeur_positions : ${deleted} ligne(s).`);
    }

    res.status(200).json({
      message: `Disponibilité mise à jour avec succès. Le chauffeur est maintenant ${disponible ? 'disponible' : 'indisponible'}.`,
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de la disponibilité :", err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Mise à jour du profil
exports.updateProfile = async (req, res) => {
  const { prenom, nom, email, motDePasse, numeroDeTelephone } = req.body;
  const image = req.file?.filename; 

  try {
    const chauffeur = await Chauffeur.findOne({
      where: { utilisateur_id: req.user.id },
      include: [{ model: Utilisateur, as: 'Utilisateur' }],
    });

    if (!chauffeur) {
      return res.status(404).json({ message: 'Chauffeur introuvable.' });
    }

    if (prenom) chauffeur.Utilisateur.prenom = prenom;
    if (nom) chauffeur.Utilisateur.nom = nom;
    if (email) chauffeur.Utilisateur.email = email;
    if (numeroDeTelephone) chauffeur.Utilisateur.numeroDeTelephone = numeroDeTelephone;
    if (motDePasse) chauffeur.Utilisateur.motDePasse = await bcrypt.hash(motDePasse, 10);
    if (image) {
          // Supprimer l'ancienne image si elle existe
          if (chauffeur.Utilisateur.image) {
            const oldImagePath = path.join(__dirname, '../uploads', chauffeur.Utilisateur.image);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
          chauffeur.Utilisateur.image = image; // Ajouter la nouvelle image
        }

    await chauffeur.Utilisateur.save();
    await chauffeur.save();

    res.status(200).json({ message: 'Profil mis à jour avec succès.', chauffeur });
  } catch (err) {
    console.error("Erreur lors de la mise à jour du profil :", err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
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