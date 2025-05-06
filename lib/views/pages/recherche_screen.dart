import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/recherche_viewmodel.dart';
import '../../viewmodels/auth_viewmodel.dart';
import 'chauffeurs_disponibles_screen.dart';

class RechercheScreen extends StatefulWidget {
  @override
  _RechercheScreenState createState() => _RechercheScreenState();
}

class _RechercheScreenState extends State<RechercheScreen> {
  Map<String, dynamic>? _pointDepart;
  Map<String, dynamic>? _destination;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final rechercheViewModel = Provider.of<RechercheViewModel>(context, listen: false);
      rechercheViewModel.fetchVilles();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authViewModel = Provider.of<AuthViewModel>(context, listen: false);
    final token = authViewModel.token;

    return Scaffold(
      backgroundColor: Colors.grey[200],  // 🔹 Fond légèrement coloré pour un design plus épuré
      appBar: AppBar(
        title: const Text('Nouvelle Recherche'),
        centerTitle: true,
        backgroundColor: Colors.purple,
        elevation: 0,  // 🔹 Flat design
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Consumer<RechercheViewModel>(
          builder: (context, rechercheViewModel, child) {
            if (rechercheViewModel.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (rechercheViewModel.errorMessage != null) {
              return Center(
                child: Text(
                  rechercheViewModel.errorMessage!,
                  style: const TextStyle(color: Colors.red, fontSize: 16),
                ),
              );
            }

            if (rechercheViewModel.villes.isEmpty) {
              return const Center(child: Text('Aucune ville disponible', style: TextStyle(fontSize: 16)));
            }

            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildDropdownCard(
                    label: 'Point de départ',
                    selectedValue: _pointDepart,
                    villes: rechercheViewModel.villes,
                    onChanged: (selectedVille) {
                      setState(() {
                        _pointDepart = selectedVille;
                      });
                      rechercheViewModel.setPointDepart(selectedVille?['id']);
                    },
                    icon: Icons.location_on,  // 📍 Ajout d'icône
                  ),
                  const SizedBox(height: 20),
                  _buildDropdownCard(
                    label: 'Destination',
                    selectedValue: _destination,
                    villes: rechercheViewModel.villes,
                    onChanged: (selectedVille) {
                      setState(() {
                        _destination = selectedVille;
                      });
                      rechercheViewModel.setDestination(selectedVille?['id']);
                    },
                    icon: Icons.flag,  // 🏁 Ajout d'icône
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: () async {
                    if (token == null) {
                      _showSnackBar(context, 'Veuillez vous reconnecter.');
                      return;
                    }

                    if (!_validateInputs(context)) {
                      return;
                    }

                    final success = await rechercheViewModel.createRecherche(token);
                    if (success) {
                      _showSnackBar(context, 'Recherche mise à jour avec succès');

                      // 🔹 Charger les stations avant d'afficher les chauffeurs
                      await rechercheViewModel.fetchStationsPourTrajet(); 

                      _navigateToChauffeursDisponiblesScreen(
                        context,
                        token,
                        _pointDepart!['id'],
                        _destination!['id'],
                      );
                    } else {
                      _showSnackBar(
                        context,
                        rechercheViewModel.errorMessage ?? 'Erreur inconnue.',
                      );
                    }
                  },

                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.all(15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      backgroundColor: Colors.purple,
                    ),
                    child: const Text('Créer une Recherche', style: TextStyle(fontSize: 16, color: Colors.white)),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  /// 🔹 Widget amélioré pour le `DropdownButtonFormField`
  Widget _buildDropdownCard({
    required String label,
    required Map<String, dynamic>? selectedValue,
    required List<Map<String, dynamic>> villes,
    required ValueChanged<Map<String, dynamic>?> onChanged,
    required IconData icon,
  }) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      elevation: 5,  // 🌟 Ajout d'une ombre pour un effet relief
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.purple, size: 24),  // Ajout de l'icône
                const SizedBox(width: 10),
                Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<Map<String, dynamic>>(
              value: selectedValue,
              onChanged: onChanged,
              decoration: const InputDecoration(border: InputBorder.none),
              items: villes.map<DropdownMenuItem<Map<String, dynamic>>>((ville) {
                return DropdownMenuItem<Map<String, dynamic>>(
                  value: ville,
                  child: Text(ville['nom'], style: const TextStyle(fontSize: 14)),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  /// 🔹 Validation des champs pour vérifier que les villes sont différentes
  bool _validateInputs(BuildContext context) {
    if (_pointDepart == null || _destination == null) {
      _showSnackBar(context, 'Veuillez sélectionner un point de départ et une destination.');
      return false;
    }

    if (_pointDepart!['id'] == _destination!['id']) {
      _showSnackBar(context, 'Le point de départ et la destination doivent être différents.');
      return false;
    }

    return true;
  }

  /// 🔹 Fonction pour afficher un message SnackBar
  void _showSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// 🔹 Fonction pour naviguer vers l'écran des chauffeurs disponibles
  void _navigateToChauffeursDisponiblesScreen(
    BuildContext context,
    String token,
    int pointDepartId,
    int destinationId,
  ) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChauffeursDisponiblesScreen(
          pointDepartId: pointDepartId,
          destinationId: destinationId,
          token: token,
        ),
      ),
    );
  }
}
