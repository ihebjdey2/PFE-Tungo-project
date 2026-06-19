import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';  // 🔹 Pour formater les dates
import '../../viewmodels/recherche_viewmodel.dart';
import '../../viewmodels/reservation_viewmodel.dart';
import '../../models/chauffeur_position.dart';
import 'package:logger/logger.dart';

class ChauffeursDisponiblesScreen extends StatefulWidget {
  final int pointDepartId;
  final int destinationId;
  final String token;

  const ChauffeursDisponiblesScreen({
    super.key,
    required this.pointDepartId,
    required this.destinationId,
    required this.token,
  });

  @override
  ChauffeursDisponiblesScreenState createState() => ChauffeursDisponiblesScreenState();
}

class ChauffeursDisponiblesScreenState extends State<ChauffeursDisponiblesScreen> {
  final Logger _logger = Logger();
  late Future<List<ChauffeurPosition>> _chauffeursFuture;
  ChauffeurPosition? selectedChauffeur;
  int? selectedPlaces;

  

  @override
  void initState() {
    super.initState();
    final rechercheViewModel = Provider.of<RechercheViewModel>(context, listen: false);
    
    // Récupérer les stations et les chauffeurs
    rechercheViewModel.fetchStationsPourTrajet();
    _chauffeursFuture = _fetchChauffeurs();
  }

  Future<List<ChauffeurPosition>> _fetchChauffeurs() async {
    final rechercheViewModel = Provider.of<RechercheViewModel>(context, listen: false);

    try {
      final chauffeurs = await rechercheViewModel.fetchChauffeursDisponibles(widget.token);
      
      if (chauffeurs.isEmpty) {
        _logger.w("Aucun chauffeur trouvé.");
      }

      return chauffeurs;
    } catch (e) {
      _logger.e("Erreur lors de la récupération des chauffeurs : $e");
      return [];
    }
  }

      Future<void> _reserverChauffeur(int chauffeurId) async {
      final reservationViewModel = Provider.of<ReservationViewModel>(context, listen: false);
      final success = await reservationViewModel.createReservation(
        token: widget.token,
        chauffeurId: chauffeurId,
        villeDepartId: widget.pointDepartId,
        villeDestinationId: widget.destinationId,
        nombre_places: selectedPlaces!,
      );

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Réservation confirmée!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Échec de la réservation.')),
        );
      }
    }


  void _showErrorAndGoBack(String message) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final rechercheViewModel = Provider.of<RechercheViewModel>(context);

    return Scaffold(
      backgroundColor: Colors.grey[200], 
      appBar: AppBar(
        title: const Text('Chauffeurs Disponibles'),
        centerTitle: true,
        backgroundColor: Colors.purple,
        elevation: 0,
      ),
      body: Column(
        children: [
          // 🔹 Affichage des stations de départ et d'arrivée
          if (rechercheViewModel.stationDepart != null && rechercheViewModel.stationArrivee != null)
            Padding(
              padding: const EdgeInsets.all(10.0),
              child: Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                elevation: 5,
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildStationInfo("Station de Départ", rechercheViewModel.stationDepart!),
                      const SizedBox(height: 10),
                      _buildStationInfo("Station d'Arrivée", rechercheViewModel.stationArrivee!),
                    ],
                  ),
                ),
              ),
            ),

          Expanded(
            child: FutureBuilder<List<ChauffeurPosition>>(
              future: _chauffeursFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError || snapshot.data == null) {
                  return _buildErrorScreen(context, 'Erreur lors de la récupération des chauffeurs.', 'Retour');
                } else if (snapshot.data!.isEmpty) {
                  return _buildErrorScreen(context, 'Aucun chauffeur disponible pour cet itinéraire.', 'Retour');
                }

                final chauffeurs = snapshot.data!;
                return ListView.builder(
                  padding: const EdgeInsets.all(10),
                  itemCount: chauffeurs.length,
                  itemBuilder: (context, index) {
                    return _buildChauffeurCard(chauffeurs[index]);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// 🔹 Widget pour afficher les informations d'une station
  Widget _buildStationInfo(String title, Map<String, dynamic> station) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.purple)),
        const SizedBox(height: 5),
        Text("📍 ${station['nom']}", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        Text("📌 ${station['adresse']}", style: const TextStyle(fontSize: 12, color: Colors.grey)),
        Text("📞 ${station['telephone']}", style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  /// 🔹 Widget pour afficher la carte d'un chauffeur
  /// 🔹 Widget pour afficher la carte d'un chauffeur
Widget _buildChauffeurCard(ChauffeurPosition chauffeur) {
  final isSelected = selectedChauffeur == chauffeur;

  return GestureDetector(
    onTap: () => setState(() {
      selectedChauffeur = isSelected ? null : chauffeur;
      selectedPlaces = null;
    }),
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: Colors.purple.withOpacity(0.1),
                backgroundImage: (chauffeur.image != null && chauffeur.image!.isNotEmpty)
                    ? NetworkImage(chauffeur.image!)
                    : null,
                child: (chauffeur.image == null || chauffeur.image!.isEmpty)
                    ? const Icon(Icons.person, color: Colors.purple, size: 30)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "🚖 ${chauffeur.nom} ${chauffeur.prenom}",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        const Icon(Icons.directions_car, color: Colors.blueGrey, size: 18),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            "${chauffeur.marqueVehicule} ${chauffeur.modeleVehicule} - ${chauffeur.numeroPlaque}",
                            style: const TextStyle(fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        const Icon(Icons.people, color: Colors.orange, size: 18),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            "Places disponibles: ${chauffeur.capacite}",
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: Colors.green, size: 18),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            "Départ: ${chauffeur.villeDepart}",
                            style: const TextStyle(fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        const Icon(Icons.flag, color: Colors.red, size: 18),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            "Destination: ${chauffeur.villeDestination}",
                            style: const TextStyle(fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.access_time, color: Colors.grey, size: 16),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            "Dernière mise à jour: ${DateFormat('yyyy-MM-dd HH:mm').format(chauffeur.derniereMiseAJour)}",
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (isSelected) const SizedBox(height: 12),
          if (isSelected)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Sélectionnez le nombre de places :",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 5),
                DropdownButton<int>(
                  value: selectedPlaces,
                  hint: const Text("Choisir"),
                  onChanged: (value) {
                    setState(() {
                      selectedPlaces = value;
                    });
                  },
                  items: List.generate(chauffeur.capacite, (index) => index + 1)
                      .map((e) => DropdownMenuItem<int>(
                            value: e,
                            child: Text("$e place(s)"),
                          ))
                      .toList(),
                ),
                if (selectedPlaces != null)
                  Align(
                    alignment: Alignment.center,
                    child: ElevatedButton(
                      onPressed: () => _reserverChauffeur(chauffeur.chauffeurId),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      ),
                      child: const Text(
                        'Réserver',
                        style: TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ),
                  ),
              ],
            ),
        ],
      ),
    ),
  );
}


  /// 🔹 Widget pour afficher un message d'erreur
  Widget _buildErrorScreen(BuildContext context, String message, String buttonText) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error, color: Colors.red, size: 40),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.purple, minimumSize: const Size(150, 40)),
            child: Text(buttonText, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}