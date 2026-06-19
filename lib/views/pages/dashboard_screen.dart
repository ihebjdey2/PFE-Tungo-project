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
    // On met le contenu principal + FAB dans un Stack afin d'avoir le FAB flottant
    final Widget mainContent = SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: _buildDashboardContent(),
    );

    final Widget floatingButton = Positioned(
      right: 20,
      bottom: 24,
      child: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, '/chat'); // route vers ton écran ChatBot
        },
        backgroundColor: Colors.deepPurple,
        child: const Icon(Icons.chat_bubble_outline, size: 28),
        tooltip: 'Ouvrir le ChatBot',
      ),
    );

    return CustomScaffold(
      title: 'Espace Client',
      currentIndex: _selectedIndex,
      onTabChanged: _onItemTapped,
      showDrawer: false,
      // On passe un Stack comme body : contenu + FAB positionné
      body: SizedBox(
        // SizedBox pour s'assurer que le Stack prend bien tout l'espace disponible
        width: double.infinity,
        height: MediaQuery.of(context).size.height -
            // On retire la hauteur de la barre d'app (approx) pour éviter overflow
            kToolbarHeight -
            MediaQuery.of(context).padding.top,
        child: Stack(
          children: [
            // contenu principal (scrollable)
            Positioned.fill(child: mainContent),
            // Floating button positionné
            floatingButton,
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardContent() {
    switch (_selectedIndex) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Un seul bouton de recherche qui ouvre l'interface de choix du transport
            _buildDashboardCard(
              icon: Icons.search,
              color: Colors.blue,
              title: 'Recherche',
              subtitle: 'Trouvez un trajet : louage, bus ou train.',
              routeName: '/choix-transport', // nouvelle route intermédiaire
            ),
            _buildDashboardCard(
              icon: Icons.local_shipping,
              color: Colors.teal,
              title: 'Suivre un Colis',
              subtitle: 'Suivez votre colis en cours de livraison.',
              routeName: '/suivrecolis',
            ),
            _buildDashboardCard(
              icon: Icons.list_alt,
              color: Colors.teal,
              title: 'Voir mes Colis',
              subtitle: 'Consultez vos colis et statuts.',
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
