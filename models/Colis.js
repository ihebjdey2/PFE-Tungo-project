const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client');
const Chauffeur = require('./Chauffeur');
const Station = require('./Station');

const Colis = sequelize.define('Colis', {
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
    allowNull: true,
    references: {
      model: Chauffeur,
      key: 'utilisateur_id',
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
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  poids: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  prix: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'pris_en_charge', 'en_livraison', 'livré', 'déposé_station'),
    defaultValue: 'en_attente',
  },
  date_envoi: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  date_livraison: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  code_retrait: {
    type: DataTypes.STRING,
    allowNull: true, // Généré automatiquement, demandé au destinataire
  },
  nom_destinataire: {
  type: DataTypes.STRING,
  allowNull: true,
},
numero_destinataire: {
  type: DataTypes.STRING,
  allowNull: true,
  validate: {
    is: [/^\+?\d{8,15}$/],
  }
},

}, {
  tableName: 'colis',
  timestamps: false,
});
// 🔐 Génération automatique du code de retrait
Colis.beforeCreate((colis) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  colis.code_retrait = code;
});

module.exports = Colis;
