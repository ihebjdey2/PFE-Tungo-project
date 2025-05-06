import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:logger/logger.dart';
import '../../viewmodels/reservation_viewmodel.dart';

class ReservationActuelleScreen extends StatefulWidget {
  const ReservationActuelleScreen({super.key});

  @override
  ReservationActuelleScreenState createState() => ReservationActuelleScreenState();
}

class ReservationActuelleScreenState extends State<ReservationActuelleScreen> {
  final Logger logger = Logger(); 

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final reservationViewModel = Provider.of<ReservationViewModel>(context, listen: false);
      logger.i("🔄 Chargement automatique de la réservation actuelle...");
      reservationViewModel.fetchCurrentReservation();
    });
  }

  @override
  Widget build(BuildContext context) {
    final reservationViewModel = Provider.of<ReservationViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Réservation Actuelle'),
        centerTitle: true,
        backgroundColor: Colors.purple,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              logger.i("🔄 Rafraîchissement manuel de la réservation...");
              reservationViewModel.fetchCurrentReservation();
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: reservationViewModel.isLoading
            ? const Center(child: CircularProgressIndicator())
            : reservationViewModel.currentReservation == null
                ? _buildNoReservationMessage()
                : _buildReservationDetails(reservationViewModel.currentReservation!),
      ),
    );
  }

  Widget _buildNoReservationMessage() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hourglass_empty, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 20),
          const Text(
            "Aucune réservation en cours",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
        ],
      ),
    );
  }

Widget _buildReservationDetails(Map<String, dynamic> reservation) {
  String statut = reservation['statut'];
  int stepIndex = _getStepIndex(statut);

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      // Carte stylisée pour la réservation
      Card(
        elevation: 10,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        shadowColor: Colors.black54,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildInfoRow(Icons.person, "Chauffeur", "${reservation['Chauffeur']['Utilisateur']['nom']} ${reservation['Chauffeur']['Utilisateur']['prenom']}"),
              _buildInfoRow(Icons.directions_car, "Véhicule", "${reservation['Vehicule']['marque']} ${reservation['Vehicule']['modele']} (${reservation['Vehicule']['numero_de_plaques']})"),
              _buildInfoRow(Icons.location_on, "Départ", "${reservation['StationDepart']['nom']} (${reservation['StationDepart']['adresse']})"),
              _buildInfoRow(Icons.flag, "Arrivée", "${reservation['StationArrivee']['nom']} (${reservation['StationArrivee']['adresse']})"),
              _buildInfoRow(Icons.chair, "Nombre de places", "${reservation['nombre_places']}"),
              _buildInfoRow(Icons.attach_money, "Prix", "${reservation['prix']} TND"),
            ],
          ),
        ),
      ),

      const SizedBox(height: 20),
      // Barre de progression animée
      AnimatedProgressBar(stepIndex: stepIndex),

      const SizedBox(height: 20),

      // Afficher le bouton uniquement si le statut est "en_attente" ou "confirmée"
      if (statut == 'en_attente' || statut == 'confirmée')
        ElevatedButton(
          onPressed: () async {
            final reservationViewModel = Provider.of<ReservationViewModel>(context, listen: false);

            bool success = await reservationViewModel.cancelCurrentReservation();

            if (success) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Réservation annulée avec succès.")),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(reservationViewModel.errorMessage ?? "Erreur inconnue")),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
          ),
          child: const Text("Annuler la Réservation", style: TextStyle(color: Colors.white)),
        ),
    ],
  );
}

  int _getStepIndex(String statut) {
    switch (statut) {
      case 'en_attente': return 0;
      case 'confirmée': return 1;
      case 'en_cours': return 2;
      case 'terminée': return 3;
      default: return 0;
    }
  }

  Widget _buildInfoRow(IconData icon, String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.purple, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(fontSize: 16, color: Colors.black),
                children: [
                  TextSpan(
                    text: "$title : ",
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  TextSpan(text: value),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AnimatedProgressBar extends StatelessWidget {
  final int stepIndex;

  const AnimatedProgressBar({super.key, required this.stepIndex});

  @override
  Widget build(BuildContext context) {
    List<String> steps = ["En attente", "Confirmée", "En cours", "Terminée"];

    return Column(
      children: [
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 500),
          child: Text(
            steps[stepIndex],
            key: ValueKey<int>(stepIndex),
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.orange),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: List.generate(4, (index) {
            bool isActive = index <= stepIndex;
            return Expanded(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: isActive ? Colors.orange : Colors.grey[300],
                    child: isActive
                        ? const Icon(Icons.check, color: Colors.white, size: 16)
                        : Text(
                            (index + 1).toString(),
                            style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.bold),
                          ),
                  ),
                  if (index < 3)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 500),
                        height: 4,
                        color: index < stepIndex ? Colors.orange : Colors.grey[300],
                      ),
                    ),
                ],
              ),
            );
          }),
        ),
      ],
    );
  }
}