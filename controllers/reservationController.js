const Reservation = require('../models/Reservation');
const Chauffeur = require('../models/Chauffeur');
const Client = require('../models/Client');
const Vehicule = require('../models/Vehicule');
const Station = require('../models/Station');
const Ville = require('../models/Ville');
const Itineraire = require('../models/Itineraire');
const Utilisateur = require('../models/Utilisateur');
const ChauffeurPosition = require('../models/ChauffeurPosition');
const { Op } = require('sequelize');

exports.createReservation = async (req, res) => {
    try {
        const { chauffeur_id, ville_depart_id, ville_destination_id, nombre_places } = req.body;
        const client_id = req.user.id;

        // Vérifier si `nombre_places` est un entier valide
        if (!Number.isInteger(nombre_places) || nombre_places <= 0) {
            return res.status(400).json({ message: "Le nombre de places doit être un nombre entier supérieur à 0." });
        }

        // Vérifier l'existence des villes
        const villeDepart = await Ville.findByPk(ville_depart_id);
        const villeDestination = await Ville.findByPk(ville_destination_id);
        if (!villeDepart || !villeDestination) {
            return res.status(400).json({ message: "Le point de départ ou la destination est invalide." });
        }

        // Vérifier si le client a déjà une réservation en attente ou confirmée
        const existingReservation = await Reservation.findOne({
            where: { client_id, statut: { [Op.in]: ['en_attente', 'confirmée'] } }
        });
        if (existingReservation) {
            return res.status(400).json({ message: "Vous avez déjà une réservation en attente ou confirmée." });
        }

        // Trouver l'itinéraire
        const itineraire = await Itineraire.findOne({
            where: {
                [Op.or]: [
                    { ville_pointA_id: ville_depart_id, ville_pointB_id: ville_destination_id },
                    { ville_pointA_id: ville_destination_id, ville_pointB_id: ville_depart_id }
                ]
            }
        });
        if (!itineraire) {
            return res.status(404).json({ message: "Aucun itinéraire disponible pour ces villes." });
        }

        // Récupérer la station de départ et d’arrivée
        const stationDepart = await Station.findOne({
            where: { villeId: ville_depart_id, destinations: { [Op.contains]: [ville_destination_id] } }
        });
        if (!stationDepart) {
            return res.status(404).json({ message: "Aucune station de départ disponible pour cet itinéraire." });
        }

        const stationArrivee = await Station.findOne({
            where: { villeId: ville_destination_id, destinations: { [Op.contains]: [ville_depart_id] } }
        });
        if (!stationArrivee) {
            return res.status(404).json({ message: "Aucune station d’arrivée disponible pour cet itinéraire." });
        }

        // Vérifier si le chauffeur existe
        const chauffeur = await Chauffeur.findByPk(chauffeur_id);
        if (!chauffeur) {
            return res.status(400).json({ message: "Le chauffeur sélectionné est invalide." });
        }

        // 🔹 Récupérer le véhicule depuis ChauffeurPosition
        const chauffeurPosition = await ChauffeurPosition.findOne({
            where: { chauffeur_id }
        });

        if (!chauffeurPosition) {
            return res.status(400).json({ message: "Le chauffeur n'a pas de véhicule attribué." });
        }

        const vehicule = await Vehicule.findByPk(chauffeurPosition.vehicule_id);
        if (!vehicule || vehicule.capacite < nombre_places) {
            return res.status(400).json({ message: `Le véhicule ne dispose que de ${vehicule?.capacite || 0} places disponibles.` });
        }

        // Calcul du prix total
        const prix = itineraire.tarif_base * nombre_places;

        // Création de la réservation
        const reservation = await Reservation.create({
            client_id,
            chauffeur_id: chauffeur.utilisateur_id,
            vehicule_id: vehicule.id,
            station_depart_id: stationDepart.id,
            station_arrivee_id: stationArrivee.id,
            itineraire_id: itineraire.id,
            statut: 'en_attente',
            heure_reservation: new Date(),
            nombre_places,
            prix
        });

        res.status(201).json({ message: "Réservation créée avec succès.", reservation });

    } catch (error) {
        console.error("Erreur lors de la création de la réservation :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};



exports.confirmReservation = async (req, res) => {
    try {
        const { reservation_id } = req.body;
        const chauffeur_id = req.user.id; // ID du chauffeur connecté

        // 🔹 Trouver la plus ancienne réservation en attente pour ce chauffeur
        const oldestPendingReservation = await Reservation.findOne({
            where: { chauffeur_id, statut: 'en_attente' },
            order: [['heure_reservation', 'ASC']] // 📌 Trier par date de réservation
        });

        if (!oldestPendingReservation) {
            return res.status(404).json({ message: "Aucune réservation en attente trouvée." });
        }

        // 🔹 Vérifier si la réservation sélectionnée est bien la plus ancienne
        if (oldestPendingReservation.id !== reservation_id) {
            return res.status(400).json({ message: "Vous devez d'abord confirmer la réservation la plus ancienne." });
        }

        // 🔹 Vérifier si le véhicule a encore de la place
        const vehicule = await Vehicule.findOne({ where: { id: oldestPendingReservation.vehicule_id } });

        if (!vehicule) {
            return res.status(400).json({ message: "Aucun véhicule associé à cette réservation." });
        }

        if (vehicule.capacite < oldestPendingReservation.nombre_places) {
            return res.status(400).json({ message: "La capacité du véhicule est insuffisante." });
        }

        // 🔹 Diminuer la capacité du véhicule
        vehicule.capacite -= oldestPendingReservation.nombre_places;
        await vehicule.save();

        // 🔹 Si la capacité atteint 0, supprimer le chauffeur de `ChauffeurPosition`
        if (vehicule.capacite === 0) {
            await ChauffeurPosition.destroy({ where: { chauffeur_id } });
            console.log(`🚗 Chauffeur ${chauffeur_id} supprimé de la table ChauffeurPosition.`);
        }

        // 🔹 Mettre à jour le statut de la réservation
        oldestPendingReservation.statut = 'confirmée';
        await oldestPendingReservation.save();

        res.status(200).json({
            message: "Réservation confirmée avec succès.",
            reservation: oldestPendingReservation
        });

    } catch (error) {
        console.error("❌ Erreur lors de la confirmation de la réservation :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};


exports.getPendingReservationsForChauffeur = async (req, res) => {
    try {
        const chauffeur_id = req.user.id; // ID du chauffeur connecté

        // 🔹 Récupérer les réservations en attente du chauffeur triées par la plus ancienne en premier
        const reservations = await Reservation.findAll({
            where: {
                chauffeur_id,
                statut: 'en_attente' // 🔹 Seules les réservations en attente sont affichées
            },
            include: [
                { model: Client, as: 'Client', include: [{ model: Utilisateur, attributes: ['nom', 'prenom'] }] },
                { model: Vehicule, as: 'Vehicule', attributes: ['marque', 'modele', 'numero_de_plaques'] },
                { model: Station, as: 'StationDepart', attributes: ['nom', 'adresse'] },
                { model: Station, as: 'StationArrivee', attributes: ['nom', 'adresse'] },
                { model: Itineraire, as: 'Itineraire', attributes: ['tarif_base', 'distance', 'duree_estimee'] }
            ],
            order: [['heure_reservation', 'ASC']]
        });

        if (reservations.length === 0) {
            return res.status(404).json({ message: "Aucune réservation en attente trouvée." });
        }

        res.status(200).json({ reservations });

    } catch (error) {
        console.error("Erreur lors de la récupération des réservations en attente :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};



exports.cancelReservation = async (req, res) => {
    try {
        const { reservation_id } = req.body;
        const client_id = req.user.id; // Récupérer l'ID du client connecté

        // Vérifier si la réservation existe et appartient bien au client
        const reservation = await Reservation.findOne({
            where: { id: reservation_id, client_id },
            include: [
                { model: Vehicule, as: 'Vehicule' },
                { model: Chauffeur, as: 'Chauffeur' },
                { model: Itineraire, as: 'Itineraire' }, // 🔹 Ajout pour récupérer les villes
            ]
        });

        if (!reservation) {
            return res.status(404).json({ message: "Réservation introuvable ou vous n'êtes pas autorisé à l'annuler." });
        }

        // Vérifier si la réservation est encore annulable
        if (!['en_attente', 'confirmée'].includes(reservation.statut)) {
            return res.status(400).json({ message: "Impossible d'annuler une réservation déjà en cours ou terminée." });
        }

        const vehicule = reservation.Vehicule;

        // 🔹 Vérifier si une position de chauffeur existait avant la suppression
        let anciennePosition = await ChauffeurPosition.findOne({ where: { chauffeur_id: reservation.chauffeur_id } });

        // Si la réservation est confirmée, restaurer la capacité du véhicule
        if (reservation.statut === 'confirmée' && vehicule) {
            vehicule.capacite += reservation.nombre_places;
            await vehicule.save();

            // 🔹 Si le chauffeur avait été supprimé, le réinsérer dans `ChauffeurPosition`
            if (!anciennePosition) {
                anciennePosition = {
                    chauffeur_id: reservation.chauffeur_id,
                    vehicule_id: vehicule.id,
                    point_depart: reservation.Itineraire.ville_pointA_id, // 🔹 Restaurer l'ID de la ville de départ
                    destination: reservation.Itineraire.ville_pointB_id, // 🔹 Restaurer l'ID de la ville de destination
                    derniere_mise_a_jour: new Date(),
                };

                await ChauffeurPosition.create(anciennePosition);
                console.log(`✅ Chauffeur ${reservation.chauffeur_id} restauré dans ChauffeurPosition avec les mêmes informations de ville.`);
            }
        }

        // Mettre à jour le statut de la réservation à "annulée"
        reservation.statut = 'annulée';
        await reservation.save();

        res.status(200).json({
            message: "Réservation annulée avec succès.",
            reservation
        });

    } catch (error) {
        console.error("❌ Erreur lors de l'annulation de la réservation :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};


exports.getCurrentReservation = async (req, res) => {
    try {
        const client_id = req.user.id;

        // 🔹 Récupérer la dernière réservation (peu importe le statut)
        const reservation = await Reservation.findOne({
            where: { client_id },
            include: [
                { model: Chauffeur, as: 'Chauffeur', include: [{ model: Utilisateur, attributes: ['nom', 'prenom'] }] },
                { model: Vehicule, as: 'Vehicule', attributes: ['marque', 'modele', 'numero_de_plaques'] },
                { model: Station, as: 'StationDepart', attributes: ['nom', 'adresse'] },
                { model: Station, as: 'StationArrivee', attributes: ['nom', 'adresse'] },
                { model: Itineraire, as: 'Itineraire', attributes: ['tarif_base', 'distance', 'duree_estimee'] }
            ],
            order: [['heure_reservation', 'DESC']] // 📌 Trier par date décroissante pour prendre la plus récente
        });

        // Si aucune réservation trouvée
        if (!reservation) {
            return res.status(404).json({ message: "Aucune réservation trouvée." });
        }

        res.status(200).json({ reservation });

    } catch (error) {
        console.error("Erreur lors de la récupération de la réservation actuelle :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};



exports.getReservationHistory = async (req, res) => {
    try {
        const client_id = req.user.id; // Récupérer l'ID du client connecté

        // Récupérer l'historique des réservations (terminées ou annulées)
        const reservations = await Reservation.findAll({
            where: {
                client_id,
                statut: { [Op.in]: ['terminée', 'annulée'] } // 🔹 Historique des trajets finis
            },
            include: [
                { model: Chauffeur, as: 'Chauffeur', include: [{ model: Utilisateur, attributes: ['nom', 'prenom'] }] },
                { model: Vehicule, as: 'Vehicule', attributes: ['marque', 'modele', 'numero_de_plaques'] },
                { model: Station, as: 'StationDepart', attributes: ['nom', 'adresse'] },
                { model: Station, as: 'StationArrivee', attributes: ['nom', 'adresse'] },
                { model: Itineraire, as: 'Itineraire', attributes: ['tarif_base', 'distance', 'duree_estimee'] }
            ],
            order: [['heure_reservation', 'DESC']]
        });

        if (reservations.length === 0) {
            return res.status(404).json({ message: "Aucune réservation passée trouvée." });
        }

        res.status(200).json({ reservations });

    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique des réservations :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

exports.getConfirmedReservationsForChauffeur = async (req, res) => {
    try {
        const chauffeur_id = req.user.id; // ID du chauffeur connecté

        // 🔹 Récupérer les réservations confirmées du chauffeur
        const reservations = await Reservation.findAll({
            where: {
                chauffeur_id,
                statut: 'confirmée'
            },
            include: [
                { model: Client, as: 'Client', include: [{ model: Utilisateur, attributes: ['nom', 'prenom'] }] },
                { model: Vehicule, as: 'Vehicule', attributes: ['marque', 'modele', 'numero_de_plaques'] },
                { model: Station, as: 'StationDepart', attributes: ['nom', 'adresse'] },
                { model: Station, as: 'StationArrivee', attributes: ['nom', 'adresse'] },
                { model: Itineraire, as: 'Itineraire', attributes: ['tarif_base', 'distance', 'duree_estimee'] }
            ],
            order: [['heure_reservation', 'ASC']]
        });

        if (reservations.length === 0) {
            return res.status(404).json({ message: "Aucune réservation confirmée trouvée." });
        }

        res.status(200).json({ reservations });

    } catch (error) {
        console.error("Erreur lors de la récupération des réservations confirmées :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};


exports.startTrip = async (req, res) => {
    try {
        const chauffeur_id = req.user.id;

        // Trouver toutes les réservations confirmées pour ce chauffeur
        const reservations = await Reservation.findAll({
            where: { chauffeur_id, statut: 'confirmée' }
        });

        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: "Aucune réservation confirmée trouvée." });
        }

        // Mettre à jour toutes les réservations confirmées en "en_cours"
        await Reservation.update(
            { statut: 'en_cours' },
            { where: { chauffeur_id, statut: 'confirmée' } }
        );

        res.status(200).json({ 
            message: `${reservations.length} réservation(s) démarrée(s) avec succès.`,
            reservations
        });

    } catch (error) {
        console.error("Erreur lors du démarrage du voyage :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

exports.endTrip = async (req, res) => {
    try {
        const chauffeur_id = req.user.id;

        // Trouver toutes les réservations en cours pour ce chauffeur
        const reservations = await Reservation.findAll({
            where: { chauffeur_id, statut: 'en_cours' },
            include: [{ model: Vehicule, as: 'Vehicule' }] // 🔹 Inclure le véhicule
        });

        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: "Aucune réservation en cours trouvée." });
        }

        let totalPlacesRestaurees = 0;
        let vehiculesTraites = new Set(); // 🔹 Pour éviter les mises à jour en double

        // Restaurer les places et changer le statut du véhicule
        for (const reservation of reservations) {
            const vehicule = reservation.Vehicule;

            if (vehicule) {
                vehicule.capacite += reservation.nombre_places; // 🔹 Restauration du nombre de places

                // Vérifier si le véhicule est plein avant de le passer en "disponible"
                if (!vehiculesTraites.has(vehicule.id)) { // 🔹 Éviter de traiter le même véhicule plusieurs fois
                    if (vehicule.capacite > 0) {
                        vehicule.statut = "disponible"; // 🔹 Mettre le statut à "disponible"
                    }
                    await vehicule.save();
                    vehiculesTraites.add(vehicule.id);
                }

                totalPlacesRestaurees += reservation.nombre_places;
            }
        }

        // Mettre à jour le statut des réservations en "terminée"
        await Reservation.update(
            { statut: 'terminée' },
            { where: { chauffeur_id, statut: 'en_cours' } }
        );

        res.status(200).json({ 
            message: `${reservations.length} réservation(s) terminée(s) avec succès. Nombre de places restaurées : ${totalPlacesRestaurees}. Statut du véhicule mis à jour.`,
            reservations
        });

    } catch (error) {
        console.error("Erreur lors de la fin du voyage :", error.message);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};