const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');
const permissions = require('../config/permissions');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const transporter = require('../config/mail'); 
const { Op } = require('sequelize');

// ✅ Fonction centralisée de connexion
const login = async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe.' });
  }

  try {
    // 🔐 Cas 1 : SuperAdmin (compte principal)
    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        { id: 1, role: 'SuperAdmin' },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        message: 'Connexion réussie (SuperAdmin)',
        token,
        role: 'SuperAdmin',
        permissions: permissions['SuperAdmin'],
        isAdmin: true
      });
    }

    // 🔐 Cas 2 : Vérification dans la base de données (Administrateur ou Superviseur)
    const utilisateur = await Utilisateur.findOne({ where: { email } });

    if (!utilisateur) {
      return res.status(400).json({ message: 'Identifiants incorrects.' });
    }

    const isMatch = await bcrypt.compare(password, utilisateur.motDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants incorrects.' });
    }

    // 🔑 Génération du token JWT
    const token = jwt.sign(
      { id: utilisateur.id, role: utilisateur.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      role: utilisateur.role,
      permissions: permissions[utilisateur.role],
      utilisateur,
      isAdmin: utilisateur.role === 'Administrateur' || utilisateur.role === 'SuperAdmin'
    });

  } catch (err) {
    console.error('Erreur lors de la connexion :', err.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// ✅ Get authenticated user's profile
const getMe = async (req, res) => {
  try {
    // Assuming you store user info in the request after authentication
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    return res.status(200).json({ utilisateur: user });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur :', error.message);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const utilisateur = await Utilisateur.findOne({ where: { email } });
    if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé." });

    const token = crypto.randomBytes(32).toString("hex");
    const expiration = new Date(Date.now() + 3600000); // 1 heure

    utilisateur.resetToken = token;
    utilisateur.resetTokenExpiration = expiration;
    await utilisateur.save();

    // Envoi d’email (à adapter selon ton système de mail)
    await transporter.sendMail({
      to: utilisateur.email,
      subject: "Réinitialisation de mot de passe",
      html: `<p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
             <a href="http://localhost:3000/reset-password/${token}">Réinitialiser le mot de passe</a>`
    });

    res.status(200).json({ message: "Lien de réinitialisation envoyé par email." });
  } catch (error) {
    console.error("Erreur reset request :", error.message);
    res.status(500).json({ message: "Erreur interne." });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const utilisateur = await Utilisateur.findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: { [Op.gt]: new Date() }
      }
    });

    if (!utilisateur) return res.status(400).json({ message: "Lien invalide ou expiré." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    utilisateur.motDePasse = hashedPassword;
    utilisateur.resetToken = null;
    utilisateur.resetTokenExpiration = null;
    await utilisateur.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("Erreur reset password :", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

module.exports = { login, getMe , requestPasswordReset,resetPassword };


