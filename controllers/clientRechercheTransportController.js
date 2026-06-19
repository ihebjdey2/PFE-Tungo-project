const sequelize = require('../config/database');
const Client = require('../models/Client');
const Ville = require('../models/Ville');
const Station = require('../models/Station');
const HoraireTransport = require('../models/HoraireTransport');
const ArretTransport = require('../models/ArretTransport');
const ClientRechercheTransport = require('../models/ClientRechercheTransport');
const Compagnie = require('../models/Compagnie'); 
const { Op } = require('sequelize');

/**
 * ➕ Sauvegarder une recherche + trouver les horaires disponibles
 */
exports.searchHorairesTransport = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { ville_depart_id, ville_arrivee_id, date_voyage, type_transport } = req.body;

    if (!ville_depart_id || !ville_arrivee_id || !date_voyage || !type_transport) {
      return res.status(400).json({ message: "Champs requis : ville_depart_id, ville_arrivee_id, date_voyage, type_transport." });
    }

    // Vérifier client
    const client = await Client.findOne({ where: { utilisateur_id: req.user.id } });
    if (!client) return res.status(404).json({ message: "Client introuvable." });

    // Sauvegarder recherche
    await ClientRechercheTransport.create({
      client_id: client.utilisateur_id,
      ville_depart_id,
      ville_arrivee_id,
      date_voyage,
      type_transport
    }, { transaction });

    // Jour semaine
    const dateObj = new Date(date_voyage);
    const jourSemaine = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // Stations départ
    const stationsDepart = await Station.findAll({ where: { villeId: ville_depart_id } });
    const stationDepartIds = stationsDepart.map(s => s.id);

    // Recherche horaires (directs ou avec arrets)
    const horaires = await HoraireTransport.findAll({
      where: {
        station_depart_id: { [Op.in]: stationDepartIds },
        type: type_transport,
        statut: 'actif',
        [Op.or]: [
          { jour_semaine: { [Op.contains]: [jourSemaine] } },
          { date_exception: date_voyage }
        ]
      },
      include: [
        { model: Station, as: 'StationDepart' },
        { model: Station, as: 'StationArrivee' },
        { model: ArretTransport, as: 'Arrets', include: [{ model: Station, as: 'Station' }] },
        { model: Compagnie, as: 'Compagnie', attributes: ['id', 'nom'] } // <-- compagnie incluse
      ]
    });

    await transaction.commit();

    // 🔹 Normaliser résultats
    const resultats = [];


    for (const h of horaires) {
      const compagnieId = h.Compagnie?.id ?? null;
      const compagnieNom = h.Compagnie?.nom ?? null;
      // Cas direct
      if (h.StationArrivee && h.StationArrivee.villeId === ville_arrivee_id) {
        resultats.push({
          horaire_id: h.id,
          depart: h.StationDepart?.nom,
          arrivee: h.StationArrivee?.nom,
          heure_depart: h.heure_depart,
          heure_arrivee: h.heure_arrivee,
          prix: h.prix,
          capacite: h.capacite,
          type: h.type,
          compagnie_id: compagnieId,
          compagnie_nom: compagnieNom
        });
      }

      // Cas arrêt
      if (h.Arrets && h.Arrets.length > 0) {
        for (const arret of h.Arrets) {
          if (arret.ville_id === ville_arrivee_id) {
            resultats.push({
              horaire_id: h.id,
              depart: h.StationDepart?.nom,
              arrivee: arret.Station?.nom,
              heure_depart: h.heure_depart,
              heure_arrivee: arret.heure_passage,
              prix: arret.prix || h.prix,
              capacite: h.capacite,
              type: h.type
            });
          }
        }
      }
    }

    return res.json({
      message: "Recherche effectuée avec succès.",
      date_voyage,
      type_transport,
      jour_recherche: jourSemaine,
      resultats
    });

  } catch (err) {
    await transaction.rollback();
    console.error("Erreur searchHorairesTransport:", err.message);
    res.status(500).json({ error: err.message });
  }
};


/**
 * 📋 Récupérer l’historique des recherches d’un client
 */
exports.getHistoriqueRecherches = async (req, res) => {
  try {
    const client = await Client.findOne({ where: { utilisateur_id: req.user.id } });
    if (!client) {
      return res.status(404).json({ message: "Client introuvable." });
    }

    const recherches = await ClientRechercheTransport.findAll({
      where: { client_id: client.utilisateur_id },
      include: [
        { model: Ville, as: 'VilleDepartTransport' },
        { model: Ville, as: 'VilleArriveeTransport' }
      ],
      order: [['heure_recherche', 'DESC']]
    });

    res.json(recherches);
  } catch (err) {
    console.error("Erreur getHistoriqueRecherches:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ❌ Supprimer une recherche spécifique
 */
exports.deleteRecherche = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ where: { utilisateur_id: req.user.id } });

    const recherche = await ClientRechercheTransport.findOne({
      where: { id, client_id: client.utilisateur_id }
    });

    if (!recherche) {
      return res.status(404).json({ message: "Recherche introuvable." });
    }

    await recherche.destroy();
    res.json({ message: "Recherche supprimée avec succès." });
  } catch (err) {
    console.error("Erreur deleteRecherche:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ❌ Supprimer tout l’historique des recherches
 */
exports.clearHistoriqueRecherches = async (req, res) => {
  try {
    const client = await Client.findOne({ where: { utilisateur_id: req.user.id } });

    await ClientRechercheTransport.destroy({
      where: { client_id: client.utilisateur_id }
    });

    res.json({ message: "Historique des recherches supprimé avec succès." });
  } catch (err) {
    console.error("Erreur clearHistoriqueRecherches:", err.message);
    res.status(500).json({ error: err.message });
  }
};
