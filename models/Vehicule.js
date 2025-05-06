const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Import de l'instance Sequelize
const Chauffeur = require('./Chauffeur'); // Import du modèle Chauffeur
const Itineraire = require('./Itineraire'); // Import du modèle Itineraire

// Définir le modèle Vehicule
const Vehicule = sequelize.define('Vehicule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  chauffeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Chauffeur, // Référence au modèle Chauffeur
      key: 'utilisateur_id',
    },
  },
  itineraire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Itineraire, // Référence au modèle Itineraire
      key: 'id',
    },
  },
  marque: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  modele: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  annee: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
  },
  numero_de_plaques: { // Correction du champ
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  statut: {
    type: DataTypes.ENUM('disponible', 'en_trajet', 'hors_service'),
    allowNull: false,
    defaultValue: 'disponible',
  },
  capacite: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'vehicules',
  timestamps: false, // Désactiver les colonnes createdAt et updatedAt
});

// Exporter le modèle Vehicule
module.exports = Vehicule;
