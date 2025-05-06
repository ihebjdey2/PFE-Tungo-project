const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Utilisateur = require('./Utilisateur');
const Station = require('./Station'); // import Station

const Superviseur = sequelize.define('Superviseur', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Utilisateur,
      key: 'id',
    },
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Station,
      key: 'id',
    },
    onDelete: 'CASCADE'
  },
  destinations: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
    defaultValue: [],
    // ce tableau contient les IDs des villes que ce superviseur gère
  }
}, {
  tableName: 'superviseur',
  timestamps: false,
});

module.exports = Superviseur;
