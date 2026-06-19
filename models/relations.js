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
const Colis = require('./Colis');
const Conversation = require('./Conversation');
const Message = require('./Message');

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




Client.hasMany(Colis, { foreignKey: 'client_id', onDelete: 'CASCADE' });
Colis.belongsTo(Client, { foreignKey: 'client_id' });

Chauffeur.hasMany(Colis, { foreignKey: 'chauffeur_id', onDelete: 'SET NULL' });
Colis.belongsTo(Chauffeur, { foreignKey: 'chauffeur_id' });

Station.hasMany(Colis, { foreignKey: 'station_depart_id', as: 'ColisDepart', onDelete: 'CASCADE' });
Station.hasMany(Colis, { foreignKey: 'station_arrivee_id', as: 'ColisArrivee', onDelete: 'CASCADE' });

Colis.belongsTo(Station, { foreignKey: 'station_depart_id', as: 'StationDepart' });
Colis.belongsTo(Station, { foreignKey: 'station_arrivee_id', as: 'StationArrivee' });







const Compagnie = require('./Compagnie');
const ItineraireBus = require('./ItineraireBus');
const ItineraireTrain = require('./ItineraireTrain');
const HoraireTransport = require('./HoraireTransport');
const ArretTransport = require('./ArretTransport');
const CompagnieStation = require('./CompagnieStation');

// ===============================
// Relations pour HoraireTransport
// ===============================

// 🔹 Relation avec les stations (départ & arrivée)
Station.hasMany(HoraireTransport, { foreignKey: 'station_depart_id', as: 'DepartBusTrain' });
Station.hasMany(HoraireTransport, { foreignKey: 'station_arrivee_id', as: 'ArriveeBusTrain' });

HoraireTransport.belongsTo(Station, { foreignKey: 'station_depart_id', as: 'StationDepart' });
HoraireTransport.belongsTo(Station, { foreignKey: 'station_arrivee_id', as: 'StationArrivee' });

// 🔹 Relation avec la compagnie (SNTRI, SNCFT…)
Compagnie.hasMany(HoraireTransport, { foreignKey: 'compagnie_id', as: 'Horaires' });
HoraireTransport.belongsTo(Compagnie, { foreignKey: 'compagnie_id', as: 'Compagnie' });
// =============================
// Relation Station <-> Compagnie
// =============================
Station.belongsToMany(Compagnie, {
  through: CompagnieStation, // ✅ utiliser ton modèle pivot
  foreignKey: 'station_id',
  otherKey: 'compagnie_id',
  as: 'Compagnies'
});

Compagnie.belongsToMany(Station, {
  through: CompagnieStation, // ✅ idem ici
  foreignKey: 'compagnie_id',
  otherKey: 'station_id',
  as: 'Stations'
});


// 🔹 Relation avec les itinéraires
ItineraireBus.hasMany(HoraireTransport, { foreignKey: 'itineraire_bus_id', as: 'HorairesBus' });
HoraireTransport.belongsTo(ItineraireBus, { foreignKey: 'itineraire_bus_id', as: 'ItineraireBus' });

ItineraireTrain.hasMany(HoraireTransport, { foreignKey: 'itineraire_train_id', as: 'HorairesTrain' });
HoraireTransport.belongsTo(ItineraireTrain, { foreignKey: 'itineraire_train_id', as: 'ItineraireTrain' });



Ville.hasMany(ItineraireBus, { foreignKey: 'ville_pointA_id', as: 'ItinerairesDepartBus' });
Ville.hasMany(ItineraireBus, { foreignKey: 'ville_pointB_id', as: 'ItinerairesArriveeBus' });

ItineraireBus.belongsTo(Ville, { foreignKey: 'ville_pointA_id', as: 'VilleDepartBus' });
ItineraireBus.belongsTo(Ville, { foreignKey: 'ville_pointB_id', as: 'VilleArriveeBus' });




Ville.hasMany(ItineraireTrain, { foreignKey: 'ville_pointA_id', as: 'ItinerairesDepartTrain' });
Ville.hasMany(ItineraireTrain, { foreignKey: 'ville_pointB_id', as: 'ItinerairesArriveeTrain' });

