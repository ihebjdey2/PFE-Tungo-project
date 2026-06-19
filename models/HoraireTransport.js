const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Station = require('./Station');
const Compagnie = require('./Compagnie');
const ItineraireBus = require('./ItineraireBus');
const ItineraireTrain = require('./ItineraireTrain');
const Ville = require('./Ville');

const HoraireTransport = sequelize.define('HoraireTransport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // Relations avec stations
  station_depart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Station, key: 'id' }
  },
  station_arrivee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Station, key: 'id' }
  },

  // Villes (ajoutées 🔹)
  ville_depart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Ville, key: 'id' }
  },
  ville_arrivee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Ville, key: 'id' }
  },
  // Relation avec compagnie (SNTRI, SNCFT…)
  compagnie_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Compagnie, key: 'id' }
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

  // Type de transport
  type: {
    type: DataTypes.ENUM('bus', 'train'),
    allowNull: false
  },

  // Horaire fixe
 jour_semaine: {
  type: DataTypes.ARRAY(DataTypes.STRING),
  allowNull: true,
  validate: {
    isValidDays(value) {
      if (!Array.isArray(value)) return;
      const joursValid = [
        'lundi', 'mardi', 'mercredi', 'jeudi',
        'vendredi', 'samedi', 'dimanche'
      ];
      value.forEach(j => {
        if (!joursValid.includes(j)) {
          throw new Error(`Jour invalide : ${j}`);
        }
      });
    }
  }
},

  date_exception: {
    type: DataTypes.DATEONLY, // Pour un horaire exceptionnel (ex. jour férié)
    allowNull: true
  },

  heure_depart: {
    type: DataTypes.TIME,
    allowNull: false
  },
  heure_arrivee: {
    type: DataTypes.TIME,
    allowNull: false
  },

  // Tarifs & capacités
  prix: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  tarif_reduit: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  tarif_premium: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  capacite: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // Statut de l’horaire
  statut: {
    type: DataTypes.ENUM('actif', 'suspendu', 'annule'),
    defaultValue: 'actif'
  }

}, {
  tableName: 'horaires_transport',
  timestamps: false
});

module.exports = HoraireTransport;
