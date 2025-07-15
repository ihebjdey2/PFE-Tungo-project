import 'package:flutter/material.dart';
import '../widgets/custom_card.dart';
import '../widgets/custom_scaffold.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return CustomScaffold(
      title: 'Espace Client',
      currentIndex: _selectedIndex,
      onTabChanged: _onItemTapped,
      showDrawer: false,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: _buildDashboardContent(),
      ),
    );
  }

  Widget _buildDashboardContent() {
    switch (_selectedIndex) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildDashboardCard(
              icon: Icons.search,
              color: Colors.blue,
              title: 'Nouvelle Recherche',
              subtitle: 'Trouvez un trajet ou réservez un véhicule.',
              routeName: '/recherche',
            ),
            
            _buildDashboardCard(
              icon: Icons.search,
              color: Colors.teal,
              title: 'Suivre un Colis',
              subtitle: 'Suivez votre colis en cours de livraison.',
              routeName: '/suivrecolis',
            ),
            _buildDashboardCard(
              icon: Icons.search,
              color: Colors.teal,
              title: 'voir mes Colis',
              subtitle: 'Suivez votre colis en cours de livraison.',
              routeName: '/colis',
            ),
          ],
        );
      case 1:
        return _buildDashboardCard(
          icon: Icons.timer,
          color: Colors.green,
          title: 'Réservation Actuelle',
          subtitle: 'Consultez votre réservation en cours.',
          routeName: '/reservation-actuelle',
        );
      case 2:
        return _buildDashboardCard(
          icon: Icons.history,
          color: Colors.orange,
          title: 'Historique',
          subtitle: 'Consultez vos anciennes réservations.',
          routeName: '/historique',
        );
      case 3:
        return _buildDashboardCard(
          icon: Icons.person,
          color: Colors.indigo,
          title: 'Profil',
          subtitle: 'Gérez vos informations personnelles.',
          routeName: '/profile',
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildDashboardCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String routeName,
  }) {
    return CustomCard(
      margin: const EdgeInsets.only(bottom: 20),
      onTap: () => Navigator.pushNamed(context, routeName),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 6),
                Text(subtitle, style: const TextStyle(fontSize: 14, color: Colors.black54)),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios, size: 20, color: Colors.black38),
        ],
      ),
    );
  }
}