ItineraireTrain.belongsTo(Ville, { foreignKey: 'ville_pointA_id', as: 'VilleDepartTrain' });
ItineraireTrain.belongsTo(Ville, { foreignKey: 'ville_pointB_id', as: 'VilleArriveeTrain' });

// ===========================
// Relations pour ArretTransport
// ===========================
// Un itinéraire Bus peut avoir plusieurs arrêts
ItineraireBus.hasMany(ArretTransport, { foreignKey: 'itineraire_bus_id', as: 'ArretsBus' });
ArretTransport.belongsTo(ItineraireBus, { foreignKey: 'itineraire_bus_id', as: 'ItineraireBus' });

// Un itinéraire Train peut avoir plusieurs arrêts
ItineraireTrain.hasMany(ArretTransport, { foreignKey: 'itineraire_train_id', as: 'ArretsTrain' });
ArretTransport.belongsTo(ItineraireTrain, { foreignKey: 'itineraire_train_id', as: 'ItineraireTrain' });
// 🔹 Un horaire (bus/train) possède plusieurs arrêts
HoraireTransport.hasMany(ArretTransport, { foreignKey: 'horaire_id', as: 'Arrets' });
ArretTransport.belongsTo(HoraireTransport, { foreignKey: 'horaire_id', as: 'Horaire' });

// 🔹 Chaque arrêt est associé à une station
Station.hasMany(ArretTransport, { foreignKey: 'station_id', as: 'ArretsStation' });
ArretTransport.belongsTo(Station, { foreignKey: 'station_id', as: 'Station' });

// Un arrêt appartient à une ville
Ville.hasMany(ArretTransport, { foreignKey: 'ville_id', as: 'ArretsVille' });
ArretTransport.belongsTo(Ville, { foreignKey: 'ville_id', as: 'Ville' });


const ReservationTransport = require('./ReservationTransport');

// ===========================
// Relations pour ReservationTransport (Bus/Train)
// ===========================

// 🔹 Un client peut faire plusieurs réservations bus/train
Client.hasMany(ReservationTransport, { foreignKey: 'client_id', onDelete: 'CASCADE' });
ReservationTransport.belongsTo(Client, { foreignKey: 'client_id' });

// 🔹 Lien avec HoraireTransport (obligatoire pour bus/train)
HoraireTransport.hasMany(ReservationTransport, { foreignKey: 'horaire_id', as: 'Reservations' });
ReservationTransport.belongsTo(HoraireTransport, { foreignKey: 'horaire_id', as: 'Horaire' });

// 🔹 Lien avec stations départ/arrivée
Station.hasMany(ReservationTransport, { foreignKey: 'station_depart_id', as: 'DepartTransport', onDelete: 'CASCADE' });
Station.hasMany(ReservationTransport, { foreignKey: 'station_arrivee_id', as: 'ArriveeTransport', onDelete: 'CASCADE' });

ReservationTransport.belongsTo(Station, { foreignKey: 'station_depart_id', as: 'StationDepartTransport' });
ReservationTransport.belongsTo(Station, { foreignKey: 'station_arrivee_id', as: 'StationArriveeTransport' });




  Utilisateur.hasMany(Conversation, {
    foreignKey: 'user_id',
    as: 'conversations'
  });
  Conversation.belongsTo(Utilisateur, {
    foreignKey: 'user_id',
    as: 'utilisateur'
  });

  // Conversation <-> Message
  Conversation.hasMany(Message, {
    foreignKey: 'conversation_id',
    as: 'messages',
    onDelete: 'CASCADE',    // supprime messages si conversation supprimée
    hooks: true
  });
  Message.belongsTo(Conversation, {
    foreignKey: 'conversation_id',
    as: 'conversation'
  });

  // Message <-> Utilisateur (optionnel, si tu veux savoir quel utilisateur a envoyé)
  Utilisateur.hasMany(Message, {
    foreignKey: 'user_id',
    as: 'messagesSent',
    allowNull: true
  });
  Message.belongsTo(Utilisateur, {
    foreignKey: 'user_id',
    as: 'author'
  });
};

