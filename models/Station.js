const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Ville = require('./Ville');

const Station = sequelize.define('Station', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    villeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Ville,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    destinations: { // Liste des ID des villes desservies par cette station
        type: DataTypes.ARRAY(DataTypes.INTEGER), // Utilisation d'un tableau d'ID de villes
        allowNull: false, 
        defaultValue: []
    },
    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: false
});


module.exports = Station;
