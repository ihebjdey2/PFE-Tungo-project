const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompagnieStation = sequelize.define('CompagnieStation', {
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Stations', key: 'id' },
    onDelete: 'CASCADE'
  },
  compagnie_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Compagnies', key: 'id' },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'station_compagnie',
  timestamps: false
});

module.exports = CompagnieStation;
