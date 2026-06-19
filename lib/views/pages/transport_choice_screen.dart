import 'package:flutter/material.dart';
import '../widgets/custom_card.dart';
import '../widgets/custom_scaffold.dart';

class TransportChoiceScreen extends StatelessWidget {
  const TransportChoiceScreen({super.key});

  void _navigateFor(BuildContext context, String transportType) {
    if (transportType == 'louage') {
      Navigator.pushNamed(context, '/recherche');
    } else {
      Navigator.pushNamed(
        context,
        '/recherche-transport',
        arguments: {'type': transportType}, // Type transport passé à l'écran suivant
      );
    }
  }

  Widget _buildChoiceCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required String transportType,
  }) {
    return CustomCard(
      margin: const EdgeInsets.only(bottom: 16),
      onTap: () => _navigateFor(context, transportType),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(subtitle,
                    style:
                        const TextStyle(fontSize: 13, color: Colors.black54)),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios,
              size: 18, color: Colors.black38),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      title: 'Choisir le type de transport',
      showDrawer: false,
      currentIndex: 0,
      onTabChanged: (int index) {
        // Callback neutre
      },
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 8),
            _buildChoiceCard(
              context: context,
              icon: Icons.directions_car,
              title: 'Louage',
              subtitle: 'Réserver une place ou véhicule entier (louage).',
              color: Colors.blue,
              transportType: 'louage',
            ),
            _buildChoiceCard(
              context: context,
              icon: Icons.directions_bus,
              title: 'Bus',
              subtitle: 'Rechercher des trajets en bus.',
              color: Colors.green,
              transportType: 'bus',
            ),
            _buildChoiceCard(
              context: context,
              icon: Icons.train,
              title: 'Train',
              subtitle: 'Rechercher des trajets en train.',
              color: Colors.deepPurple,
              transportType: 'train',
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Annuler'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
