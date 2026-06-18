const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Ville = require('./Ville');

const ItineraireTrain = sequelize.define('ItineraireTrain', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ville_pointA_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Ville, key: 'id' }
  },
  ville_pointB_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Ville, key: 'id' }
  },
  distance: { type: DataTypes.FLOAT, allowNull: false },
  duree_estimee: { type: DataTypes.TIME, allowNull: false },
  tarif_train: { type: DataTypes.FLOAT, allowNull: false }
}, {
  tableName: 'itineraires_train',
  timestamps: false
});

module.exports = ItineraireTrain;
