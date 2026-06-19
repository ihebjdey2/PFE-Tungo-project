const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Station = require('./Station');
const HoraireTransport = require('./HoraireTransport');
const ItineraireTrain = require('./ItineraireTrain');
const ItineraireBus = require('./ItineraireBus');
const Ville = require('./Ville'); 


const ArretTransport = sequelize.define('ArretTransport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // 🔹 Référence à l’horaire de bus/train
  horaire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: HoraireTransport, key: 'id' }
  },

  // 🔹 Référence à la station de l’arrêt
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Station, key: 'id' }
  },
 ville_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Ville, key: 'id' }
  },
  prix: {
  type: DataTypes.FLOAT,
  allowNull: true // ou false si obligatoire
},
  // 🔹 Ordre de passage (1 = premier arrêt, 2 = deuxième…)
  ordre: {
  type: DataTypes.INTEGER,
  allowNull: false,
  defaultValue: 1 // premier arrêt par défaut
},
// Relation avec les itinéraires
  itineraire_bus_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: ItineraireBus, key: 'id' }
  },
  itineraire_train_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: ItineraireTrain, key: 'id' }
  },


  // 🔹 Heure prévue de passage à cet arrêt
  heure_passage: {
    type: DataTypes.TIME,
    allowNull: true,
  },



}, {
  tableName: 'arrets_transport',
  timestamps: false
});

module.exports = ArretTransport;
