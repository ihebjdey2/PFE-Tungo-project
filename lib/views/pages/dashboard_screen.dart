import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Espace Client'),
        centerTitle: true,
        backgroundColor: Colors.purple,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView( // ✅ Permet le défilement si nécessaire
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildDashboardCard(
                context,
                icon: Icons.search,
                color: Colors.blue,
                title: 'Nouvelle Recherche',
                subtitle: 'Trouvez des chauffeurs disponibles pour vos trajets.',
                routeName: '/recherche',
              ),
              const SizedBox(height: 16),
              _buildDashboardCard(
                context,
                icon: Icons.person,
                color: Colors.green,
                title: 'Voir Profil',
                subtitle: 'Consultez et mettez à jour vos informations personnelles.',
                routeName: '/profile',
              ),
              const SizedBox(height: 16),
              _buildDashboardCard(
                context,
                icon: Icons.history,
                color: Colors.orange,
                title: 'Historique des Réservations',
                subtitle: 'Consultez vos trajets passés.',
                routeName: '/historique',
              ),
              const SizedBox(height: 16),
              _buildDashboardCard(
                context,
                icon: Icons.timer,
                color: const Color.fromARGB(255, 39, 176, 69),
                title: 'Ma Réservation Actuelle',
                subtitle: 'Voir le statut et les détails de votre réservation en cours.',
                routeName: '/reservation-actuelle',
              ),
              const SizedBox(height: 16),
              _buildDashboardCard(
                context,
                icon: Icons.map,
                color: Colors.red,
                title: 'Afficher la Carte',
                subtitle: 'Voir les trajets et les stations sur la carte.',
                routeName: '/map',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDashboardCard(
    BuildContext context, {
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String routeName,
  }) {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.0),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16.0),
        leading: CircleAvatar(
          radius: 24,
          backgroundColor: color.withOpacity(0.1),
          child: Icon(icon, color: color, size: 28),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(fontSize: 14.0),
        ),
        onTap: () => Navigator.pushNamed(context, routeName),
      ),
    );
  }
}
