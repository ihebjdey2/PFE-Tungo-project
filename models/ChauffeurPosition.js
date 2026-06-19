const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Chauffeur = require('./Chauffeur');
const Vehicule = require('./Vehicule');
const Ville = require('./Ville');  // Import du modèle Ville


const ChauffeurPosition = sequelize.define('ChauffeurPosition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  chauffeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Chauffeur,
      key: 'utilisateur_id',
    },
    unique: true, // Ajout de la contrainte unique
  },
  vehicule_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Vehicule,
      key: 'id',
    },
  },
  point_depart: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Ville,
      key: 'id',
    },
   
  },
  destination: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Ville,
      key: 'id',
    },
    
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  priorite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  derniere_mise_a_jour: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'chauffeur_positions',
  timestamps: false,
});

module.exports = ChauffeurPosition;
