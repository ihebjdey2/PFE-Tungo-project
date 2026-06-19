const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client');
const Ville = require('./Ville');

const ClientRechercheTransport = sequelize.define('ClientRechercheTransport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // 🔹 Lien avec client
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Client, key: 'utilisateur_id' },
  },

  // 🔹 Ville de départ
  ville_depart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Ville, key: 'id' },
  },

  // 🔹 Ville d’arrivée
  ville_arrivee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Ville, key: 'id' },
  },

  // 🔹 Date de voyage choisie
  date_voyage: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  // 🔹 Type de transport recherché
  type_transport: {
    type: DataTypes.ENUM('bus', 'train'),
    allowNull: false,
  },

  // 🔹 Date/heure de recherche
  heure_recherche: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }

}, {
  tableName: 'client_recherches_transport',
  timestamps: false,
});

module.exports = ClientRechercheTransport;
