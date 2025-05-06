const Utilisateur = require('./Utilisateur');
const Chauffeur = require('./Chauffeur');
const ChauffeurPosition = require('./ChauffeurPosition');
const Client = require('./Client');
const Administrateur = require('./Administrateur');
const ClientRecherche = require('./ClientRecherche');
const Vehicule = require('./Vehicule');
const Itineraire = require('./Itineraire');
const Ville = require('./Ville');
const Station = require('./Station');
const Superviseur = require('./Superviseur');
const Reservation = require('./Reservation');


module.exports = () => {
  // Relations entre Utilisateur et autres entités
  Utilisateur.hasOne(Chauffeur, { foreignKey: 'utilisateur_id' });
  Utilisateur.hasOne(Client, { foreignKey: 'utilisateur_id' });
  Utilisateur.hasOne(Administrateur, { foreignKey: 'utilisateur_id' });
  Utilisateur.hasOne(Superviseur, { foreignKey: 'utilisateur_id' });

  Chauffeur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', onDelete: 'CASCADE' });
  Client.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', onDelete: 'CASCADE' });
  Administrateur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', onDelete: 'CASCADE' });
  Superviseur.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', onDelete: 'CASCADE' });

  // Relations pour Chauffeur et ses entités associées
  Chauffeur.hasMany(Vehicule, { foreignKey: 'chauffeur_id', as: 'Vehicules', onDelete: 'CASCADE' });
  ChauffeurPosition.belongsTo(Chauffeur, { foreignKey: 'chauffeur_id', onDelete: 'CASCADE' });
  ChauffeurPosition.belongsTo(Ville, { foreignKey: 'point_depart', as: 'villeDepart', onDelete: 'CASCADE' });
  ChauffeurPosition.belongsTo(Ville, { foreignKey: 'destination', as: 'villeDestination', onDelete: 'CASCADE' });

  // Relations pour Vehicule
  Vehicule.belongsTo(Chauffeur, { foreignKey: 'chauffeur_id', onDelete: 'CASCADE' });
  Vehicule.belongsTo(Itineraire, { foreignKey: 'itineraire_id', as: 'Itineraire', onDelete: 'CASCADE' });
  ChauffeurPosition.belongsTo(Vehicule, { foreignKey: 'vehicule_id', as: 'Vehicule', onDelete: 'CASCADE' });

  // Relations pour Itineraire et Ville
  Itineraire.belongsTo(Ville, { as: 'villePointA', foreignKey: 'ville_pointA_id' });
  Itineraire.belongsTo(Ville, { as: 'villePointB', foreignKey: 'ville_pointB_id' });

  // Relations pour Ville et Station
  Ville.hasMany(Station, { foreignKey: 'villeId', onDelete: 'CASCADE' });
  Station.belongsTo(Ville, { foreignKey: 'villeId' });

  // Relations pour Client et ses recherches
  Client.hasMany(ClientRecherche, { foreignKey: 'client_id', as: 'Recherches', onDelete: 'CASCADE' });
  ClientRecherche.belongsTo(Client, { foreignKey: 'client_id', onDelete: 'CASCADE' });
  ClientRecherche.belongsTo(Ville, { foreignKey: 'point_depart', as: 'villeDepart', onDelete: 'CASCADE' });
  ClientRecherche.belongsTo(Ville, { foreignKey: 'destination', as: 'villeDestination', onDelete: 'CASCADE' });



  // Relations pour Reservation 

Client.hasMany(Reservation, { foreignKey: 'client_id', onDelete: 'CASCADE' });
Reservation.belongsTo(Client, { foreignKey: 'client_id' });

Chauffeur.hasMany(Reservation, { foreignKey: 'chauffeur_id', onDelete: 'CASCADE' });
Reservation.belongsTo(Chauffeur, { foreignKey: 'chauffeur_id' });

Vehicule.hasMany(Reservation, { foreignKey: 'vehicule_id', onDelete: 'CASCADE' });
Reservation.belongsTo(Vehicule, { foreignKey: 'vehicule_id' });

Station.hasMany(Reservation, { foreignKey: 'station_depart_id', as: 'Depart', onDelete: 'CASCADE' });
Station.hasMany(Reservation, { foreignKey: 'station_arrivee_id', as: 'Arrivee', onDelete: 'CASCADE' });

Reservation.belongsTo(Station, { foreignKey: 'station_depart_id', as: 'StationDepart' });
Reservation.belongsTo(Station, { foreignKey: 'station_arrivee_id', as: 'StationArrivee' });


Reservation.belongsTo(Itineraire, { foreignKey: 'itineraire_id', as: 'Itineraire' });



  // Relations pour superviseur  et Station

  
Station.hasMany(Superviseur, { foreignKey: 'station_id', onDelete: 'CASCADE' });
Superviseur.belongsTo(Station, { foreignKey: 'station_id', onDelete: 'CASCADE' });




};
