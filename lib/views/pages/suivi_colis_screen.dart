
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class SuiviColisScreen extends StatelessWidget {
  final Map<String, dynamic> colis;

  const SuiviColisScreen({super.key, required this.colis});

  @override
  Widget build(BuildContext context) {
    final statut = colis['statut'];
    final stepIndex = _getStepIndex(statut);
    final dateEnvoi = colis['date_envoi'] != null
        ? DateFormat('dd/MM/yyyy à HH:mm').format(DateTime.parse(colis['date_envoi']))
        : 'Inconnue';

    return Scaffold(
      appBar: AppBar(title: const Text('📦 Suivi du colis')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              elevation: 6,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInfo("Description", colis['description'] ?? "-"),
                    _buildInfo("Poids", "${colis['poids'] ?? '-'} kg"),
                    _buildInfo("Date d'envoi", dateEnvoi),
                    _buildInfo("Statut actuel", _getStatutText(statut)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 30),
            AnimatedProgressBarColis(stepIndex: stepIndex),
          ],
        ),
      ),
    );
  }

  Widget _buildInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(Icons.arrow_right, size: 20, color: Colors.deepPurple),
          const SizedBox(width: 8),
          Text("$label : ", style: const TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  int _getStepIndex(String statut) {
    switch (statut) {
      case 'en_attente':
        return 0;
      case 'pris_en_charge':
        return 1;
      case 'en_livraison':
        return 2;
      case 'livré':
      case 'déposé_station':
        return 3;
      default:
        return 0;
    }
  }

  String _getStatutText(String statut) {
    switch (statut) {
      case 'en_attente':
        return 'En attente';
      case 'pris_en_charge':
        return 'Pris en charge';
      case 'en_livraison':
        return 'En livraison';
      case 'livré':
        return 'Livré';
      case 'déposé_station':
        return 'Déposé à la station';
      default:
        return 'Inconnu';
    }
  }
}

class AnimatedProgressBarColis extends StatelessWidget {
  final int stepIndex;

  const AnimatedProgressBarColis({super.key, required this.stepIndex});

  @override
  Widget build(BuildContext context) {
    final steps = ['En attente', 'Pris en charge', 'En livraison', 'Terminé'];

    return Column(
      children: [
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 500),
          child: Text(
            steps[stepIndex],
            key: ValueKey<int>(stepIndex),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.deepPurple),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: List.generate(4, (index) {
            bool isActive = index <= stepIndex;
            return Expanded(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: isActive ? Colors.deepPurple : Colors.grey[300],
                    child: isActive
                        ? const Icon(Icons.check, color: Colors.white, size: 16)
                        : Text(
                            '${index + 1}',
                            style: const TextStyle(color: Colors.black87),
                          ),
                  ),
                  if (index < 3)
                    Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 400),
                        height: 4,
                        color: index < stepIndex ? Colors.deepPurple : Colors.grey[300],
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
