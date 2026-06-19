// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Charger les variables d'environnement depuis .env

// Créer une instance Sequelize avec les informations de connexion
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: false, // Désactiver les logs des requêtes SQL dans la console
});

// Tester la connexion à la base de données
(async () => {
  try {
    await sequelize.authenticate(); // Essayer de se connecter à la base de données
    console.log('✅ Connecté à PostgreSQL avec succès.');
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error);
  }
})();

// Exporter l'instance sequelize pour l'utiliser dans d'autres fichiers
module.exports = sequelize;
