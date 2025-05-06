import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../viewmodels/reservation_viewmodel.dart';

class HistoriqueReservationsScreen extends StatefulWidget {
  const HistoriqueReservationsScreen({super.key});

  @override
  _HistoriqueReservationsScreenState createState() => _HistoriqueReservationsScreenState();
}

class _HistoriqueReservationsScreenState extends State<HistoriqueReservationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final reservationViewModel = Provider.of<ReservationViewModel>(context, listen: false);
      reservationViewModel.fetchReservationHistory();
    });
  }

  @override
  Widget build(BuildContext context) {
    final reservationViewModel = Provider.of<ReservationViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Historique des Réservations'),
        centerTitle: true,
        backgroundColor: Colors.purple,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: reservationViewModel.isLoading
            ? const Center(child: CircularProgressIndicator())
            : reservationViewModel.reservations.isEmpty
                ? _buildNoHistoryMessage()
                : _buildReservationList(reservationViewModel.reservations),
      ),
    );
  }

  Widget _buildNoHistoryMessage() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 20),
          const Text(
            "Aucune réservation passée.",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildReservationList(List<Map<String, dynamic>> reservations) {
    return ListView.builder(
      itemCount: reservations.length,
      itemBuilder: (context, index) {
        final reservation = reservations[index];
        return Card(
          elevation: 6,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            title: Text(
              "${reservation['StationDepart']['nom']} → ${reservation['StationArrivee']['nom']}",
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Chauffeur: ${reservation['Chauffeur']['Utilisateur']['nom']} ${reservation['Chauffeur']['Utilisateur']['prenom']}",
                    style: const TextStyle(fontSize: 14)),
                Text("Véhicule: ${reservation['Vehicule']['marque']} ${reservation['Vehicule']['modele']}"),
                Text("Statut: ${reservation['statut']}",
                    style: TextStyle(color: reservation['statut'] == 'annulée' ? Colors.red : Colors.green)),
                Text("Prix: ${reservation['prix']} TND"),
                Text("Date: ${DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(reservation['heure_reservation']))}"),
              ],
            ),
            leading: const Icon(Icons.directions_bus, color: Colors.purple),
          ),
        );
      },
    );
  }
}
