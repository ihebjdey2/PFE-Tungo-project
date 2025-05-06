const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database'); // Instance Sequelize
const setupRelations = require('./models/relations'); // Configuration des relations
const path = require('path');
const cors = require('cors');


// Charger les variables d'environnement
dotenv.config();

// Initialiser Express
const app = express();
app.use(express.json()); // Middleware pour parser les requêtes JSON

// Gestion des CORS (si nécessaire)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


// Basic CORS configuration
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

// Servir les fichiers statiques (images téléchargées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(express.json({ type: 'application/json', limit: '10mb', extended: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 10000 }));

// Importer les routes
const authChauffeurRoutes = require('./routes/auth_chauffeur');
const authClientRoutes = require('./routes/auth_client');
const chauffeurProfileRoutes = require('./routes/chauffeurProfileRoutes');
const chauffeurSessionRoutes = require('./routes/chauffeurSessionRoutes');
const clientRechercheRoutes = require('./routes/clientRechercheRoutes');
const SuperviseurRoutes = require('./routes/routes_superviseur');
const reservationRoutes = require('./routes/reservationRoutes');
const superviseurChauffeurRoutes = require('./routes/superviseurChauffeurRoutes');
const authAdminRoutes = require('./routes/auth_admin');
const listUtilisateurRoutes = require('./routes/listUtilisateurRoutes');
const stationItineraireRoutes = require('./routes/routes_station_itineraire');



// Utiliser les routes avec des préfixes clairs
app.use('/api/chauffeurs/auth', authChauffeurRoutes);
app.use('/api/clients/auth', authClientRoutes);
app.use('/api/chauffeurs', chauffeurProfileRoutes);
app.use('/api/chauffeurs/sessions', chauffeurSessionRoutes);
app.use('/api/clients/recherches', clientRechercheRoutes);
app.use('/api/superviseur', SuperviseurRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/auth/admin', authAdminRoutes);
app.use('/api/superviseur/chauffeurs', superviseurChauffeurRoutes);
app.use('/api/admin/list', listUtilisateurRoutes);
app.use('/api/admin/gestion', stationItineraireRoutes);



// Importer les modèles pour Sequelize
require('./models/Utilisateur');
require('./models/Chauffeur');
require('./models/ChauffeurPosition');
require('./models/Client');
require('./models/Administrateur');
require('./models/Superviseur');
require('./models/ClientRecherche');
require('./models/Vehicule');
require('./models/Itineraire');
require('./models/Ville');
require('./models/Reservation');

// Configurer les relations entre les modèles
setupRelations();

// Gestion des erreurs 404 pour les routes inexistantes
app.use((req, res, next) => {
  res.status(404).json({ message: "La ressource demandée est introuvable." });
});

// Middleware global pour gérer les erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur.' });
});

// Synchroniser la base de données
sequelize.sync({ alter: true }) // Utilisez alter: true pour ajuster la base de données sans perte de données
  .then(() => console.log('✅ Base de données synchronisée avec succès.'))
  .catch((err) => console.error('❌ Erreur lors de la synchronisation de la base de données :', err));

// Démarrer le serveur
const PORT = process.env.PORT || 3000; // Port défini dans .env ou 3000 par défaut
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});