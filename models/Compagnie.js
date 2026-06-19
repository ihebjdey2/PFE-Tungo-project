const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Compagnie = sequelize.define('Compagnie', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('bus', 'train'),
    allowNull: false
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  }
}, {
  tableName: 'compagnies',
  timestamps: false
});

module.exports = Compagnie;
