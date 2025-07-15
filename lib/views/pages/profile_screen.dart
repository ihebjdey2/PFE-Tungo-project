import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/profile_viewmodel.dart';
import 'editprofil_screen.dart';

class ProfileScreen extends StatefulWidget {
  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ProfileViewModel>(context, listen: false).fetchProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final profileViewModel = Provider.of<ProfileViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Client'),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          // Fond dégradé
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.purple, Colors.white],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: profileViewModel.isLoading
                  ? const CircularProgressIndicator()
                  : profileViewModel.errorMessage != null
                      ? Center(
                          child: Text(
                            profileViewModel.errorMessage!,
                            style: const TextStyle(color: Colors.red, fontSize: 18),
                          ),
                        )
                      : profileViewModel.profileData == null
                          ? const Center(
                              child: Text(
                                'Aucune donnée de profil trouvée.',
                                style: TextStyle(fontSize: 18),
                              ),
                            )
                          : Card(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16.0),
                              ),
                              elevation: 8.0,
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Center(
                                      child: CircleAvatar(
                                        radius: 50,
                                        backgroundImage: profileViewModel
                                                        .profileData!['Utilisateur']['image'] !=
                                                    null &&
                                                profileViewModel
                                                        .profileData!['Utilisateur']['image'] !=
                                                    ''
                                            ? NetworkImage(
                                                'http://10.0.2.2:3000/uploads/${profileViewModel.profileData!['Utilisateur']['image']}',
                                              )
                                            : const AssetImage(
                                                'assets/images/default_avatar.jpg',
                                              ) as ImageProvider,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    const Text(
                                      'Informations du profil',
                                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 16),
                                    _buildProfileInfoRow(
                                      label: 'Nom',
                                      value: profileViewModel.profileData!['Utilisateur']['nom'] ??
                                          'Non spécifié',
                                    ),
                                    const SizedBox(height: 8),
                                    _buildProfileInfoRow(
                                      label: 'Prénom',
                                      value: profileViewModel.profileData!['Utilisateur']['prenom'] ??
                                          'Non spécifié',
                                    ),
                                    const SizedBox(height: 8),
                                    _buildProfileInfoRow(
                                      label: 'Email',
                                      value: profileViewModel.profileData!['Utilisateur']['email'] ??
                                          'Non spécifié',
                                    ),
                                    const SizedBox(height: 8),
                                    _buildProfileInfoRow(
                                      label: 'Adresse',
                                      value: profileViewModel.profileData!['adresse'] ??
                                          'Non spécifié',
                                    ),
                                    const SizedBox(height: 8),
                                    _buildProfileInfoRow(
                                      label: 'Langue Préférée',
                                      value: profileViewModel.profileData!['languePreference'] ??
                                          'Non spécifié',
                                    ),
                                    const SizedBox(height: 8),
                                    _buildProfileInfoRow(
                                      label: 'Numéro de Téléphone',
                                      value: profileViewModel.profileData!['Utilisateur']
                                              ['numeroDeTelephone'] ??
                                          'Non spécifié',
                                    ),
                                    const SizedBox(height: 24),
                                    Center(
                                      child: ElevatedButton(
                                        onPressed: () async {
                                          final success = await Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => EditProfileScreen(),
                                            ),
                                          );
                                          if (success == true) {
                                            await profileViewModel.fetchProfile();
                                          }
                                        },
                                        style: ElevatedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 32, vertical: 12),
                                        ),
                                        child: const Text('Modifier le profil'),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileInfoRow({required String label, required String? value}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          '$label :',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        Flexible(
          child: Text(
            value ?? 'Non spécifié', // Gère les valeurs nulles ici
            style: const TextStyle(fontSize: 16),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}
