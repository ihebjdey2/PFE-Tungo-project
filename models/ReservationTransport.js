const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client');
const Station = require('./Station');
const HoraireTransport = require('./HoraireTransport');

const ReservationTransport = sequelize.define('ReservationTransport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // 🔹 Client qui réserve
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Client, key: 'utilisateur_id' },
  },

  // 🔹 Horaire de bus/train choisi
  horaire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: HoraireTransport, key: 'id' },
  },

  // 🔹 Station départ
  station_depart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Station, key: 'id' },
  },

  // 🔹 Station arrivée
  station_arrivee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Station, key: 'id' },
  },

  // 🔹 Nombre de places réservées
  nombre_places: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },

  // 🔹 Prix total (calculé automatiquement selon itinéraire)
  prix: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  // 🔹 Date et heure de réservation
  heure_reservation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },

  // 🔹 Date de voyage (jour choisi)
  date_voyage: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  // 🔹 Statut de la réservation
  statut: {
    type: DataTypes.ENUM('en_attente', 'confirmée', 'en_cours', 'terminée', 'annulée'),
    allowNull: false,
    defaultValue: 'en_attente',
  },
  type_transport: {
    type: DataTypes.ENUM('bus', 'train'),
    allowNull: false,
  }

}, {
  tableName: 'reservations_transport',
  timestamps: false,
});

module.exports = ReservationTransport;
