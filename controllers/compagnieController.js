const Compagnie = require('../models/Compagnie');
const Station = require('../models/Station');
const CompagnieStation = require('../models/CompagnieStation');

/* ==========================
   CRUD Compagnie
========================== */

// ➕ Ajouter une compagnie
exports.ajouterCompagnie = async (req, res) => {
  try {
    const { nom, type, telephone, email } = req.body;

    if (!['bus', 'train'].includes(type)) {
      return res.status(400).json({ message: "Type invalide. Doit être 'bus' ou 'train'." });
    }

    const compagnie = await Compagnie.create({ nom, type, telephone, email });

    res.status(201).json({ message: "Compagnie ajoutée avec succès.", compagnie });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la compagnie :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 📋 Lister toutes les compagnies
exports.getCompagnies = async (req, res) => {
  try {
    const compagnies = await Compagnie.findAll();
    res.status(200).json(compagnies);
  } catch (error) {
    console.error("Erreur lors de la récupération des compagnies :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ✏️ Modifier une compagnie
exports.updateCompagnie = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, type, telephone, email } = req.body;

    const compagnie = await Compagnie.findByPk(id);
    if (!compagnie) return res.status(404).json({ message: "Compagnie introuvable." });

    await compagnie.update({ nom, type, telephone, email });
    res.status(200).json({ message: "Compagnie mise à jour avec succès.", compagnie });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la compagnie :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ❌ Supprimer une compagnie
exports.deleteCompagnie = async (req, res) => {
  try {
    const { id } = req.params;
    const compagnie = await Compagnie.findByPk(id);
    if (!compagnie) return res.status(404).json({ message: "Compagnie introuvable." });

    await compagnie.destroy();
    res.status(200).json({ message: "Compagnie supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la compagnie :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

/* ==========================
   Association Compagnie ↔ Station
========================== */

// 🔗 Associer une compagnie à une station
exports.associerCompagnieStation = async (req, res) => {
  try {
    const { compagnie_id, station_id } = req.body;

    const station = await Station.findByPk(station_id);
    if (!station) return res.status(404).json({ message: "Station introuvable." });

    if (station.type_station === 'louage') {
      return res.status(400).json({ message: "Les stations de type 'louage' ne peuvent pas avoir de compagnies." });
    }

    const compagnie = await Compagnie.findByPk(compagnie_id);
    if (!compagnie) return res.status(404).json({ message: "Compagnie introuvable." });

    // 🚨 Vérifier cohérence type station ↔ type compagnie
    if (compagnie.type !== station.type_station) {
      return res.status(400).json({
        message: `Incohérence : Compagnie (${compagnie.type}) ≠ Station (${station.type_station})`
      });
    }

    await station.addCompagny(compagnie);

    res.status(200).json({ message: "Compagnie associée à la station avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'association compagnie-station :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ❌ Retirer une association compagnie ↔ station
exports.retirerCompagnieStation = async (req, res) => {
  try {
    const { compagnie_id, station_id } = req.body;

    const station = await Station.findByPk(station_id);
    if (!station) return res.status(404).json({ message: "Station introuvable." });

    const compagnie = await Compagnie.findByPk(compagnie_id);
    if (!compagnie) return res.status(404).json({ message: "Compagnie introuvable." });

    await station.removeCompagnies([compagnie]);

    res.status(200).json({ message: "Compagnie retirée de la station avec succès." });
  } catch (error) {
    console.error("Erreur lors du retrait compagnie-station :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


exports.getCompagniesByStation = async (req, res) => {
  try {
    const { stationId } = req.params;

    const station = await Station.findByPk(stationId);
    if (!station) {
      return res.status(404).json({ message: 'Station introuvable' });
    }

    // ⚠️ utilise l’alias défini dans relations.js: Station.belongsToMany(Compagnie, { as: 'Compagnies', ... })
    const compagnies = await station.getCompagnies({
      attributes: ['id', 'nom', 'type'],
      joinTableAttributes: [] // pas besoin des champs du pivot
    });

    return res.json(compagnies);
  } catch (err) {
    console.error('getCompagniesByStation error:', err);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};