const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Import de l'instance Sequelize
const Utilisateur = require('./Utilisateur'); // Import du modèle Utilisateur

// Définir le modèle Administrateur
const Administrateur = sequelize.define('Administrateur', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Utilisateur,
      key: 'id',
    },
  },
}, {
  tableName: 'administrateurs',
  timestamps: false, // Pas de colonnes createdAt ou updatedAt
});

// Exporter le modèle Administrateur
module.exports = Administrateur;
