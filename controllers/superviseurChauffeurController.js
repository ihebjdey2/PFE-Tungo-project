
// Récupérer tous les chauffeurs disponibles 
const Superviseur = require('../models/Superviseur');
const Station = require('../models/Station');
const ChauffeurPosition = require('../models/ChauffeurPosition');
const Chauffeur = require('../models/Chauffeur');
const Vehicule = require('../models/Vehicule');
const Utilisateur = require('../models/Utilisateur');

exports.getChauffeursDisponiblesParDestination = async (req, res) => {
  const { destinationId } = req.params;
  const { superviseurId } = req.params;

  try {
    // 🔹 1. Vérifier les droits du superviseur connecté
    const superviseur = await Superviseur.findByPk(superviseurId);
    if (!superviseur) {
      return res.status(403).json({ message: 'Superviseur non autorisé.' });
    }

    // 🔹 2. Récupérer sa station pour connaître la ville de départ
    const station = await Station.findByPk(superviseur.station_id);
    if (!station) {
      return res.status(404).json({ message: 'Station introuvable.' });
    }

    // 🔹 3. Vérifier que la destination demandée est dans ses droits
    if (!superviseur.destinations.includes(Number(destinationId))) {
      return res.status(403).json({ message: 'Vous ne pouvez pas consulter cette destination.' });
    }

    // 🔹 4. Récupérer les chauffeurs disponibles pour cette destination ET ce point de départ
    const chauffeurs = await ChauffeurPosition.findAll({
      where: {
        destination: destinationId,
        point_depart: station.villeId
      },
      include: [
        {
          model: Chauffeur,
          include: [{ model: Utilisateur, attributes: ['nom', 'prenom'] }],
        },
        {
          model: Vehicule,
          as: 'Vehicule',
          attributes: ['marque', 'modele', 'numero_de_plaques', 'capacite'],
        }
      ],
      order: [['priorite', 'ASC']]
    });

    // 🔹 5. Formatage de la réponse
    res.status(200).json({
      total: chauffeurs.length,
      data: chauffeurs.map(chauffeur => ({
        id: chauffeur.id,
        chauffeur_id: chauffeur.chauffeur_id,
        nom: chauffeur.Chauffeur?.Utilisateur?.nom,
        prenom: chauffeur.Chauffeur?.Utilisateur?.prenom,
        vehicule: {
          marque: chauffeur.Vehicule?.marque,
          modele: chauffeur.Vehicule?.modele,
          numero_de_plaques: chauffeur.Vehicule?.numero_de_plaques,
          capacite: chauffeur.Vehicule?.capacite,
        },
        point_depart: chauffeur.point_depart,
        destination: chauffeur.destination,
        priorite: chauffeur.priorite,
        derniere_mise_a_jour: chauffeur.derniere_mise_a_jour
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des chauffeurs disponibles pour superviseur :', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};



// Mettre à jour la priorité d'un chauffeur
exports.updatePriorite = async (req, res) => {
  const { chauffeur_id, nouvelle_priorite } = req.body;

  try {
    const chauffeurPosition = await ChauffeurPosition.findOne({
      where: { chauffeur_id }
    });

    if (!chauffeurPosition) {
      return res.status(404).json({ message: 'Position du chauffeur non trouvée.' });
    }

    // Mettre à jour la priorité
    chauffeurPosition.priorite = nouvelle_priorite;
    await chauffeurPosition.save();

    res.status(200).json({
      message: 'Priorité mise à jour avec succès.',
      chauffeur: {
        id: chauffeurPosition.id,
        chauffeur_id: chauffeurPosition.chauffeur_id,
        priorite: chauffeurPosition.priorite
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la priorité :', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};



/*
// Réorganiser les priorités de tous les chauffeurs
exports.reorganiserPriorites = async (req, res) => {
  const { nouvelles_priorites } = req.body; // Array de { chauffeur_id, nouvelle_priorite }

  try {
    // Vérifier que toutes les positions existent
    const chauffeurIds = nouvelles_priorites.map(p => p.chauffeur_id);
    const positions = await ChauffeurPosition.findAll({
      where: { chauffeur_id: { [Op.in]: chauffeurIds } }
    });

    if (positions.length !== chauffeurIds.length) {
      return res.status(400).json({ message: 'Certains chauffeurs n\'ont pas de position enregistrée.' });
    }

    // Mettre à jour les priorités
    for (const { chauffeur_id, nouvelle_priorite } of nouvelles_priorites) {
      await ChauffeurPosition.update(
        { priorite: nouvelle_priorite },
        { where: { chauffeur_id } }
      );
    }

    res.status(200).json({
      message: 'Priorités mises à jour avec succès.',
      total: nouvelles_priorites.length
    });
  } catch (error) {
    console.error('Erreur lors de la réorganisation des priorités :', error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}; 
*/