const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Utilisateur = require('./Utilisateur');

const Client = sequelize.define('Client', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Utilisateur,
      key: 'id',
    },
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "L'adresse est obligatoire" }
    }
  },
  languePreference: {
    type: DataTypes.ENUM('ar', 'fr', 'en'),
    allowNull: false,
    defaultValue: 'fr',
    validate: {
      isIn: {
        args: [['ar', 'fr', 'en']],
        msg: "La langue préférée doit être 'ar', 'fr' ou 'en'."
      }
    }
  },
}, {
  tableName: 'clients',
  timestamps: false,
});

module.exports = Client;
