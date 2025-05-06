const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client');
const Chauffeur = require('./Chauffeur');
const Vehicule = require('./Vehicule');
const Station = require('./Station');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Client,
      key: 'utilisateur_id',
    },
  },
  chauffeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Chauffeur,
      key: 'utilisateur_id',
    },
  },
  vehicule_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Vehicule,
      key: 'id',
    },
  },
  station_depart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Station,
      key: 'id',
    },
  },
  station_arrivee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Station,
      key: 'id',
    },
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'confirmée', 'en_cours', 'terminée', 'annulée'),
    allowNull: false,
    defaultValue: 'en_attente',
  },
  heure_reservation: { // 🔹 Nouvel attribut
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // 📌 Enregistre automatiquement la date et l'heure de la réservation
  },
  prix: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  nombre_places: { // 🔹 Ajout pour la réservation multiple
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  }
}, {
  tableName: 'reservations',
  timestamps: false,
});

module.exports = Reservation;
