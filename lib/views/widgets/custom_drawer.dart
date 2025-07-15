import 'package:flutter/material.dart';

class CustomDrawer extends StatelessWidget {
  final Function(String route) onItemSelected;

  const CustomDrawer({Key? key, required this.onItemSelected}) : super(key: key);

  static const Color primaryColor = Color(0xFF673AB7);
  static const Color accentColor = Color(0xFF9C27B0);

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drawer Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [primaryColor, accentColor],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CircleAvatar(
                    radius: 35,
                    backgroundImage: AssetImage('assets/images/default_avatar.jpg'), // image par défaut
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Chauffeur',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    'chauffeur@email.com',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),
            _buildDrawerItem(Icons.dashboard_rounded, 'Dashboard', '/dashboard'),
            _buildDrawerItem(Icons.pending_actions_rounded, 'En attente', '/pending-reservations'),
            _buildDrawerItem(Icons.check_circle_rounded, 'Confirmés', '/confirmed-reservations'),
            _buildDrawerItem(Icons.person_rounded, 'Profil', '/profile'),
            const Divider(),
            _buildDrawerItem(Icons.logout, 'Déconnexion', '/login', isLogout: true),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem(IconData icon, String label, String route, {bool isLogout = false}) {
    return ListTile(
      leading: Icon(icon, color: isLogout ? Colors.red : primaryColor),
      title: Text(
        label,
        style: TextStyle(
          color: isLogout ? Colors.red : Colors.black87,
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: () => onItemSelected(route),
    );
  }
}
