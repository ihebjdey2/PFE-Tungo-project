const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 
const Ville = require('./Ville');  // Import du modèle Ville

// Définir le modèle Itineraire
const Itineraire = sequelize.define('Itineraire', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ville_pointA_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Ville,
      key: 'id',
    },
    onDelete: 'CASCADE'
  },
  ville_pointB_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Ville,
      key: 'id',
    },
    onDelete: 'CASCADE'
  },
  distance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0, // La distance doit être positive
    },
  },
  duree_estimee: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  tarif_base: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0, // Le tarif doit être positif
    },
  },
}, {
  tableName: 'itineraires',
  timestamps: false, // Désactiver createdAt et updatedAt
});



// Exporter le modèle
module.exports = Itineraire;
