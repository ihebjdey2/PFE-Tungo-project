import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../viewmodels/profile_viewmodel.dart';

class EditProfileScreen extends StatefulWidget {
  @override
  _EditProfileScreenState createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  String? nom;
  String? prenom;
  String? email;
  String? adresse;
  String? languePreference = 'fr';
  String? numeroDeTelephone;
  String? motDePasse;
  File? _selectedImage;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileViewModel = Provider.of<ProfileViewModel>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Modifier le profil'),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          // Dégradé d'arrière-plan
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
              child: Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16.0),
                ),
                elevation: 8.0,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Modifier votre profil',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        if (_selectedImage != null)
                          Center(
                            child: Image.file(
                              _selectedImage!,
                              height: 150,
                              width: 150,
                              fit: BoxFit.cover,
                            ),
                          ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _pickImage,
                          icon: const Icon(Icons.photo),
                          label: const Text('Choisir une image'),
                        ),
                        const SizedBox(height: 16),
                        ..._buildTextFields(),
                        const SizedBox(height: 16),
                        _buildLanguePreferenceDropdown(),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () async {
                            if (_formKey.currentState!.validate()) {
                              _formKey.currentState!.save();
                              final success = await profileViewModel.updateProfile(
                                nom: nom,
                                prenom: prenom,
                                email: email,
                                adresse: adresse,
                                languePreference: languePreference,
                                numeroDeTelephone: numeroDeTelephone,
                                motDePasse: motDePasse,
                                image: _selectedImage, // Passez l'image ici
                              );
                              if (success) {
                                Navigator.pop(context, true);
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(profileViewModel.errorMessage ?? 'Erreur inconnue.')),
                                );
                              }
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 50),
                          ),
                          child: const Text('Enregistrer'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildTextFields() {
    return [
      _buildTextField(
        label: 'Nom',
        onSaved: (value) => nom = value,
      ),
      const SizedBox(height: 16),
      _buildTextField(
        label: 'Prénom',
        onSaved: (value) => prenom = value,
      ),
      const SizedBox(height: 16),
      _buildTextField(
        label: 'Email',
        keyboardType: TextInputType.emailAddress,
        onSaved: (value) => email = value,
      ),
      const SizedBox(height: 16),
      _buildTextField(
        label: 'Adresse',
        onSaved: (value) => adresse = value,
      ),
      const SizedBox(height: 16),
      _buildTextField(
        label: 'Numéro de téléphone',
        keyboardType: TextInputType.phone,
        onSaved: (value) => numeroDeTelephone = value,
      ),
      const SizedBox(height: 16),
      _buildTextField(
        label: 'Mot de passe',
        obscureText: true,
        onSaved: (value) => motDePasse = value,
      ),
    ];
  }

  Widget _buildLanguePreferenceDropdown() {
    return DropdownButtonFormField<String>(
      value: languePreference,
      items: const [
        DropdownMenuItem(value: 'ar', child: Text('Arabe')),
        DropdownMenuItem(value: 'fr', child: Text('Français')),
        DropdownMenuItem(value: 'en', child: Text('Anglais')),
      ],
      onChanged: (value) {
        setState(() {
          languePreference = value;
        });
      },
      decoration: const InputDecoration(
        labelText: 'Langue Préférée',
        border: OutlineInputBorder(),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    TextInputType keyboardType = TextInputType.text,
    bool obscureText = false,
    required void Function(String?) onSaved,
  }) {
    return TextFormField(
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      keyboardType: keyboardType,
      obscureText: obscureText,
      onSaved: onSaved,
    );
  }
}
