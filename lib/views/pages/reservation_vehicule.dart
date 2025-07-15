import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/recherche_viewmodel.dart';
import '../../viewmodels/reservation_viewmodel.dart';

class ReservationVehiculeScreen extends StatefulWidget {
  final int pointDepartId;
  final int destinationId;
  final String token;

  const ReservationVehiculeScreen({
    Key? key,
    required this.pointDepartId,
    required this.destinationId,
    required this.token,
  }) : super(key: key);

  @override
  _ReservationVehiculeScreenState createState() => _ReservationVehiculeScreenState();
}

class _ReservationVehiculeScreenState extends State<ReservationVehiculeScreen> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _dateDepart;
  TimeOfDay? _heureDepart;

  @override
  Widget build(BuildContext context) {
    final rechercheViewModel = Provider.of<RechercheViewModel>(context);

    return Scaffold(
      backgroundColor: Colors.grey[200],
      appBar: AppBar(
        title: const Text('Réservation Véhicule'),
        centerTitle: true,
        backgroundColor: Colors.purple,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildInfoCard(rechercheViewModel),
                const SizedBox(height: 20),
                _buildDatePicker(),
                const SizedBox(height: 20),
                _buildTimePicker(),
                const SizedBox(height: 30),
                _buildReserveButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(RechercheViewModel rechercheViewModel) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      elevation: 5,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Détails du trajet',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.purple,
              ),
            ),
            const SizedBox(height: 10),
            _buildInfoRow(
              Icons.location_on,
              'Départ',
              rechercheViewModel.stationDepart?['nom'] ?? 'Non spécifié',
            ),
            const SizedBox(height: 8),
            _buildInfoRow(
              Icons.flag,
              'Arrivée',
              rechercheViewModel.stationArrivee?['nom'] ?? 'Non spécifié',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: Colors.purple, size: 20),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        Expanded(
          child: Text(value),
        ),
      ],
    );
  }

  Widget _buildDatePicker() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      elevation: 5,
      child: ListTile(
        leading: const Icon(Icons.calendar_today, color: Colors.purple),
        title: Text(_dateDepart == null
            ? 'Sélectionner une date'
            : '${_dateDepart!.day}/${_dateDepart!.month}/${_dateDepart!.year}'),
        onTap: () async {
          final DateTime? picked = await showDatePicker(
            context: context,
            initialDate: _dateDepart ?? DateTime.now(),
            firstDate: DateTime.now(),
            lastDate: DateTime.now().add(const Duration(days: 30)),
          );
          if (picked != null) {
            setState(() {
              _dateDepart = picked;
            });
          }
        },
      ),
    );
  }

  Widget _buildTimePicker() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      elevation: 5,
      child: ListTile(
        leading: const Icon(Icons.access_time, color: Colors.purple),
        title: Text(_heureDepart == null
            ? 'Sélectionner une heure'
            : _heureDepart!.format(context)),
        onTap: () async {
          final TimeOfDay? picked = await showTimePicker(
            context: context,
            initialTime: _heureDepart ?? TimeOfDay.now(),
          );
          if (picked != null) {
            setState(() {
              _heureDepart = picked;
            });
          }
        },
      ),
    );
  }

  Widget _buildReserveButton() {
    return ElevatedButton(
      onPressed: _validateAndReserve,
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 15),
        backgroundColor: Colors.purple,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      child: const Text(
        'Réserver',
        style: TextStyle(fontSize: 18, color: Colors.white),
      ),
    );
  }

  void _validateAndReserve() async {
    if (_formKey.currentState!.validate()) {
      if (_dateDepart == null) {
        _showSnackBar('Veuillez sélectionner une date de départ');
        return;
      }
      if (_heureDepart == null) {
        _showSnackBar('Veuillez sélectionner une heure de départ');
        return;
      }

      final reservationViewModel = Provider.of<ReservationViewModel>(context, listen: false);
      
      final success = await reservationViewModel.createVehiculeReservation(
        token: widget.token,
        villeDepartId: widget.pointDepartId,
        villeDestinationId: widget.destinationId,
        dateReservation: _dateDepart!,
        heureDepart: _heureDepart!,
      );

      if (success) {
        _showSnackBar('Réservation créée avec succès');
        // Rediriger vers la page de réservation actuelle
        Navigator.pushReplacementNamed(context, '/reservation-actuelle');
      } else {
        _showSnackBar(reservationViewModel.errorMessage ?? 'Erreur lors de la réservation');
      }
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.purple,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
} 