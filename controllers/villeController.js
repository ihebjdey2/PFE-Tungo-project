const Ville = require('../models/Ville');

/* =============================
   VILLES
============================= */

// ➕ Ajouter une ville
exports.ajouterVille = async (req, res) => {
  try {
    const { nom } = req.body;

    if (!nom || nom.trim() === "") {
      return res.status(400).json({ message: "Le nom de la ville est obligatoire." });
    }

    // Vérifier si une ville avec le même nom existe déjà
    const villeExistante = await Ville.findOne({ where: { nom } });
    if (villeExistante) {
      return res.status(400).json({ message: "Une ville avec ce nom existe déjà." });
    }

    const nouvelleVille = await Ville.create({ nom: nom.trim() });

    res.status(201).json({ message: "Ville ajoutée avec succès.", ville: nouvelleVille });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la ville :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 📋 Obtenir toutes les villes
exports.getVilles = async (req, res) => {
  try {
    const villes = await Ville.findAll({ order: [['nom', 'ASC']] });
    res.status(200).json(villes);
  } catch (error) {
    console.error("Erreur lors de la récupération des villes :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ✏️ Modifier une ville
exports.modifierVille = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    const ville = await Ville.findByPk(id);
    if (!ville) {
      return res.status(404).json({ message: "Ville introuvable." });
    }

    if (!nom || nom.trim() === "") {
      return res.status(400).json({ message: "Le nom de la ville est obligatoire." });
    }

    // Vérifier si une autre ville avec le même nom existe déjà
    const villeExistante = await Ville.findOne({ where: { nom, id: { [Op.ne]: id } } });
    if (villeExistante) {
      return res.status(400).json({ message: "Une autre ville avec ce nom existe déjà." });
    }

    await ville.update({ nom: nom.trim() });

    res.status(200).json({ message: "Ville mise à jour avec succès.", ville });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la ville :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// ❌ Supprimer une ville
exports.supprimerVille = async (req, res) => {
  try {
    const { id } = req.params;

    const ville = await Ville.findByPk(id);
    if (!ville) {
      return res.status(404).json({ message: "Ville introuvable." });
    }

    await ville.destroy();
    res.status(200).json({ message: "Ville supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la ville :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};
