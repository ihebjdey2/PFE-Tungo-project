const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ville = sequelize.define('Ville', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'villes',
    timestamps: false
});

module.exports = Ville;
