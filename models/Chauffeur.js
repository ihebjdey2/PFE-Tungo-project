const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Import de l'instance Sequelize
const Utilisateur = require('./Utilisateur'); // Import du modèle Utilisateur

// Définir le modèle Chauffeur
const Chauffeur = sequelize.define('Chauffeur', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Utilisateur, // Référence au modèle Utilisateur
      key: 'id',
    },
  },
  numeroCarteIdentite: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  numeroDeLicence: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  numeroPermis: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateExpirationPermis: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isFuture(value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Réinitialiser l'heure
        const inputDate = new Date(value);
        if (inputDate <= today) {
          throw new Error("La date d'expiration doit être future.");
        }
      },
    },
  },
  languePreference: {
    type: DataTypes.ENUM('ar', 'fr', 'en'),
    allowNull: false,
    defaultValue: 'fr',
    validate: {
      isIn: {
        args: [['ar', 'fr', 'en']],
        msg: "La langue préférée doit être 'ar', 'fr' ou 'en'."
      }
    }
  },
  
  
  disponible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  note: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5,
    },
  },
}, {
  tableName: 'chauffeurs',
  timestamps: false,
});

module.exports = Chauffeur;
