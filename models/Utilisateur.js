const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Utilisateur = sequelize.define('Utilisateur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Le nom est obligatoire" }
    }
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Le prénom est obligatoire" }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: "Format d'email invalide" }
    }
  },
  motDePasse: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: { args: [6, 100], msg: "Le mot de passe doit contenir au moins 6 caractères" }
    }
  },
  role: {
    type: DataTypes.ENUM('Administrateur', 'Chauffeur', 'Superviseur', 'Client'),
    allowNull: false,
  },
  numeroDeTelephone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: { args: [/^\+?\d{8,15}$/], msg: "Numéro de téléphone invalide" }
    }
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  dateInscription: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'utilisateurs',
  timestamps: false,
});

// 🔹 Hash du mot de passe avant la création de l'utilisateur
Utilisateur.beforeCreate(async (utilisateur) => {
  if (utilisateur.motDePasse) {
    const salt = await bcrypt.genSalt(10);
    utilisateur.motDePasse = await bcrypt.hash(utilisateur.motDePasse.trim(), salt);
  }
});

// 🔹 Méthode pour comparer les mots de passe
Utilisateur.prototype.comparePassword = async function (motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse);
};

module.exports = Utilisateur;
