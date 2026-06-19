const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Import de l'instance Sequelize
const Client = require('./Client'); // Import du modèle Client
const Ville = require('./Ville');  // Import du modèle Ville


// Définir le modèle ClientRecherche
const ClientRecherche = sequelize.define('ClientRecherche', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // Ajout de la contrainte unique
    references: {
      model: Client,
      key: 'utilisateur_id',
    },
  },
  point_depart: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Ville,
      key: 'id',
    },
    
  },
  destination: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Ville,
      key: 'id',
    },
    
  },
  heure_recherche: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'client_recherches',
  timestamps: false,
});

module.exports = ClientRecherche;
